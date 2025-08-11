import time
import requests
import undetected_chromedriver as uc
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

# --- Configurations ---
API_KEY = "174080e94b357b00aeee21fadeac2c8c"
USER_AGENT = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
    "AppleWebKit/537.36 (KHTML, like Gecko) "
    "Chrome/115.0.0.0 Safari/537.36"
)

# --- Initialisation du driver indétectable ---
options = uc.ChromeOptions()
options.add_argument(f"--user-agent={USER_AGENT}")
options.add_argument("--no-sandbox")
options.add_argument("--disable-gpu")
options.add_argument("--disable-dev-shm-usage")
options.add_argument("--disable-blink-features=AutomationControlled")



driver = uc.Chrome(options=options)
driver.execute_cdp_cmd(
    "Page.addScriptToEvaluateOnNewDocument", {
        "source": "Object.defineProperty(navigator, 'webdriver', {get: () => undefined})"
    }
)
wait = WebDriverWait(driver, 30)

# --- Helpers 2Captcha polling ---
def poll_2captcha(captcha_id):
    for _ in range(40):
        time.sleep(5)
        res = requests.get(
            "http://2captcha.com/res.php", params={
                'key': API_KEY,
                'action': 'get',
                'id': captcha_id,
                'json': 1
            }
        ).json()
        if res.get('status') == 1:
            return res['request']
    raise Exception("2Captcha timeout")

# reCAPTCHA v2 via 2Captcha
def solve_recaptcha(site_key, page_url):
    req = requests.get(
        "http://2captcha.com/in.php", params={
            'key': API_KEY,
            'method': 'userrecaptcha',
            'googlekey': site_key,
            'pageurl': page_url,
            'json': 1
        }
    ).json()
    return poll_2captcha(req['request'])

# Turnstile Cloudflare via 2Captcha
def solve_turnstile(site_key, page_url):
    req = requests.get(
        "http://2captcha.com/in.php", params={
            'key': API_KEY,
            'method': 'turnstile',
            'sitekey': site_key,
            'pageurl': page_url,
            'json': 1
        }
    ).json()
    return poll_2captcha(req['request'])

# --- Handlers ---
def handle_shrinkearn():
    url = "https://tpi.li/Balade_Monmartre"
    print("ShrinkEarn: Navigating to URL...")
    driver.get(url)
    print("ShrinkEarn: Attempting to close overlay...")
    # Fermer l'overlay publicitaire s'il existe
    try:
        # Try to find and click common close buttons with a shorter timeout
        close_btn = WebDriverWait(driver, 5).until(EC.element_to_be_clickable((By.XPATH, "//button[contains(text(),'FERMER') or contains(text(),'CLOSE') or contains(@class,'close') or @id='close-button']")))
        close_btn.click()
        print(' ShrinkEarn: Overlay fermé')
    except Exception as e:
        print(f' ShrinkEarn: Pas d\'overlay à fermer ou échec: {e}')
        pass
    print("ShrinkEarn: Waiting for document ready state...")
    # Attendre le chargement complet
    wait.until(lambda d: d.execute_script('return document.readyState') == 'complete')
    print("ShrinkEarn: Attempting to solve reCAPTCHA...")
    # Résoudre reCAPTCHA si présent
    selectors = ['div.g-recaptcha', 'iframe[src*=recaptcha]']
    recaptcha_solved = False
    for sel in selectors:
        elems = driver.find_elements(By.CSS_SELECTOR, sel)
        if elems:
            site_key = elems[0].get_attribute('data-sitekey') or elems[0].get_attribute('sitekey')
            if site_key:
                print(f" ShrinkEarn: reCAPTCHA found with site key: {site_key}")
                token = solve_recaptcha(site_key, url)
                driver.execute_script(
                    "document.getElementById('g-recaptcha-response').innerHTML = arguments[0];", token)
                driver.execute_script(
                    "___grecaptcha_cfg.clients[0].C.C.callback(arguments[0]);", token)
                print(' ShrinkEarn: reCAPTCHA résolu.')
                recaptcha_solved = True
            break
    if not recaptcha_solved:
        print(" ShrinkEarn: Pas de reCAPTCHA trouvé ou résolu.")
    
    print("ShrinkEarn: Attempting to click CONTINUE button...")
    # Cliquer sur le bouton "CONTINUE" s'il existe
    try:
        continue_btn = wait.until(EC.element_to_be_clickable((By.XPATH, "//button[contains(text(),'CONTINUE')] | //a[contains(text(),'CONTINUE')] | //input[@value='CONTINUE']")))
        continue_btn.click()
        print('✅ ShrinkEarn: Bouton "CONTINUE" cliqué.')
        wait.until(lambda d: d.execute_script('return document.readyState') == 'complete') # Wait for new page to load
        print('✅ ShrinkEarn OK: Processus terminé.', driver.current_url)
    except Exception as e:
        print(f'❌ ShrinkEarn fail: Bouton "CONTINUE" non trouvé ou non cliquable directement: {e}')
        import traceback
        traceback.print_exc()
        with open("shrinkearn_error.html", "w", encoding="utf-8") as f:
            f.write(driver.page_source)
        print("Page source saved to shrinkearn_error.html")
    


def handle_ouo():
    url = "https://ouo.io/rZMB9W"
    print("OUO: Navigating to URL...")
    driver.get(url)
    print("OUO: Attempting to close overlay...")
    # Fermer pop-up ou overlay éventuel
    try:
        # Try to find and click common close buttons with a shorter timeout
        btn_close = WebDriverWait(driver, 5).until(EC.element_to_be_clickable((By.XPATH, "//button[contains(text(),'Fermer')] | //button[contains(text(),'CLOSE')] | //button[contains(@class,'close')] | //div[contains(@class,'close-button')] | //a[contains(@class,'close')] | //span[contains(@class,'close')] | //div[@id='close-button']")))
        btn_close.click()
        print(' OUO: Overlay fermé')
    except Exception as e:
        print(f' OUO: Pas d\'overlay à fermer ou échec: {e}')
        pass
    print("OUO: Waiting for document ready state...")
    wait.until(lambda d: d.execute_script('return document.readyState') == 'complete')
    print("OUO: Attempting to solve Turnstile...")
    # Extraire et résoudre Turnstile
    elems = driver.find_elements(By.CSS_SELECTOR, '[data-sitekey]')
    turnstile_solved = False
    if elems:
        sk = elems[0].get_attribute('data-sitekey')
        print(f" OUO: Turnstile found with site key: {sk}")
        token = solve_turnstile(sk, url)
        driver.execute_script(
            "document.querySelector('textarea[name=\"cf-turnstile-response\"]').innerHTML = arguments[0];", token)
        print(' OUO: Turnstile résolu.')
        turnstile_solved = True
    if not turnstile_solved:
        print(" OUO: Pas de Turnstile trouvé ou résolu.")

    print("OUO: Attempting to click I'M A HUMAN button...")
    # Cliquer sur le bouton "I'M A HUMAN" s'il existe
    try:
        human_btn = wait.until(EC.element_to_be_clickable((By.XPATH, "//button[contains(text(),'I\'M A HUMAN')]" )))
        human_btn.click()
        print('✅ OUO: Bouton "I\'M A HUMAN" cliqué.')
        time.sleep(2) # Give some time for the page to react
    except Exception as e:
        print(f'OUO: Bouton "I\'M A HUMAN" non trouvé ou non cliquable directement: {e}')
        import traceback
        traceback.print_exc()
        with open("ouo_error.html", "w", encoding="utf-8") as f:
            f.write(driver.page_source)
        print("Page source saved to ouo_error.html")
        pass
    
    print("OUO: Attempting to click buttons in iframes...")
    # Cliquer dans les iframes
    time.sleep(2)
    for iframe in driver.find_elements(By.TAG_NAME, 'iframe'):
        try:
            driver.switch_to.frame(iframe)
            # Try to click the "I'M A HUMAN" button again inside the iframe
            try:
                human_btn_iframe = wait.until(EC.element_to_be_clickable((By.XPATH, "//button[contains(text(),'I\'M A HUMAN')]" )))
                human_btn_iframe.click()
                print('✅ OUO: Bouton "I\'M A HUMAN" cliqué dans l\'iframe.')
                time.sleep(2)
            except:
                pass # Button not found in this iframe, continue to next
            
            btn = wait.until(EC.element_to_be_clickable((By.CSS_SELECTOR, '#btn-main, .btn, [role="button"]')))
            btn.click()
            driver.switch_to.default_content()
            wait.until(EC.url_changes(url))
            print('✅ OUO OK:', driver.current_url)
            return
        except Exception as e:
            print(f'OUO: Erreur dans iframe: {e}')
            driver.switch_to.default_content()
    print('❌ OUO bouton introuvable')
    print(driver.page_source[:500])


def handle_adfoc():
    url = 'http://adfoc.us/8733161'
    driver.get(url)
    time.sleep(12)
    print('✅ AdFoc OK:', driver.current_url)

# --- Execution principale ---
def main():
    handle_shrinkearn()
    handle_ouo()
    handle_adfoc()
    driver.quit()

if __name__ == '__main__':
    main()