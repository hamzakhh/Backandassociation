const express = require('express');
const router = express.Router();
const donorController = require('../controllers/donorController');
const { protect, authorize } = require('../middleware/auth');

// Routes publiques
router.get('/stats', donorController.getDonorStats);

// Routes protégées
router.use(protect);

router.get('/', authorize('admin', 'viewDonors'), donorController.getAllDonors);
router.get('/:id', authorize('admin', 'viewDonors'), donorController.getDonorById);
router.post('/', authorize('admin', 'createDonor'), donorController.createDonor);
router.put('/:id', authorize('admin', 'editDonor'), donorController.updateDonor);
router.delete('/:id', authorize('admin', 'deleteDonor'), donorController.deleteDonor);
router.get('/:id/donations', authorize('admin', 'viewDonations'), donorController.getDonorDonations);

module.exports = router;
