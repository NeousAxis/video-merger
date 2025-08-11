#!/usr/bin/env python3
"""
Gemini CLI – Scraper DappRadar “Upcoming” via undetected-chromedriver + Scoring

1. Installer les dépendances :
     pip install undetected-chromedriver beautifulsoup4
2. Copier ce bloc dans dappradar_upcoming_scraper.py
3. Lancer dans Gemini CLI :
     python3 dappradar_upcoming_scraper.py
=> Affiche les airdrops “Upcoming” qualifiés (score ≥ 65)
"""

import sys, time
import undetected_chromedriver as uc
from bs4 import BeautifulSoup
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.common.by import By

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
    # Lance un Chrome “stealth” pour contourner Cloudflare
    opts = uc.ChromeOptions()
    opts.headless = True
    driver = uc.Chrome(options=opts)
    driver.get("https://dappradar.com/rankings/upcoming")
    WebDriverWait(driver, 30).until(EC.presence_of_element_located((By.CSS_SELECTOR, "div.airdrop-card, div.rankings-card")))  # attendre le chargement et le challenge Cloudflare

    soup = BeautifulSoup(driver.page_source, "html.parser")
    with open("dappradar_upcoming_page.html", "w", encoding="utf-8") as f:
        f.write(soup.prettify())
    driver.quit()

    cards = soup.select("div.airdrop-card, div.rankings-card")  # selector général
    qualified = []
    for c in cards:
        name = c.select_one("h3") and c.select_one("h3").get_text(strip=True) or "Inconnu"
        chain = c.select_one("span.airdrop-card__chain") and c.select_one("span.airdrop-card__chain").get_text(strip=True) or "Unknown"
        url   = c.select_one("a") and c.select_one("a")["href"] or ""
        method = c.select_one(".airdrop-card__method") and c.select_one(".airdrop-card__method").get_text(strip=True).lower() or ""
        # Construire le dict minimal pour scoring
        p = {
            "has_contract":          False,
            "multi_sources":         False,
            "twitter_followers":     0,
            "twitter_account_age_months": 0,
            "kyc_required":          False,
            "clear_claim":           True,
            "social_farming":        method in ["galxe","layer3","zealy"],
            "simple_tasks":          True,
            "has_discord_or_telegram": True,
            "tasks":                 [method]
        }
        score = score_project(p)
        if score >= 65:
            qualified.append((name, chain, score, url))

    return qualified

if __name__ == "__main__":
    res = scrape_and_filter()
    if not res:
        print("Aucune opportunité ‘Upcoming’ qualifiée (score ≥ 65).")
        sys.exit(0)
    print("\n Upcoming Airdrops qualifiés (score ≥ 65) :")
    for name, chain, score, url in res:
        print(f"- {name} ({chain}) → {score} pts → https://dappradar.com{url}")