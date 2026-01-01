const mongoose = require('mongoose');
const logger = require('../utils/logger');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI);

    logger.info(`MongoDB connecté: ${conn.connection.host}`);
  } catch (error) {
    logger.error(`Erreur de connexion MongoDB: ${error.message}`);
    process.exit(1);
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
