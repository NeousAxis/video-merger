

import os
import json
import asyncio
from datetime import datetime, timedelta, time
from telegram import Update
from telegram.ext import Application, CommandHandler, ContextTypes
import web3 

from detector import get_projects, update_opportunities_db
from scorer import score_project
from actions import get_project_actions
from utils.load_json_db import load_json_db
from wallet import get_eth_balance 
from utils.wallet_aliases import WALLETS # Importation des alias

# --- Configuration ---
TELEGRAM_TOKEN = "8128622249:AAGPRo66SwZ6yakjM0E1nx3pCJ2ixFABUF0"
OPPORTUNITIES_DB_PATH = 'database/opportunities.json'
EXPOSITIONS_DB_PATH = 'database/expositions.json'
KNOWN_PROJECTS_DB_PATH = 'database/known_projects.json' # Pour le suivi des alertes
LOG_FILE_PATH = 'logs/validation.log'

# Remplacez par votre ID de chat pour recevoir les alertes.
# Vous pouvez l'obtenir en envoyant la commande /my_id au bot.
ALERT_CHAT_ID = 1524063766

# --- Fonctions de la base de données ---
# La fonction load_json_db est importée depuis utils/load_json_db.py

def save_json_db(data, path):
    with open(path, 'w') as f:
        json.dump(data, f, indent=2)

def log_validation(message):
    now = datetime.utcnow().isoformat() + "Z"
    with open(LOG_FILE_PATH, 'a') as f:
        f.write(f"[{now}] {message}\n")

# --- Tâche Planifiée ---
async def scan_for_opportunities_job(context: ContextTypes.DEFAULT_TYPE):
    if not ALERT_CHAT_ID:
        print("ALERT_CHAT_ID non configuré. Impossible d'envoyer des alertes.")
        return

    print("Exécution du scan automatique...")
    # Met à jour la DB des opportunités en scrapant les sources
    newly_added_count = update_opportunities_db()

    if newly_added_count > 0:
        message = f"🔔 Alerte Airdrop ! {newly_added_count} nouvelles opportunités détectées !\n\n"
        # Pour l'instant, on ne détaille pas ici, l'utilisateur peut faire /opportunites
        message += "Utilisez /opportunites pour les découvrir.\n"
        await context.bot.send_message(chat_id=ALERT_CHAT_ID, text=message)
    else:
        print("Aucune nouvelle opportunité trouvée lors du scan.")

async def send_bot_active_alert(context: ContextTypes.DEFAULT_TYPE):
    if ALERT_CHAT_ID:
        await context.bot.send_message(chat_id=ALERT_CHAT_ID, text="🤖 Le bot est actif et en veille.")

async def send_daily_report(context: ContextTypes.DEFAULT_TYPE):
    if not ALERT_CHAT_ID:
        return

    opportunities = load_json_db(OPPORTUNITIES_DB_PATH)
    expositions = load_json_db(EXPOSITIONS_DB_PATH)

    report = "📊 Rapport Journalier (20h00) 📊\n\n"
    report += f"Opportunités en attente : {len(opportunities)} projets.\n"
    report += f"Projets en suivi (validés) : {len(expositions)} projets.\n\n"

    if opportunities:
        report += "Quelques opportunités actuelles :\n"
        for project in opportunities[:3]: # Liste les 3 premières
            score, details = score_project(project)
            report += f"- {project['name']} (Score: {score})\n"
    else:
        report += "Pas de nouvelles opportunités en attente.\n"

    await context.bot.send_message(chat_id=ALERT_CHAT_ID, text=report)

async def send_weekly_report(context: ContextTypes.DEFAULT_TYPE):
    if not ALERT_CHAT_ID:
        return

    expositions = load_json_db(EXPOSITIONS_DB_PATH)
    opportunities = load_json_db(OPPORTUNITIES_DB_PATH)

    report = "🗓️ Rapport Hebdomadaire (Vendredi 17h30) 🗓️\n\n"
    report += f"Total projets en suivi : {len(expositions)}\n"
    report += f"Total opportunités en attente : {len(opportunities)}\n\n"

    one_week_ago = datetime.utcnow() - timedelta(weeks=1)
    validated_this_week = [
        p for p in expositions
        if datetime.fromisoformat(p['validated_at'].replace('Z', '+00:00')) > one_week_ago
    ]
    report += f"Projets validés cette semaine : {len(validated_this_week)}\n\n"

    if validated_this_week:
        report += "Derniers projets validés cette semaine :\n"
        for project in validated_this_week:
            report += f"- {project['name']} (Validé le: {project['validated_at'][:10]})\n"
    else:
        report += "Aucun projet validé cette semaine.\n"

    await context.bot.send_message(chat_id=ALERT_CHAT_ID, text=report)

# --- Commandes du Bot ---
async def start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    await update.message.reply_text(
        "Bonjour ! Je suis le Collecteur IA L2/Testnet.\n"
        "Utilisez /opportunites pour voir les projets.\n"
        "Utilisez /my_id pour obtenir votre ID de chat pour les alertes."
    )

async def my_id(update: Update, context: ContextTypes.DEFAULT_TYPE):
    chat_id = update.message.chat_id
    await update.message.reply_text(f"Votre ID de chat est : `{chat_id}`\n\n"
                                     "Veuillez le copier et le coller dans la variable `ALERT_CHAT_ID` "
                                     "du fichier `telegram_bot.py`.")

async def opportunites(update: Update, context: ContextTypes.DEFAULT_TYPE):
    projects = get_projects()
    if not projects:
        await update.message.reply_text("Aucune opportunité trouvée pour le moment.")
        return

    response = "🔥 Opportunités d'Airdrop Détectées 🔥\n\n"
    for project in projects:
        score, details = score_project(project)
        response += details + "\n"
        response += f" Description : {project['description']}\n"
        response += get_project_actions(project)
        response += "\n--------------------\n\n"

    await update.message.reply_text(response)

async def valider(update: Update, context: ContextTypes.DEFAULT_TYPE):
    try:
        project_name_arg = " ".join(context.args).strip() # Supprime les espaces en début/fin
        print(f"[DEBUG] Commande /valider reçue avec argument: '{project_name_arg}'")
        if not project_name_arg:
            await update.message.reply_text("Usage: /valider <nom_du_projet>")
            return

        # Normalisation de l'argument pour la comparaison
        normalized_arg = ' '.join(project_name_arg.lower().split())

        opportunities = load_json_db(OPPORTUNITIES_DB_PATH)
        expositions = load_json_db(EXPOSITIONS_DB_PATH) # Maintenant une liste

        print(f"[DEBUG] Opportunités actuelles: {[p['name'] for p in opportunities]}")

        project_to_validate = None
        for i, project in enumerate(opportunities):
            # Normalisation du nom du projet pour la comparaison
            normalized_project_name = ' '.join(project['name'].lower().split())
            print(f"[DEBUG] Comparaison: '{normalized_project_name}' vs '{normalized_arg}'")
            if normalized_project_name == normalized_arg:
                project_to_validate = project
                opportunities.pop(i) # Supprime de la liste des opportunités
                print(f"[DEBUG] Projet '{project_to_validate['name']}' trouvé et supprimé des opportunités.")
                break

        if not project_to_validate:
            print(f"[DEBUG] Projet '{project_name_arg}' non trouvé dans la liste des opportunités.")
            await update.message.reply_text(f"❌ Projet '{project_name_arg}' non trouvé dans la liste des opportunités en attente.")
            return

        # Enrichir l'entrée pour l'historique
        now = datetime.utcnow().isoformat() + "Z"
        validated_entry = {
            "name": project_to_validate['name'],
            "validated_at": now,
            "status": "validé", # Indique que les actions ont été complétées et le suivi commence
            "score": score_project(project_to_validate)[0],
            "actions_effectuees": project_to_validate.get('actions', []),
            "source": project_to_validate.get('source', 'Manuel'),
            "url": project_to_validate.get('url', 'N/A')
        }
        expositions.append(validated_entry) # append fonctionne maintenant

        save_json_db(opportunities, OPPORTUNITIES_DB_PATH)
        save_json_db(expositions, EXPOSITIONS_DB_PATH)

        log_validation(f"Projet validé : {project_to_validate['name']}")
        await update.message.reply_text(f"✅ Projet '{project_to_validate['name']}' marqué comme validé et archivé.")

    except Exception as e:
        print(f"[ERROR] Erreur dans /valider : {e}")
        await update.message.reply_text("Une erreur est survenue lors de la validation du projet.")

async def suivi(update: Update, context: ContextTypes.DEFAULT_TYPE):
    try:
        project_name_arg = " ".join(context.args).strip()
        print(f"[DEBUG] Commande /suivi reçue avec argument: '{project_name_arg}'")
        if not project_name_arg:
            await update.message.reply_text("Usage: /suivi <nom_du_projet>")
            return

        normalized_arg = ' '.join(project_name_arg.lower().split())
        expositions = load_json_db(EXPOSITIONS_DB_PATH)

        print(f"[DEBUG] Projets dans expositions.json: {[p['name'] for p in expositions]}")

        found_project = None
        for project in expositions:
            normalized_project_name = ' '.join(project['name'].lower().split())
            print(f"[DEBUG] Comparaison (suivi): '{normalized_project_name}' vs '{normalized_arg}'")
            if normalized_project_name == normalized_arg:
                found_project = project
                print(f"[DEBUG] Projet '{found_project['name']}' trouvé dans expositions.json.")
                break

        if found_project:
            response = f"🔍 Détails du suivi pour {found_project['name']} :\n"
            response += f" Statut : {found_project.get('status', 'Inconnu')}\n"
            response += f" Validé le : {found_project.get('validated_at', 'N/A')}\n"
            response += f" Score au moment de la validation : {found_project.get('score', 'N/A')}\n"
            response += f" Source : {found_project.get('source', 'N/A')}\n"
            if found_project.get('url') and found_project['url'] != 'N/A':
                response += f" URL : {found_project['url']}\n"
            if found_project.get('actions_effectuees'):
                response += " Actions effectuées (proposées) :\n"
                for action in found_project['actions_effectuees']:
                    response += f"  - {action}\n"
            await update.message.reply_text(response)
        else:
            print(f"[DEBUG] Projet '{project_name_arg}' non trouvé dans la liste de suivi.")
            await update.message.reply_text(f"❌ Projet '{project_name_arg}' non trouvé dans votre liste de suivi.")

    except Exception as e:
        print(f"[ERROR] Erreur dans /suivi : {e}")
        await update.message.reply_text("Une erreur est survenue lors de la recherche du suivi.")

async def wallet_info(update: Update, context: ContextTypes.DEFAULT_TYPE):
    try:
        address_to_check = None
        wallet_name_display = None

        full_command_text = update.message.text.strip().lstrip('/')

        # Case 1: /wallet_info (for principal wallet)
        if full_command_text == "wallet_info" and not context.args:
            address_to_check = WALLETS.get("principal")
            wallet_name_display = "principal"
            if not address_to_check:
                await update.message.reply_text("❌ Le portefeuille 'principal' n'est pas configuré dans WALLETS.")
                return

        # Case 2: /wallet_info_<alias>
        elif full_command_text.startswith("wallet_info_"):
            alias_key = full_command_text[len("wallet_info_"):]
            address_to_check = WALLETS.get(alias_key)
            wallet_name_display = alias_key
            if not address_to_check:
                await update.message.reply_text(f"❌ Alias de portefeuille '{alias_key}' non reconnu.")
                return

        # Case 3: /wallet_info <address>
        elif context.args:
            address_to_check = context.args[0]
            wallet_name_display = address_to_check # Display the address itself
            # Basic validation for user feedback
            if not web3.Web3.is_address(address_to_check):
                await update.message.reply_text("⚠️ Adresse Ethereum invalide.")
                return

        else:
            # Fallback for incorrect usage
            await update.message.reply_text("Usage: /wallet_info (pour principal) ou /wallet_info_<alias> ou /wallet_info <adresse_ethereum>")
            return

        # Now, use address_to_check
        print(f"[DEBUG] Récupération du solde pour l'adresse: {address_to_check} (Nom: {wallet_name_display})")
        balance = get_eth_balance(address_to_check)

        if isinstance(balance, str) and balance.startswith("❌"):
            await update.message.reply_text(f"Erreur: {balance}")
        elif isinstance(balance, str) and balance.startswith("⚠️"): # For invalid address from wallet.py
            await update.message.reply_text(f"{balance}")
        elif balance is not None:
            await update.message.reply_text(f"Solde ETH pour {wallet_name_display} ({address_to_check}) : {balance} ETH")
        else:
            await update.message.reply_text("Impossible de récupérer le solde ETH. Vérifiez l'adresse ou la connexion au réseau.")

    except Exception as e:
        print(f"[ERROR] Erreur dans /wallet_info : {e}")
        await update.message.reply_text("Une erreur est survenue lors de la récupération des informations du portefeuille.")

def main():
    """Lance le bot et le planificateur.""" 
    application = Application.builder().token(TELEGRAM_TOKEN).build()

    # Commandes
    application.add_handler(CommandHandler("start", start))
    application.add_handler(CommandHandler("my_id", my_id))
    application.add_handler(CommandHandler("opportunites", opportunites))
    application.add_handler(CommandHandler("valider", valider))
    application.add_handler(CommandHandler("suivi", suivi)) 
    application.add_handler(CommandHandler("wallet_info", wallet_info)) # Ajout du handler pour /wallet_info

    # Tâches planifiées avec JobQueue
    # 9h00: propositions qualifiées d’airdrops + alerte Bot Actif
    application.job_queue.run_daily(
        lambda context: asyncio.create_task(scan_for_opportunities_job(context)),
        time=time(9, 0),
        chat_id=ALERT_CHAT_ID
    )
    application.job_queue.run_daily(
        lambda context: asyncio.create_task(send_bot_active_alert(context)),
        time=time(9, 0),
        chat_id=ALERT_CHAT_ID
    )

    # 14h00: propositions qualifiées d’airdrops
    application.job_queue.run_daily(
        lambda context: asyncio.create_task(scan_for_opportunities_job(context)),
        time=time(14, 0),
        chat_id=ALERT_CHAT_ID
    )

    # 20h00: rapport journalier + alerte Bot Actif
    application.job_queue.run_daily(
        lambda context: asyncio.create_task(send_daily_report(context)),
        time=time(20, 0),
        chat_id=ALERT_CHAT_ID
    )
    application.job_queue.run_daily(
        lambda context: asyncio.create_task(send_bot_active_alert(context)),
        time=time(20, 0),
        chat_id=ALERT_CHAT_ID
    )

    # Vendredi 17h30: rapport hebdomadaire
    application.job_queue.run_daily(
        lambda context: asyncio.create_task(send_weekly_report(context)),
        time=time(17, 30),
        days=(4,), # Friday
        chat_id=ALERT_CHAT_ID
    )

    print("Bot démarré avec scan automatique toutes les 12 heures... (Version JobQueue et Logique de Validation Améliorée)")
    application.run_polling()

if __name__ == "__main__":
    # Initialisation des fichiers DB s'ils n'existent pas
    if not os.path.exists('database'):
        os.makedirs('database')
    if not os.path.exists('logs'):
        os.makedirs('logs')

    # Utilisation de la nouvelle fonction load_json_db pour l'initialisation
    # Assure que les fichiers sont des listes vides si non existants ou corrompus
    if not os.path.exists(OPPORTUNITIES_DB_PATH):
        save_json_db(load_json_db(OPPORTUNITIES_DB_PATH, default=[]), OPPORTUNITIES_DB_PATH)
    if not os.path.exists(EXPOSITIONS_DB_PATH):
        save_json_db(load_json_db(EXPOSITIONS_DB_PATH, default=[]), EXPOSITIONS_DB_PATH)
    if not os.path.exists(KNOWN_PROJECTS_DB_PATH):
        save_json_db(load_json_db(KNOWN_PROJECTS_DB_PATH, default=[]), KNOWN_PROJECTS_DB_PATH)

    main()
