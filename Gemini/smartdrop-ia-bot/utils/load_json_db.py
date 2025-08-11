import json, os

def load_json_db(path, default=None):
    if not os.path.exists(path):
        return default if default is not None else []

    with open(path, 'r', encoding='utf-8') as f:
        try:
            data = json.load(f)
            if isinstance(data, list):
                return data
            else:
                print(f"⚠️  Avertissement : le fichier {path} contient un type {type(data)} au lieu d'une liste. Réinitialisation forcée.")
                return default if default is not None else []
        except json.JSONDecodeError:
            print(f"❌ Erreur JSON dans {path}. Réinitialisation.")
            return default if default is not None else []