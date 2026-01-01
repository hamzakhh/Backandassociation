const express = require('express');
const router = express.Router();
const { protect, authorize, ROLES } = require('../middleware/auth');
const {
  getAllDonors,
  getDonorById,
  createDonor,
  updateDonor,
  deleteDonor,
  getDonorDonations,
  getDonorStats,
} = require('../controllers/donorController');

router.use(protect);

router.get('/', getAllDonors);
router.get('/stats', getDonorStats);
router.get('/:id', getDonorById);
router.get('/:id/donations', getDonorDonations);
router.post('/', authorize(ROLES.ADMIN, ROLES.MANAGER), createDonor);
router.put('/:id', authorize(ROLES.ADMIN, ROLES.MANAGER), updateDonor);
router.delete('/:id', authorize(ROLES.ADMIN), deleteDonor);

module.exports = router;
