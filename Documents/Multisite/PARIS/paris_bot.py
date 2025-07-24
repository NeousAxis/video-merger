from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.service import Service
from webdriver_manager.chrome import ChromeDriverManager
import time
import random

def run_bot():
    SITE_URL = "https://neousaxis.github.io/Paris-Vibes/"

    options = webdriver.ChromeOptions()
    options.add_argument("--headless")
    options.add_argument("--no-sandbox")
    options.add_argument("--disable-dev-shm-usage")

    driver = webdriver.Chrome(service=Service(ChromeDriverManager().install()), options=options)

    try:
        driver.get(SITE_URL)

        for _ in range(3):
            scroll = random.randint(200, 600)
            driver.execute_script(f"window.scrollBy(0, {scroll});")
            time.sleep(random.uniform(1.5, 2.5))

        buttons = driver.find_elements(By.CLASS_NAME, "button")
        if buttons:
            choice = random.choice(buttons)
            choice.click()

        time.sleep(10)

    finally:
        driver.quit()
