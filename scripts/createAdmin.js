const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const User = require('../src/models/User');
const { ROLES } = require('../src/config/constants');

const createProperAdmin = async () => {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connecté à MongoDB');

    // Create proper admin user
    const adminEmail = 'admin@association.com';
    const existingAdmin = await User.findOne({ email: adminEmail });
    
    if (!existingAdmin) {
      const adminUser = {
        username: 'admin',
        email: adminEmail,
        password: 'admin123',
        firstName: 'Admin',
        lastName: 'User',
        role: ROLES.ADMIN,
        phone: '+212600000000',
        isActive: true,
        pagePermissions: [
          'dashboard',
          'patients',
          'equipment',
          'orphans',
          'donors',
          'volunteers',
          'users',
          'role-management',
          'zakat',
          'don-ramadhan',
          'ramadhan'
        ]
      };

      const user = await User.create(adminUser);
      console.log('🎉 Administrateur créé avec succès:');
      console.log('   Email: admin@association.com');
      console.log('   Mot de passe: admin123');
      console.log('   Rôle: admin');
      console.log('   ID:', user._id);
    } else {
      console.log('👤 L\'administrateur admin@association.com existe déjà');
    }

  } catch (error) {
    console.error('❌ Erreur lors de la création de l\'administrateur:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Connexion à la base de données fermée');
  }
};

createProperAdmin();
