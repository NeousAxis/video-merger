import os, asyncio
from dotenv import load_dotenv
from web3 import AsyncWeb3
from web3.providers.persistent import WebSocketProvider

load_dotenv()
RPC = os.getenv("RPC_ARBITRUM_SEPOLIA_WSS")
if not RPC:
    raise RuntimeError("❌ Variable RPC_ARBITRUM_SEPOLIA_WSS manquante dans .env")

async def main():
    w3 = AsyncWeb3(WebSocketProvider(RPC))
    if await w3.is_connected():
        print("✅ Connecté via WebSocket !")
    else:
        print("❌ Échec de la connexion WebSocket")

if __name__ == "__main__":
    asyncio.run(main())