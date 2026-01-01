const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { uploadVolunteerPhoto: upload } = require('../middleware/upload');
const {
  getVolunteers,
  getVolunteerById,
  createVolunteer,
  updateVolunteer,
  deleteVolunteer,
  getVolunteerStats
} = require('../controllers/volunteerController');

// Routes accessibles par tous les utilisateurs authentifiés
router.get('/', protect, getVolunteers);
router.get('/stats', protect, getVolunteerStats);
router.get('/:id', protect, getVolunteerById);

// Routes protégées (admin uniquement)
router.post('/', protect, authorize('admin'), upload.single('photo'), createVolunteer);

router.put('/:id', protect, authorize('admin'), upload.single('photo'), updateVolunteer);

router.delete(
  '/:id',
  protect,
  authorize('admin'),
  deleteVolunteer
);

module.exports = router;
