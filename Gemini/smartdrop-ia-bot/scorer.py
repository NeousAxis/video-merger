def score_project(project):
    """
    Évalue un projet airdrop Web3 selon des critères stratégiques.
    Retourne un score (0–100) et une étiquette de niveau.
    """

    score = 0

    # Critères positifs
    if project.get("has_contract"):               # Token identifiable
        score += 15
    if project.get("multi_sources"):              # Présent sur plusieurs sites
        score += 10
    if project.get("twitter_followers", 0) >= 1000 and project.get("twitter_account_age_months", 0) >= 3:
        score += 10
    if any(t in project.get("tasks", []) for t in ["testnet", "bridge", "vote"]):
        score += 20
    if project.get("simple_tasks", False):        # Pas de farming absurde
        score += 10

    # Critères négatifs
    if project.get("kyc_required"):
        score -= 20
    if project.get("social_farming"):             # Galxe, Zealy intensif
        score -= 15
    if not project.get("clear_claim"):
        score -= 15
    if not project.get("has_contract"):           # Redondant mais assumé
        score -= 20
    if not project.get("has_discord_or_telegram"):
        score -= 5

    # Clamp score
    score = max(0, min(100, score))

    # Niveau d'évaluation
    if score >= 85:
        niveau = " Excellent"
    elif score >= 65:
        niveau = " Moyen"
    else:
        niveau = " Faible"

    # Résumé
    details = f"\n Évaluation du projet : {project.get('name', 'Inconnu')}\n"
    details += f"Score final : {score}/100 → {niveau}\n"
    details += "Détails :\n"
    details += f"  ✅ Contrat trouvé : {project.get('has_contract')}\n"
    details += f"  ✅ Multi-sources : {project.get('multi_sources')}\n"
    details += f"  ✅ Twitter crédible : {project.get('twitter_followers', 0)} abonnés, {project.get('twitter_account_age_months', 0)} mois\n"
    details += f"  ✅ Tâches utiles : {project.get('tasks')}\n"
    details += f"  ✅ Simplicité : {project.get('simple_tasks')}\n"
    details += f"  ❌ KYC requis : {project.get('kyc_required')}\n"
    details += f"  ❌ Farming social : {project.get('social_farming')}\n"
    details += f"  ❌ Claim flou : {not project.get('clear_claim')}\n"
    details += f"  ❌ Discord/Telegram absent : {not project.get('has_discord_or_telegram')}\n"
    details += " Recommandation :\n"
    if niveau == " Excellent":
        details += "→ À exécuter automatiquement ✅"
    elif niveau == " Moyen":
        details += "→ À valider manuellement ⚠️"
    else:
        details += "→ À ignorer sauf exception "

    return score, details


#  TEST LOCAL IMMEDIAT
if __name__ == "__main__":
    projet_test = {
        "name": "zkNova",
        "has_contract": True,
        "multi_sources": True,
        "twitter_followers": 1850,
        "twitter_account_age_months": 4,
        "kyc_required": False,
        "clear_claim": True,
        "social_farming": False,
        "simple_tasks": True,
        "has_discord_or_telegram": True,
        "tasks": ["bridge", "testnet"]
    }
    score_project(projet_test)