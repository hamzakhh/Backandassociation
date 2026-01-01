const express = require('express');
const userController = require('../controllers/userController');
const authController = require('../controllers/authController');
const { ROLES } = require('../config/constants');

const router = express.Router();

// Protéger toutes les routes après ce middleware (nécessite d'être connecté)
router.use(authController.protect);

// Restreindre l'accès aux administrateurs uniquement
router.use(authController.restrictTo(ROLES.ADMIN));

router
  .route('/')
  .get(userController.getAllUsers)
  .post(userController.createUser);

router
  .route('/:id')
  .get(userController.getUser)
  .patch(userController.updateUser)
  .delete(userController.deleteUser);

module.exports = router;
