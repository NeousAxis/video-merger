#!/usr/bin/env python3
"""
Gemini CLI – Scraper DappRadar via Playwright + Scoring

1. Installer Playwright et Chromium :
     pip install playwright
     playwright install chromium

2. Copier ce bloc dans dappradar_scraper.py dans ton dossier Gemini.

3. Lancer depuis Gemini CLI :
     python3 dappradar_scraper.py

Tu obtiendras la liste des airdrops qualifiés (score ≥ 65).
"""

import sys
from playwright.sync_api import sync_playwright

def score_project(p):
    s = 0
    if p["has_contract"]:                s += 15
    if p["multi_sources"]:               s += 10
    if p["twitter_followers"] >= 1000 and p["twitter_account_age_months"] >= 3:
        s += 10
    if any(t in p["tasks"] for t in ["testnet","bridge","vote"]):
        s += 20
    if p["simple_tasks"]:                s += 10
    if p["kyc_required"]:                s -= 20
    if p["social_farming"]:              s -= 15
    if not p["clear_claim"]:             s -= 15
    if not p["has_contract"]:            s -= 20
    if not p["has_discord_or_telegram"]: s -= 5
    return max(0, min(100, s))

def scrape_and_filter():
    qualified = []
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page(user_agent="Mozilla/5.0")
        page.goto("https://dappradar.com/rewards/airdrops", timeout=60000)
        # Attendre que le corps de la page soit chargé
        page.wait_for_selector("body", timeout=90000)
        # Imprimer le contenu HTML pour l'analyse
        print(page.content())
        browser.close()
    return qualified # Retourne une liste vide pour l'instant, car le but est de débugger

if __name__ == "__main__":
    res = scrape_and_filter()
    if not res:
        print("Aucune opportunité qualifiée (score ≥ 65).")
        sys.exit(0)
    print("\n Airdrops qualifiés (score ≥ 65) :")
    for name, chain, score, url in res:
        print(f"- {name} ({chain}) → {score} pts → {url}")