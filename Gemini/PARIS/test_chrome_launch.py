from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
import os
from dotenv import load_dotenv

load_dotenv()

CHROME_PATH = os.getenv("CHROME_BINARY_PATH")
CHROMEDRIVER = os.getenv("CHROMEDRIVER_PATH")

options = Options()
options.binary_location = CHROME_PATH

try:
    print("Tentative de lancement de Chrome...")
    driver = webdriver.Chrome(service=Service(CHROMEDRIVER), options=options)
    print("Chrome lancé avec succès ! Fermeture...")
    driver.quit()
    print("Chrome fermé.")
except Exception as e:
    print(f"Erreur lors du lancement de Chrome : {e}")
