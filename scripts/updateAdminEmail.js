const mongoose = require('mongoose');
require('dotenv').config();

const User = require('../src/models/User');

const updateAdminEmail = async () => {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connecté à MongoDB');

    // Find the admin user with undefined email
    const adminUser = await User.findOne({ username: 'admin' });
    
    if (adminUser) {
      adminUser.email = 'admin@association.com';
      adminUser.firstName = adminUser.firstName || 'Admin';
      adminUser.lastName = adminUser.lastName || 'User';
      adminUser.phone = adminUser.phone || '+212600000000';
      adminUser.isActive = adminUser.isActive !== undefined ? adminUser.isActive : true;
      await adminUser.save();
      
      console.log('🎉 Email de l\'administrateur mis à jour:');
      console.log('   Username: admin');
      console.log('   Email: admin@association.com');
      console.log('   ID:', adminUser._id);
      console.log('   Mot de passe: admin123 (présumé)');
    } else {
      console.log('❌ Aucun utilisateur admin trouvé');
    }

  } catch (error) {
    console.error('❌ Erreur lors de la mise à jour:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Connexion à la base de données fermée');
  }
};

updateAdminEmail();
