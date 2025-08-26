# Guide de Déploiement - PDF to Book Creator

## 🚀 Déploiement sur Vercel (Recommandé)

### Prérequis
- Compte GitHub
- Compte Vercel
- Clés API (Lulu, OpenAI, Whop)

### Étapes de déploiement

1. **Pousser le code sur GitHub**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/votre-username/pdf-to-book-creator.git
   git push -u origin main
   ```

2. **Connecter à Vercel**
   - Aller sur [vercel.com](https://vercel.com)
   - Importer le projet depuis GitHub
   - Configurer les variables d'environnement

3. **Variables d'environnement à configurer**
   ```
   LULU_API_KEY=votre_clé_lulu
   LULU_API_SECRET=votre_secret_lulu
   LULU_SANDBOX=false
   OPENAI_API_KEY=votre_clé_openai
   WHOP_API_KEY=votre_clé_whop
   WHOP_WEBHOOK_SECRET=votre_secret_webhook
   WHOP_PRODUCT_ID=votre_id_produit
   NODE_ENV=production
   BASE_URL=https://votre-app.vercel.app
   SESSION_SECRET=une_clé_secrète_aléatoire
   ```

4. **Configuration du domaine**
   - Dans Vercel, aller dans Settings > Domains
   - Ajouter votre domaine personnalisé
   - Configurer les DNS selon les instructions

## 🔧 Configuration des APIs

### API Lulu.com
1. Créer un compte développeur sur [developers.lulu.com](https://developers.lulu.com)
2. Obtenir les clés API de production
3. Configurer les webhooks pour les notifications de commande

### API OpenAI
1. Créer un compte sur [platform.openai.com](https://platform.openai.com)
2. Générer une clé API
3. Configurer les limites de crédit

### Whop Integration
1. Créer un compte vendeur sur [whop.com](https://whop.com)
2. Configurer votre produit
3. Obtenir les clés API et configurer les webhooks

## 🔒 Sécurité

- Toutes les communications utilisent HTTPS
- Les clés API sont stockées comme variables d'environnement
- Validation des tokens Whop pour l'authentification
- Gestion sécurisée des sessions utilisateur

## 📊 Monitoring

- Logs automatiques via Vercel
- Monitoring des performances
- Alertes en cas d'erreur

## 🧪 Tests en production

1. **Test de l'upload de fichiers**
2. **Test de génération de couverture**
3. **Test d'intégration Lulu**
4. **Test de paiement Whop**
5. **Test de génération de commande**

## 🚨 Dépannage

### Erreurs communes
- **CORS Error**: Vérifier la configuration des domaines autorisés
- **API Timeout**: Augmenter les timeouts dans vercel.json
- **Upload Failed**: Vérifier les limites de taille de fichier

### Support
- Logs Vercel: `vercel logs`
- Monitoring en temps réel via le dashboard Vercel

---

**Note importante**: Une fois déployé en production, l'application pourra communiquer avec l'API Lulu et traiter de vraies commandes d'impression !