import os
import sys
import subprocess
import atexit

# Anti-conflit et gestion du verrou
LOCK_FILE = "bot.lock"

def kill_existing_instances():
    output = subprocess.getoutput("ps aux | grep '[p]ython.*main.py'")
    lines = output.splitlines()
    current_pid = str(os.getpid())
    for line in lines:
        pid = line.split()[1]
        if pid != current_pid:
            print(f"⚠️  Instance concurrente détectée (PID {pid}) → arrêt forcé.")
            os.system(f"kill {pid}")

kill_existing_instances()

if os.path.exists(LOCK_FILE):
    print(" Suppression du verrou obsolète bot.lock")
    os.remove(LOCK_FILE)

with open(LOCK_FILE, "w") as f:
    f.write(str(os.getpid()))

def remove_lock():
    if os.path.exists(LOCK_FILE):
        os.remove(LOCK_FILE)

atexit.register(remove_lock)

# Importation de la fonction principale du bot
from telegram_bot import main as run_bot_main

if __name__ == "__main__":
    run_bot_main()
