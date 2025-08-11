from wallet import get_eth_balance

TEST_ADDRESS = "0x742d35Cc6634C0532925a3b844Bc454e4438f44e"  # wallet connu, riche

print(" Test de lecture du solde pour :", TEST_ADDRESS)
balance = get_eth_balance(TEST_ADDRESS)
print(" Solde ETH :", balance)