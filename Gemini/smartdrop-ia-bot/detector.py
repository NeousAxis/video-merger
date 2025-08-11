import json
import requests
from bs4 import BeautifulSoup
import os

PROJECTS_DB_PATH = 'database/projects_db.json'
OPPORTUNITIES_DB_PATH = 'database/opportunities.json'
EXPOSITIONS_DB_PATH = 'database/expositions.json'
LAYER3_URL = 'https://layer3.xyz/quests'
GALXE_URL = 'https://app.galxe.com/quest' # Toujours là pour référence, mais non fonctionnel

def load_json_db(path, default_value=[]):
    try:
        with open(path, 'r') as f:
            return json.load(f)
    except (FileNotFoundError, json.JSONDecodeError):
        return default_value

def save_json_db(data, path):
    with open(path, 'w') as f:
        json.dump(data, f, indent=2)

def scrape_layer3():
    """Récupère les quêtes depuis Layer3.xyz."""
    print("Scraping Layer3...")
    try:
        response = requests.get(LAYER3_URL)
        response.raise_for_status()
    except requests.RequestException as e:
        print(f"Erreur lors de la requête vers Layer3 : {e}")
        return []

    soup = BeautifulSoup(response.content, 'html.parser')
    quests = []
    # Sélecteur à affiner si nécessaire
    quest_containers = soup.find_all('a', class_='chakra-link css-1w0f01') # Exemple de sélecteur

    for container in quest_containers:
        try:
            title_element = container.find('h3', class_='chakra-heading css-1w0f01') # Exemple de sélecteur
            description_element = container.find('p', class_='chakra-text css-1w0f01') # Exemple de sélecteur
            link = container.get('href')

            if title_element and description_element and link:
                quests.append({
                    "name": f"Layer3 - {title_element.get_text(strip=True)}",
                    "description": description_element.get_text(strip=True),
                    "actions": [f"Compléter la quête sur Layer3.xyz: {LAYER3_URL}{link}"],
                    "source": "Layer3",
                    "url": f"{LAYER3_URL}{link}",
                    "score_components": {
                        "preparation_level": 70,
                        "interaction_level": 80,
                        "potential_gain": 75,
                        "execution_difficulty": 40
                    }
                })
        except Exception as e:
            print(f"Erreur lors du parsing d'une quête Layer3 : {e}")
            continue
    print(f"Layer3 scraping terminé. {len(quests)} quêtes trouvées.")
    return quests

def update_opportunities_db():
    """Met à jour la base de données des opportunités avec les nouvelles détections."""
    print("Mise à jour de la base de données des opportunités...")
    manual_projects = load_json_db(PROJECTS_DB_PATH)
    scraped_layer3_projects = scrape_layer3()
    # scraped_galxe_projects = scrape_galxe() # Non fonctionnel pour l'instant

    all_detected_projects = manual_projects + scraped_layer3_projects # + scraped_galxe_projects

    current_opportunities = load_json_db(OPPORTUNITIES_DB_PATH)
    expositions = load_json_db(EXPOSITIONS_DB_PATH)

    known_project_names = set([p['name'] for p in current_opportunities] + [p['name'] for p in expositions])

    new_opportunities_added = 0
    for project in all_detected_projects:
        if project['name'] not in known_project_names:
            current_opportunities.append(project)
            known_project_names.add(project['name'])
            new_opportunities_added += 1

    save_json_db(current_opportunities, OPPORTUNITIES_DB_PATH)
    print(f"Mise à jour terminée. {new_opportunities_added} nouvelles opportunités ajoutées.")
    return new_opportunities_added

def get_projects():
    """Récupère tous les projets actuellement dans la base de données des opportunités."""
    return load_json_db(OPPORTUNITIES_DB_PATH)