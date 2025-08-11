from web3 import Web3

# ✅ Nœud Infura (avec votre clé API)
RPC_URL = "https://mainnet.infura.io/v3/ff9c7ec36756488b92bb2419253aedc1"

try:
    w3 = Web3(Web3.HTTPProvider(RPC_URL))
    if not w3.is_connected():
        print("❌ Connexion échouée au nœud Ethereum via Infura.")
        w3 = None
    else:
        print("✅ Connecté au réseau Ethereum via Infura.")
except Exception as e:
    print(f"[wallet.py] Erreur lors de la connexion : {e}")
    w3 = None

def get_eth_balance(address: str):
    if not w3 or not w3.is_connected():
        return "❌ Impossible de se connecter à Ethereum."
    if not Web3.is_address(address):
        return "⚠️ Adresse Ethereum invalide."
    try:
        checksum = Web3.to_checksum_address(address)
        balance = w3.eth.get_balance(checksum)
        return round(w3.from_wei(balance, 'ether'), 6)
    except Exception as e:
        print(f"[wallet.py] Erreur de lecture du solde : {e}")
        return f"❌ Erreur : {e}"