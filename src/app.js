// Logging immédiat pour diagnostiquer le démarrage
console.log('🚀 Démarrage du backend...');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('MONGODB_URI définie:', !!process.env.MONGODB_URI);

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const path = require('path');

const connectDB = require('./config/database');
const logger = require('./utils/logger');
const { errorHandler, notFound } = require('./middleware/errorHandler');

// Importer les routes
const authRoutes = require('./routes/auth');
const equipmentRoutes = require('./routes/equipment');
const orphanRoutes = require('./routes/orphans');
const donorRoutes = require('./routes/donors');
const donationRoutes = require('./routes/donations');
const zakatRoutes = require('./routes/zakat');
const volunteerRoutes = require('./routes/volunteerRoutes');
const userRoutes = require('./routes/users');
const patientRoutes = require('./routes/patientRoutes');
const loanRoutes = require('./routes/loans');

// Initialiser l'application
const app = express();

// Connecter à la base de données
connectDB();

// Middleware de sécurité
app.use(helmet());

// CORS configuration
const corsOptions = {
  origin: function (origin, callback) {
    // Liste des origines autorisées
    const allowedOrigins = [
      process.env.FRONTEND_URL || 'http://localhost:3000',
      'http://localhost:3000',
      'http://localhost:3001',
      'http://localhost:5000',
      'http://localhost:5173',
      'http://127.0.0.1:3000',
      'http://127.0.0.1:3001',
      'http://127.0.0.1:5000',
      'http://127.0.0.1:5173',
      'http://localhost:3001/',
      'http://localhost:3001/*',
      'http://127.0.0.1:3001/'
    ];

    // Autoriser les requêtes sans origine (comme les requêtes Postman) ou si l'origine est dans la liste des autorisées
    if (!origin || allowedOrigins.some(allowedOrigin => 
      origin === allowedOrigin || 
      origin.startsWith(allowedOrigin.replace('*', ''))
    )) {
      callback(null, true);
    } else {
      console.log('Blocked by CORS:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  exposedHeaders: ['Content-Disposition'],
  optionsSuccessStatus: 204
};

app.use(cors(corsOptions));

// Body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir les fichiers statiques avec en-têtes CORS
app.use('/uploads', (req, res, next) => {
  res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.header('Access-Control-Allow-Methods', 'GET');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  next();
}, express.static(path.join(__dirname, 'uploads'), {
  setHeaders: (res) => {
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Cross-Origin-Resource-Policy', 'cross-origin');
  }
}));

// Compression
app.use(compression());

// Logger HTTP
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined', {
    stream: {
      write: (message) => logger.info(message.trim()),
    },
  }));
}

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  message: 'Trop de requêtes depuis cette IP, veuillez réessayer plus tard.',
});

app.use('/api', limiter);

// Routes de base
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'API Association Creative',
    version: '1.0.0',
    status: 'running',
    timestamp: new Date().toISOString(),
    endpoints: {
      auth: '/api/auth',
      equipment: '/api/equipment',
      orphans: '/api/orphans',
      donors: '/api/donors',
      donations: '/api/donations',
      zakat: '/api/zakat',
    },
  });
});

// Simple health check that doesn't require database
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Helper function to register routes with and without /api prefix
const registerRoutes = (path, router) => {
  app.use(`/api${path}`, router);
  app.use(path, router);
};

// Register all API routes with both /api/... and /... prefixes
registerRoutes('/auth', authRoutes);
registerRoutes('/users', userRoutes);
registerRoutes('/volunteers', volunteerRoutes);
registerRoutes('/patients', patientRoutes);
registerRoutes('/equipment', equipmentRoutes);
registerRoutes('/orphans', orphanRoutes);
registerRoutes('/donors', donorRoutes);
registerRoutes('/donations', donationRoutes);
registerRoutes('/zakat', zakatRoutes);
registerRoutes('/loans', loanRoutes);
// Keep v1 routes as they are for backward compatibility
app.use('/api/v1/volunteers', volunteerRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/patients', patientRoutes);

// Health check endpoint for Render
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Gestion des erreurs
app.use(notFound);
app.use(errorHandler);

// Démarrer le serveur avec gestion d'erreurs
const startServer = async () => {
  try {
    console.log('🔗 Connexion à la base de données...');
    await connectDB();
    console.log('✅ Base de données connectée');
    
    const PORT = process.env.PORT || 5000;
    console.log(`🌐 Démarrage du serveur sur le port ${PORT}`);
    
    const server = app.listen(PORT, () => {
      console.log(`🚀 Serveur démarré avec succès sur le port ${PORT}`);
      console.log('🔄 Serveur en écoute et prêt à recevoir des requêtes...');
      logger.info(`
      ╔═══════════════════════════════════════════════════╗
      ║                                                   ║
      ║   🚀 API Association Creative                     ║
      ║                                                   ║
      ║   📡 Serveur démarré sur le port ${PORT}             ║
      ║   🌍 Environnement: ${process.env.NODE_ENV || 'development'}          ║
      ║   📝 Logs: logs/combined.log                      ║
      ║                                                   ║
      ╚═══════════════════════════════════════════════════╝
      `);
    });
    
    // Log périodique pour confirmer que le serveur est en vie
    setInterval(() => {
      console.log('💚 Serveur actif - Uptime: ' + Math.floor(process.uptime()) + 's');
    }, 30000); // Toutes les 30 secondes
    
    return server;
  } catch (error) {
    console.error('❌ Erreur fatale au démarrage:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
};

// Lancer le serveur
startServer();

// Gestion des erreurs non gérées
process.on('unhandledRejection', (err) => {
  logger.error(`Erreur non gérée: ${err.message}`);
  logger.error(`Stack: ${err.stack}`);
  process.exit(1);
});

process.on('uncaughtException', (err) => {
  logger.error(`Exception non capturée: ${err.message}`);
  logger.error(`Stack: ${err.stack}`);
  process.exit(1);
});

// Log de démarrage réussi
logger.info('Configuration du serveur terminée, démarrage en cours...');

module.exports = app;
