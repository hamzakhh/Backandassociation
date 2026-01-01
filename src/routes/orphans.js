const express = require('express');
const router = express.Router();
const multer = require('multer');
const { uploadOrphanPhoto: upload } = require('../middleware/upload');
const { protect, authorize, ROLES } = require('../middleware/auth');
const {
  getAllOrphans,
  getOrphanById,
  createOrphan,
  updateOrphan,
  deleteOrphan,
  sponsorOrphan,
  getOrphanStats,
} = require('../controllers/orphanController');

router.use(protect);

// Routes GET
router.get('/', getAllOrphans);
router.get('/stats', getOrphanStats);
router.get('/:id', getOrphanById);

// Routes protégées nécessitant des droits d'administration
router.post('/', authorize(ROLES.ADMIN, ROLES.MANAGER), upload.single('photo'), createOrphan);

router.put('/:id', authorize(ROLES.ADMIN, ROLES.MANAGER), upload.single('photo'), updateOrphan);

router.delete('/:id', authorize(ROLES.ADMIN), deleteOrphan);
router.post('/:id/sponsor', authorize(ROLES.ADMIN, ROLES.MANAGER), sponsorOrphan);

// Gestion des erreurs de téléchargement de fichiers
router.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    return res.status(400).json({
      success: false,
      message: err.message,
    });
  } else if (err) {
    return res.status(500).json({
      success: false,
      message: 'Erreur de serveur interne lors du téléchargement du fichier.',
    });
  }
  next();
});

module.exports = router;
