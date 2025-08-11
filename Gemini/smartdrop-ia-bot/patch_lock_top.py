import os
import sys
import atexit

LOCK_FILE = "bot.lock"

def remove_lock():
    if os.path.exists(LOCK_FILE):
        os.remove(LOCK_FILE)

# Vérifie s'il y a déjà une instance active
if os.path.exists(LOCK_FILE):
    print("❌ Le bot est déjà en cours d’exécution (lock trouvé).")
    sys.exit(1)
else:
    with open(LOCK_FILE, "w") as f:
        f.write(str(os.getpid()))

atexit.register(remove_lock)