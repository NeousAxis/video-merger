from flask import Flask
from paris_bot import run_bot

app = Flask(__name__)

@app.route("/")
def home():
    return "Paris Bot is ready."

@app.route("/run")
def run():
    run_bot()
    return "✅ Bot executed."

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=10000)
