const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const User = require('../src/models/User');

const resetAdminPassword = async (email, newPassword) => {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connecté à MongoDB');

    // Find the user
    const user = await User.findOne({ email });
    
    if (!user) {
      console.log(`❌ Aucun utilisateur trouvé avec l'email: ${email}`);
      
      // List all admin users
      const admins = await User.find({ role: 'admin' });
      if (admins.length > 0) {
        console.log('\n👤 Administrateurs disponibles:');
        admins.forEach((admin, index) => {
          console.log(`   ${index + 1}. Email: ${admin.email || 'Non défini'}, Username: ${admin.username}, ID: ${admin._id}`);
        });
      }
      
      await mongoose.connection.close();
      return;
    }

    // Update password
    user.password = newPassword;
    await user.save();

    console.log('🎉 Mot de passe réinitialisé avec succès:');
    console.log(`   Email: ${user.email}`);
    console.log(`   Username: ${user.username}`);
    console.log(`   Nouveau mot de passe: ${newPassword}`);
    console.log(`   Rôle: ${user.role}`);

  } catch (error) {
    console.error('❌ Erreur lors de la réinitialisation du mot de passe:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Connexion à la base de données fermée');
  }
};

// Get command line arguments
const args = process.argv.slice(2);
const email = args[0] || 'admin@association.com';
const newPassword = args[1] || 'admin123';

console.log(`🔧 Réinitialisation du mot de passe pour: ${email}`);
resetAdminPassword(email, newPassword);
