const User = require('../models/User');
const AppError = require('../utils/AppError');
const catchAsync = require('../utils/catchAsync');
const bcrypt = require('bcryptjs');

// Créer un nouvel utilisateur
exports.createUser = catchAsync(async (req, res, next) => {
  const { username, email, password, role, firstName, lastName, phone, pagePermissions } = req.body;

  // Vérifier si l'utilisateur existe déjà
  const userExists = await User.findOne({ $or: [{ email }, { username }] });
  if (userExists) {
    return next(new AppError('Un utilisateur avec cet email ou ce nom d\'utilisateur existe déjà', 400));
  }

  const user = await User.create({
    username,
    email,
    password,
    role,
    firstName,
    lastName,
    phone,
    pagePermissions
  });

  // Ne pas renvoyer le mot de passe
  user.password = undefined;

  res.status(201).json({
    status: 'success',
    data: {
      user
    }
  });
});

// Obtenir tous les utilisateurs
exports.getAllUsers = catchAsync(async (req, res, next) => {
  const users = await User.find().select('-password');

  res.status(200).json({
    status: 'success',
    results: users.length,
    data: {
      users
    }
  });
});

// Obtenir un utilisateur par son ID
exports.getUser = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.params.id).select('-password');

  if (!user) {
    return next(new AppError('Aucun utilisateur trouvé avec cet ID', 404));
  }

  res.status(200).json({
    status: 'success',
    data: {
      user
    }
  });
});

// Mettre à jour un utilisateur
exports.updateUser = catchAsync(async (req, res, next) => {
  const { password, ...updateData } = req.body;
  
  // Si le mot de passe est fourni, on le hache
  if (password) {
    updateData.password = await bcrypt.hash(password, 12);
  }

  const user = await User.findByIdAndUpdate(
    req.params.id,
    updateData,
    {
      new: true,
      runValidators: true
    }
  ).select('-password');

  if (!user) {
    return next(new AppError('Aucun utilisateur trouvé avec cet ID', 404));
  }

  res.status(200).json({
    status: 'success',
    data: {
      user
    }
  });
});

// Supprimer un utilisateur
exports.deleteUser = catchAsync(async (req, res, next) => {
  const user = await User.findByIdAndDelete(req.params.id);

  if (!user) {
    return next(new AppError('Aucun utilisateur trouvé avec cet ID', 404));
  }

  res.status(204).json({
    status: 'success',
    data: null
  });
});
