const express = require('express');
const router = express.Router();
const { protect, authorize, ROLES } = require('../middleware/auth');
const {
  getAllDonations,
  getDonationById,
  createDonation,
  updateDonation,
  deleteDonation,
  getDonationStats,
  getDonationReport,
} = require('../controllers/donationController');

router.use(protect);

router.get('/', getAllDonations);
router.get('/stats', getDonationStats);
router.get('/report', getDonationReport);
router.get('/:id', getDonationById);
router.post('/', authorize(ROLES.ADMIN, ROLES.MANAGER), createDonation);
router.put('/:id', authorize(ROLES.ADMIN, ROLES.MANAGER), updateDonation);
router.delete('/:id', authorize(ROLES.ADMIN), deleteDonation);

module.exports = router;
