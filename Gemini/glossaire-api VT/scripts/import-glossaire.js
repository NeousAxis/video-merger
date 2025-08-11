const fs = require('fs');
const { execSync } = require('child_process');

// Vos 80 termes (exemple - remplacez par vos vraies données)
const terms = [
 {
   id: "api",
   terme: "API", 
   definition: "Interface de Programmation d\'Application",
   domaine: "Informatique",
   tags: ["programmation", "web"]
 },
 {
   id: "rest",
   terme: "REST",
   definition: "Representational State Transfer - style d\'architecture web",
   domaine: "Informatique", 
   tags: ["architecture", "web"]
 },
 // ... ajoutez vos 78 autres termes ici
];

function generateKVData() {
 const kvData = [];
 const termIds = [];
 
 // 1. Créer les entrées pour chaque terme
 terms.forEach(term => {
   const termId = `term_${term.id}`;
   const termData = {
     id: termId,
     terme: term.terme,
     definition: term.definition,
     domaine: term.domaine || "Général",
     tags: term.tags || [],
     created_at: new Date().toISOString(),
     updated_at: new Date().toISOString()
   };
   
   kvData.push({
     key: termId,
     value: JSON.stringify(termData)
   });
   
   termIds.push(termId);
 });
 
 // 2. Créer l'index
 kvData.push({
   key: "terms_index",
   value: JSON.stringify(termIds)
 });
 
 return kvData;
}

async function importToKV() {
 const kvData = generateKVData();
 
 // Écrire le fichier JSON pour wrangler
 const filename = 'kv-import.json';
 fs.writeFileSync(filename, JSON.stringify(kvData, null, 2));
 
 console.log(` Fichier ${filename} créé avec ${kvData.length} entrées`);
 console.log(` ${terms.length} termes + 1 index`);
 
 try {
   // Nettoyer d'abord le KV
   console.log(' Nettoyage du KV...');
   // Note: La commande de nettoyage n'est pas incluse ici pour éviter la suppression accidentelle.
   // Si vous voulez nettoyer, vous pouvez le faire manuellement via le tableau de bord Cloudflare ou ajouter une commande ici.
   
   // Importer les nouvelles données
   console.log(' Import des données...');
   const result = execSync(`npx wrangler kv bulk put --binding=GLOSSARY_TERMS ${filename}`, {
     encoding: 'utf8'
   });
   
   console.log('✅ Import réussi !');
   console.log(result);
   
   // Nettoyer le fichier temporaire
   fs.unlinkSync(filename);
   
   // Vérification
   console.log(' Vérification...');
   setTimeout(() => {
     console.log('Testez maintenant : curl https://glossaire-api-final.neousaxis.workers.dev/diagnose');
   }, 2000);
   
 } catch (error) {
   console.error('❌ Erreur lors de l\'import :', error.message);
 }
}

importToKV();
