import os
import subprocess

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

# Appliquer le kill avant tout
kill_existing_instances()

# Nettoyer le fichier de verrou si bloqué
if os.path.exists(LOCK_FILE):
    print(" Suppression du verrou obsolète bot.lock")
    os.remove(LOCK_FILE)