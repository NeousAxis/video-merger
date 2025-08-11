from flask import Flask
import threading
import logging
import sys
from paris_bot import run_bot

# Configure logging to output to stdout
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s', stream=sys.stdout)

app = Flask(__name__)

@app.route('/')
def index():
    """
    Health check endpoint for Render.
    """
    logging.info("Health check endpoint called.")
    return "Paris-Bot is alive!", 200

@app.route('/run')
def trigger_bot():
    """
    Triggers the bot execution in a background thread to avoid
    HTTP request timeouts on long-running tasks.
    """
    logging.info("Received request on /run, starting bot in background...")
    thread = threading.Thread(target=run_bot)
    thread.start()
    return "Bot execution started in the background.", 202

if __name__ == "__main__":
    # This part is for local testing, Render will use gunicorn
    app.run(host='0.0.0.0', port=5000)
