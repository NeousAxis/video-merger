# 📋 Guide de Déploiement en Production - PDF to Book Creator

## 🎯 Vue d'ensemble

Cette documentation détaille les étapes nécessaires pour déployer l'application PDF to Book Creator en production avec l'intégration complète de l'API Lulu.com.

## 📦 Architecture de Production

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend API    │    │   Lulu.com API  │
│   (React/TS)    │◄──►│   (Node.js)      │◄──►│   (External)    │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                       │
         ▼                       ▼
┌─────────────────┐    ┌──────────────────┐
│   File Storage  │    │   Database       │
│   (AWS S3/etc)  │    │   (PostgreSQL)   │
└─────────────────┘    └──────────────────┘
```

## 🔑 1. Configuration des API Lulu.com

### 1.1 Création du compte développeur
1. Créer un compte sur [Lulu Developer Portal](https://developers.lulu.com/)
2. Obtenir les clés API :
   - **Client ID**
   - **Client Secret**
   - **Environment** (sandbox/production)

### 1.2 Configuration des variables d'environnement
```bash
# .env.production
LULU_CLIENT_ID=your_client_id
LULU_CLIENT_SECRET=your_client_secret
LULU_ENVIRONMENT=production
LULU_API_BASE_URL=https://api.lulu.com/
LULU_REDIRECT_URI=https://yourapp.com/auth/callback
```

### 1.3 Mise à jour du fichier lulu-api.ts
```typescript
// src/lib/lulu-api.ts - VERSION PRODUCTION
class LuluAPIProduction {
  private baseURL = process.env.LULU_API_BASE_URL || 'https://api.lulu.com/';
  private clientId = process.env.LULU_CLIENT_ID!;
  private clientSecret = process.env.LULU_CLIENT_SECRET!;
  private accessToken: string | null = null;

  // Authentification OAuth2
  async authenticate(): Promise<string> {
    const response = await fetch(`${this.baseURL}auth/realms/glasstree/protocol/openid-connect/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: this.clientId,
        client_secret: this.clientSecret,
      }),
    });

    const data = await response.json();
    this.accessToken = data.access_token;
    return this.accessToken;
  }

  // Upload de fichiers réels
  async uploadFile(file: File): Promise<string> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${this.baseURL}print-job-files/`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
      },
      body: formData,
    });

    const data = await response.json();
    return data.id; // File ID pour utilisation ultérieure
  }

  // Validation réelle des fichiers
  async validateFile(fileId: string, type: 'interior' | 'cover'): Promise<ValidationResult> {
    const response = await fetch(`${this.baseURL}print-job-files/${fileId}/validate/`, {
      method: POST,
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ file_type: type }),
    });

    return await response.json();
  }

  // Création de job d'impression réel
  async createPrintJob(data: PrintJobData): Promise<PrintJob> {
    const response = await fetch(`${this.baseURL}print-jobs/`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        line_items: [{
          external_id: data.externalId,
          printable_normalization: {
            pod_package_id: data.podPackageId,
            interior_file_id: data.interiorFileId,
            cover_file_id: data.coverFileId,
          },
          quantity: data.quantity,
        }],
        contact_email: data.contactEmail,
        shipping_address: data.shippingAddress,
      }),
    });

    return await response.json();
  }
}
```

## 🗄️ 2. Base de Données de Production

### 2.1 Schéma PostgreSQL
```sql
-- Création des tables principales
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  filename VARCHAR(255) NOT NULL,
  file_path VARCHAR(500) NOT NULL,
  file_size BIGINT NOT NULL,
  pages INTEGER NOT NULL,
  status VARCHAR(50) DEFAULT 'uploaded',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE print_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  document_id UUID REFERENCES documents(id),
  lulu_job_id VARCHAR(255) UNIQUE,
  template_id VARCHAR(100) NOT NULL,
  cover_design JSONB,
  cost_calculation JSONB,
  status VARCHAR(50) DEFAULT 'created',
  tracking_url VARCHAR(500),
  estimated_delivery DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE cover_designs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  print_job_id UUID REFERENCES print_jobs(id),
  front_image_url VARCHAR(500),
  back_text TEXT,
  author_bio TEXT,
  spine_width DECIMAL(4,2),
  generated_cover_url VARCHAR(500),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_documents_user_id ON documents(user_id);
CREATE INDEX idx_print_jobs_user_id ON print_jobs(user_id);
CREATE INDEX idx_print_jobs_status ON print_jobs(status);
CREATE INDEX idx_print_jobs_lulu_id ON print_jobs(lulu_job_id);
```

### 2.2 Configuration de connexion
```typescript
// src/lib/database.ts
import { Pool } from 'pg';

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: parseInt(process.env.DB_PORT || '5432'),
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

export default pool;
```

## ☁️ 3. Stockage de Fichiers (AWS S3)

### 3.1 Configuration AWS
```typescript
// src/lib/storage.ts
import AWS from 'aws-sdk';

AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION || 'us-east-1',
});

const s3 = new AWS.S3();

export const uploadToS3 = async (file: File, key: string): Promise<string> => {
  const params = {
    Bucket: process.env.AWS_S3_BUCKET!,
    Key: key,
    Body: file,
    ContentType: file.type,
    ACL: 'private',
  };

  const result = await s3.upload(params).promise();
  return result.Location;
};

export const generateSignedUrl = (key: string, expires: number = 3600): string => {
  return s3.getSignedUrl('getObject', {
    Bucket: process.env.AWS_S3_BUCKET,
    Key: key,
    Expires: expires,
  });
};
```

### 3.2 Structure des dossiers S3
```
bucket-name/
├── documents/
│   ├── user-id/
│   │   ├── original/
│   │   └── processed/
├── covers/
│   ├── user-id/
│   │   ├── front/
│   │   ├── back/
│   │   └── generated/
└── temp/
    └── uploads/
```

## 🔄 4. Génération PDF Réelle

### 4.1 Installation des dépendances
```bash
npm install jspdf html2canvas pdf-lib @react-pdf/renderer
```

### 4.2 Service de génération PDF
```typescript
// src/lib/pdf-generator.ts
import { jsPDF } from 'jspdf';
import { PDFDocument, rgb } from 'pdf-lib';

export class PDFGenerator {
  async generateBookPDF(
    interiorFile: File,
    coverDesign: CoverDesign,
    template: BookTemplate
  ): Promise<Blob> {
    const pdfDoc = await PDFDocument.create();
    
    // 1. Traiter le fichier intérieur
    const interiorBytes = await interiorFile.arrayBuffer();
    const interiorPdf = await PDFDocument.load(interiorBytes);
    const pages = await pdfDoc.copyPages(interiorPdf, interiorPdf.getPageIndices());
    
    pages.forEach((page) => pdfDoc.addPage(page));
    
    // 2. Générer la couverture
    const coverPage = pdfDoc.addPage([
      template.specs.width * 72, // Points
      template.specs.height * 72
    ]);
    
    // Ajouter l'image de couverture si disponible
    if (coverDesign.frontImage) {
      const imageBytes = await coverDesign.frontImage.arrayBuffer();
      const image = await pdfDoc.embedPng(imageBytes);
      
      coverPage.drawImage(image, {
        x: 0,
        y: 0,
        width: template.specs.width * 72,
        height: template.specs.height * 72,
      });
    }
    
    // 3. Générer le verso
    const backPage = pdfDoc.addPage([
      template.specs.width * 72,
      template.specs.height * 72
    ]);
    
    if (coverDesign.backText) {
      backPage.drawText(coverDesign.backText, {
        x: 50,
        y: template.specs.height * 72 - 100,
        size: 12,
        color: rgb(0, 0, 0),
        maxWidth: template.specs.width * 72 - 100,
      });
    }
    
    const pdfBytes = await pdfDoc.save();
    return new Blob([pdfBytes], { type: 'application/pdf' });
  }
}
```

## 🚀 5. Configuration de Déploiement

### 5.1 Dockerfile
```dockerfile
# Dockerfile
FROM node:18-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

### 5.2 docker-compose.yml
```yaml
version: '3.8'
services:
  app:
    build: .
    ports:
      - "80:80"
    environment:
      - NODE_ENV=production
      - LULU_CLIENT_ID=${LULU_CLIENT_ID}
      - LULU_CLIENT_SECRET=${LULU_CLIENT_SECRET}
      - DB_HOST=${DB_HOST}
      - DB_USER=${DB_USER}
      - DB_PASSWORD=${DB_PASSWORD}
      - AWS_ACCESS_KEY_ID=${AWS_ACCESS_KEY_ID}
      - AWS_SECRET_ACCESS_KEY=${AWS_SECRET_ACCESS_KEY}
    depends_on:
      - db
      - redis

  db:
    image: postgres:15
    environment:
      - POSTGRES_DB=${DB_NAME}
      - POSTGRES_USER=${DB_USER}
      - POSTGRES_PASSWORD=${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:alpine
    volumes:
      - redis_data:/data

volumes:
  postgres_data:
  redis_data:
```

### 5.3 Configuration Nginx
```nginx
# nginx.conf
server {
    listen 80;
    server_name yourapp.com;
    
    root /usr/share/nginx/html;
    index index.html;
    
    # Gestion des routes React
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    # API Proxy
    location /api/ {
        proxy_pass http://backend:3000/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
    
    # Upload de fichiers volumineux
    client_max_body_size 100M;
    
    # Cache statique
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, no-transform";
    }
}
```

## 🔐 6. Sécurité en Production

### 6.1 Variables d'environnement
```bash
# .env.production
NODE_ENV=production
LULU_CLIENT_ID=your_production_client_id
LULU_CLIENT_SECRET=your_production_client_secret
LULU_ENVIRONMENT=production

# Base de données
DB_HOST=your-db-host.com
DB_NAME=pdf_book_creator
DB_USER=app_user
DB_PASSWORD=secure_password_123

# AWS
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_S3_BUCKET=your-pdf-book-bucket
AWS_REGION=us-east-1

# JWT
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRES_IN=24h

# Email (pour notifications)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
```

### 6.2 Authentification et autorisation
```typescript
// src/lib/auth.ts
import jwt from 'jsonwebtoken';

export const generateToken = (userId: string): string => {
  return jwt.sign(
    { userId, type: 'access' },
    process.env.JWT_SECRET!,
    { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
  );
};

export const verifyToken = (token: string): { userId: string } => {
  return jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };
};

// Middleware Express
export const authMiddleware = (req: any, res: any, next: any) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({ error: 'Token required' });
  }
  
  try {
    const decoded = verifyToken(token);
    req.userId = decoded.userId;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};
```

## 📊 7. Monitoring et Logs

### 7.1 Configuration des logs
```typescript
// src/lib/logger.ts
import winston from 'winston';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' }),
  ],
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple()
  }));
}

export default logger;
```

### 7.2 Health Check
```typescript
// src/routes/health.ts
app.get('/health', async (req, res) => {
  try {
    // Vérifier DB
    await pool.query('SELECT 1');
    
    // Vérifier API Lulu
    const luluStatus = await fetch(`${process.env.LULU_API_BASE_URL}ping`);
    
    // Vérifier S3
    await s3.headBucket({ Bucket: process.env.AWS_S3_BUCKET }).promise();
    
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        database: 'ok',
        lulu_api: luluStatus.ok ? 'ok' : 'error',
        storage: 'ok'
      }
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      error: error.message
    });
  }
});
```

## 📋 8. Checklist de Déploiement

### ✅ Avant le déploiement
- [ ] Tester toutes les fonctionnalités en local
- [ ] Configurer les variables d'environnement
- [ ] Tester les connexions API Lulu.com
- [ ] Configurer la base de données
- [ ] Tester l'upload vers S3
- [ ] Configurer les certificats SSL
- [ ] Tester la génération PDF réelle
- [ ] Configurer les sauvegardes
- [ ] Mettre en place le monitoring

### ✅ Après le déploiement
- [ ] Vérifier le health check
- [ ] Tester un workflow complet
- [ ] Vérifier les logs
- [ ] Tester la performance
- [ ] Configurer les alertes
- [ ] Documentation utilisateur
- [ ] Formation équipe support

## 🔧 9. Commandes de Déploiement

```bash
# 1. Build de production
npm run build

# 2. Tests complets
npm run test:e2e

# 3. Déploiement Docker
docker-compose up -d

# 4. Migration base de données
npm run migrate:production

# 5. Vérification santé
curl https://yourapp.com/health

# 6. Monitoring
docker logs pdf-book-creator_app_1 -f
```

## 📞 Support et Maintenance

- **Logs** : `/var/log/pdf-book-creator/`
- **Monitoring** : Health check sur `/health`
- **Documentation API** : `/api-docs`
- **Support Lulu** : [Lulu Developer Support](https://developers.lulu.com/support)

---

**🎉 Votre application PDF to Book Creator est maintenant prête pour la production !**