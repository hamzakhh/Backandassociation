const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const User = require('../src/models/User');
const { ROLES } = require('../src/config/constants');

const createDefaultAdmin = async () => {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connecté à MongoDB');

    // Check if any admin users exist
    const existingAdmins = await User.find({ role: ROLES.ADMIN });
    
    if (existingAdmins.length > 0) {
      console.log('👤 Administrateurs existants trouvés:');
      existingAdmins.forEach((admin, index) => {
        console.log(`   ${index + 1}. Email: ${admin.email}, Username: ${admin.username}, ID: ${admin._id}`);
      });
      console.log('\n💡 Utilisez l\'un de ces comptes pour vous connecter.');
      console.log('   Si vous avez oublié le mot de passe, vous pouvez créer un nouvel admin avec un email différent.');
      
      // Try to create a test admin with different credentials
      const testAdminEmail = 'testadmin@association.com';
      const existingTestAdmin = await User.findOne({ email: testAdminEmail });
      
      if (!existingTestAdmin) {
        console.log('\n� Création d\'un administrateur de test...');
        const testAdminUser = {
          username: 'testadmin',
          email: testAdminEmail,
          password: 'admin123',
          firstName: 'Test',
          lastName: 'Admin',
          role: ROLES.ADMIN,
          phone: '+212600000001',
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

        const user = await User.create(testAdminUser);
        console.log('🎉 Administrateur de test créé avec succès:');
        console.log('   Email: testadmin@association.com');
        console.log('   Mot de passe: admin123');
        console.log('   Rôle: admin');
        console.log('   ID:', user._id);
      }
      
      await mongoose.connection.close();
      return;
    }

    // Create default admin user
    const adminUser = {
      username: 'admin',
      email: 'admin@association.com',
      password: 'admin123', // This will be hashed by the pre-save hook
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
    console.log('🎉 Administrateur par défaut créé avec succès:');
    console.log('   Email: admin@association.com');
    console.log('   Mot de passe: admin123');
    console.log('   Rôle: admin');
    console.log('   ID:', user._id);

  } catch (error) {
    console.error('❌ Erreur lors de la création de l\'administrateur:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Connexion à la base de données fermée');
  }
};

// Run the seed function
createDefaultAdmin();
