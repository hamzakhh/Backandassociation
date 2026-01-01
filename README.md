# Backend API - Association Creative

API REST pour la gestion de l'Association Creative.

## 🚀 Installation

```bash
# Installer les dépendances
npm install

# Copier le fichier d'environnement
copy .env.example .env

# Modifier les variables d'environnement
# Éditer .env avec vos configurations
```

## 📦 Configuration

Créer un fichier `.env` avec les variables suivantes:

```env
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/creative-association
JWT_SECRET=your_secret_key
JWT_EXPIRE=7d
FRONTEND_URL=http://localhost:3000
```

## 🏃 Démarrage

```bash
# Mode développement
npm run dev

# Mode production
npm start
```

## 📚 API Endpoints

### Authentication
- `POST /api/auth/register` - Inscription
- `POST /api/auth/login` - Connexion
- `GET /api/auth/profile` - Profil
- `PUT /api/auth/profile` - Modifier profil
- `POST /api/auth/change-password` - Changer mot de passe
- `POST /api/auth/logout` - Déconnexion

### Equipment
- `GET /api/equipment` - Liste
- `GET /api/equipment/:id` - Détails
- `POST /api/equipment` - Créer
- `PUT /api/equipment/:id` - Modifier
- `DELETE /api/equipment/:id` - Supprimer
- `POST /api/equipment/:id/lend` - Prêter
- `POST /api/equipment/:id/return` - Retourner
- `GET /api/equipment/stats` - Statistiques

### Orphans
- `GET /api/orphans` - Liste
- `GET /api/orphans/:id` - Détails
- `POST /api/orphans` - Créer
- `PUT /api/orphans/:id` - Modifier
- `DELETE /api/orphans/:id` - Supprimer
- `POST /api/orphans/:id/sponsor` - Parrainer
- `GET /api/orphans/stats` - Statistiques

### Donors
- `GET /api/donors` - Liste
- `GET /api/donors/:id` - Détails
- `GET /api/donors/:id/donations` - Historique
- `POST /api/donors` - Créer
- `PUT /api/donors/:id` - Modifier
- `DELETE /api/donors/:id` - Supprimer
- `GET /api/donors/stats` - Statistiques

### Donations
- `GET /api/donations` - Liste
- `GET /api/donations/:id` - Détails
- `POST /api/donations` - Créer
- `PUT /api/donations/:id` - Modifier
- `DELETE /api/donations/:id` - Supprimer
- `GET /api/donations/stats` - Statistiques
- `GET /api/donations/report` - Rapport

### Zakat
- `GET /api/zakat` - Liste
- `GET /api/zakat/:id` - Détails
- `POST /api/zakat` - Créer
- `PUT /api/zakat/:id` - Modifier
- `DELETE /api/zakat/:id` - Supprimer
- `POST /api/zakat/:id/distribute` - Marquer comme distribué
- `GET /api/zakat/stats` - Statistiques
- `GET /api/zakat/report` - Rapport

## 🔐 Authentification

Toutes les routes (sauf login/register) nécessitent un token JWT dans le header:

```
Authorization: Bearer <token>
```

## 👥 Rôles

- **Admin**: Accès complet
- **Manager**: Gestion quotidienne
- **Volunteer**: Consultation et opérations basiques

## 📝 Format des réponses

```json
{
  "success": true,
  "message": "Message de succès",
  "data": { ... },
  "pagination": {
    "currentPage": 1,
    "itemsPerPage": 10,
    "totalItems": 50,
    "totalPages": 5
  }
}
```

## 🚀 Déploiement sur Render

### 1. Configuration du Service

1. **Connectez votre repository GitHub** à Render
2. **Créez un Web Service** avec ces paramètres:
   - **Name**: `association-backend`
   - **Environment**: `Node`
   - **Root Directory**: `./`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Instance Type**: `Free` ou `Starter`

### 2. Variables d'Environnement Render

Ajoutez ces variables dans votre service Render:

```bash
NODE_ENV=production
PORT=3001
MONGODB_URI=votre_uri_mongodb_atlas
JWT_SECRET=votre_jwt_secret_tres_securise
JWT_EXPIRE=7d
FRONTEND_URL=votre_url_frontend_render
```

### 3. Configuration MongoDB Atlas

1. Créez un compte sur [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Créez un cluster gratuit
3. Configurez l'accès réseau (autorisez Render: 0.0.0.0/0)
4. Créez un utilisateur de base de données
5. Copiez l'URI de connexion dans les variables Render

### 4. URL de Déploiement

Une fois déployé, votre API sera accessible:
`https://votre-service-name.onrender.com`

## 🧪 Tests

```bash
npm test
```

## 📄 License

MIT
