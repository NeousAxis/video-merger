// Lire le fichier
const fs = require('fs');
let content = fs.readFileSync('src/index.js', 'utf8');

// Modification 1: Remplacer le select par des radio buttons
content = content.replace(
  /<select id="plan">\s*<option value="gratuit">Gratuit - 1 000 appels\/jour<\/option>\s*<option value="starter">Starter - 20 000 appels\/jour<\/option>\s*<\/select>/gs,
  `<div style="border: 2px solid #e5e7eb; border-radius: 8px;">
                       <div style="padding: 1rem; border-bottom: 1px solid #f3f4f6;">
                           <input type="radio" name="plan" value="gratuit" id="plan-gratuit" checked>
                           <label for="plan-gratuit" style="margin: 0; cursor: pointer; display: inline;"><strong>Gratuit</strong> - 1 000 appels/jour - 0€</label>
                       </div>
                       <div style="padding: 1rem;">
                           <input type="radio" name="plan" value="starter" id="plan-starter">
                           <label for="plan-starter" style="margin: 0; cursor: pointer; display: inline;"><strong>Starter</strong> - 20 000 appels/jour - 0,50€/1000</label>
                       </div>
                   </div>`
);

// Modification 2: Remplacer le JavaScript
content = content.replace(
  /plan: document\.getElementById\('plan'\)\.value/g,
  "plan: document.querySelector('input[name="plan"]:checked').value"
);

// Écrire le fichier modifié
fs.writeFileSync('src/index.js', content);
console.log('Modifications appliquées avec succès');
