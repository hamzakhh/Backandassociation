const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { uploadPatientPhotos } = require('../middleware/upload');
const {
  getPatients,
  getPatientById,
  createPatient,
  updatePatient,
  deletePatient,
  getPatientStats
} = require('../controllers/patientController');

// Routes accessibles par tous les utilisateurs authentifiés
router.get('/', protect, getPatients);
router.get('/stats', protect, getPatientStats);
router.get('/:id', protect, getPatientById);

// Routes protégées (admin uniquement pour création, modification, suppression)
router.post(
  '/',
  protect,
  authorize('admin'),
  uploadPatientPhotos.fields([
    { name: 'cinPhoto', maxCount: 1 },
    { name: 'contractPhoto', maxCount: 1 },
    { name: 'notebookPhoto', maxCount: 1 }
  ]),
  createPatient
);

router.put(
  '/:id',
  protect,
  authorize('admin'),
  uploadPatientPhotos.fields([
    { name: 'cinPhoto', maxCount: 1 },
    { name: 'contractPhoto', maxCount: 1 },
    { name: 'notebookPhoto', maxCount: 1 }
  ]),
  updatePatient
);

router.delete(
  '/:id',
  protect,
  authorize('admin'),
  deletePatient
);

module.exports = router;
