const express = require('express');
const router = express.Router();
const { protect, authorize, ROLES } = require('../middleware/auth');
const {
  getAllEquipment,
  getEquipmentById,
  createEquipment,
  updateEquipment,
  deleteEquipment,
  lendEquipment,
  returnEquipment,
  addMaintenance,
  getEquipmentStats,
} = require('../controllers/equipmentController');

// Toutes les routes nécessitent une authentification
router.use(protect);

// Route pour les équipements disponibles (doit être avant /:id)
router.get('/available', (req, res, next) => {
  console.log('Received request to /available');
  console.log('Original URL:', req.originalUrl);
  console.log('Query params before:', req.query);
  
  // Ajouter le filtre de statut disponible
  req.query.status = 'available';
  console.log('Query params after:', req.query);
  
  // Appeler la méthode getAllEquipment avec le statut disponible
  return getAllEquipment(req, res, next);
});

// Route pour les statistiques
router.get('/stats', getEquipmentStats);

// Route pour la liste des équipements (avec filtrage optionnel via query params)
router.get('/', getAllEquipment);

// Route pour un équipement spécifique (doit être après les autres routes GET)
router.get('/:id', getEquipmentById);

// Routes nécessitant des permissions
router.post('/', authorize(ROLES.ADMIN, ROLES.MANAGER), createEquipment);
router.put('/:id', authorize(ROLES.ADMIN, ROLES.MANAGER), updateEquipment);
router.delete('/:id', authorize(ROLES.ADMIN), deleteEquipment);

// Routes de prêt/retour (accessibles à tous)
router.post('/:id/lend', lendEquipment);
router.post('/:id/return', returnEquipment);
router.post('/:id/maintenance', addMaintenance);

module.exports = router;
