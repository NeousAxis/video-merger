#!/bin/bash
echo " Vérification des fichiers .json dans /database/ :"
for f in database/*.json; do
  echo -n "$(basename $f): "
  jq 'if type == "array" then "OK ✅" else "❌ NOT A LIST" end' "$f"
done