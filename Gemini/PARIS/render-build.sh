#!/usr/bin/env bash
# exit on error
set -o errexit

# Installe les paquets nécessaires
apt-get update && apt-get install -y wget unzip

# Télécharge et installe chromedriver
wget https://edgedl.me.gvt1.com/edgedl/chrome/chrome-for-testing/118.0.5993.70/linux64/chromedriver-linux64.zip
unzip chromedriver-linux64.zip
mv chromedriver-linux64/chromedriver /usr/local/bin/
rm chromedriver-linux64.zip

# Installe les dépendances Python
pip install -r requirements.txt