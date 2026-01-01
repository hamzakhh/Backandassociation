const mongoose = require('mongoose');
const logger = require('../utils/logger');

const connectDB = async () => {
  const maxRetries = 5;
  const retryDelay = 5000; // 5 seconds
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`🔗 Tentative de connexion à MongoDB (${attempt}/${maxRetries})...`);
      const conn = await mongoose.connect(process.env.MONGODB_URI, {
        serverSelectionTimeoutMS: 10000, // 10 seconds timeout
        connectTimeoutMS: 10000,
      });

      logger.info(`MongoDB connecté: ${conn.connection.host}`);
      console.log('✅ Base de données connectée avec succès');
      return conn;
    } catch (error) {
      logger.error(`Erreur de connexion MongoDB (tentative ${attempt}): ${error.message}`);
      console.error(`❌ Erreur de connexion MongoDB (tentative ${attempt}):`, error.message);
      
      if (attempt === maxRetries) {
        console.error('❌ Échec de connexion après toutes les tentatives');
        // Don't exit in production, just log the error
        if (process.env.NODE_ENV !== 'production') {
          process.exit(1);
        }
        return;
      }
      
      // Wait before retrying
      console.log(`🔄 Nouvelle tentative dans ${retryDelay/1000} secondes...`);
      await new Promise(resolve => setTimeout(resolve, retryDelay));
    }
  }
};

// Événements de connexion
mongoose.connection.on('connected', () => {
  logger.info('Mongoose connecté à MongoDB');
});

mongoose.connection.on('error', (err) => {
  logger.error(`Erreur de connexion Mongoose: ${err}`);
});

mongoose.connection.on('disconnected', () => {
  logger.warn('Mongoose déconnecté de MongoDB');
});

// Fermeture propre
process.on('SIGINT', async () => {
  await mongoose.connection.close();
  logger.info('Connexion MongoDB fermée suite à l\'arrêt de l\'application');
  process.exit(0);
});

module.exports = connectDB;
