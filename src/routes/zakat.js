const express = require('express');
const router = express.Router();
const { protect, authorize, ROLES } = require('../middleware/auth');
const {
  getAllZakat,
  getZakatById,
  createZakat,
  updateZakat,
  deleteZakat,
  markAsDistributed,
  getZakatStats,
  getZakatReport,
} = require('../controllers/zakatController');

router.use(protect);

router.get('/', getAllZakat);
router.get('/stats', getZakatStats);
router.get('/report', getZakatReport);
router.get('/:id', getZakatById);
router.post('/', authorize(ROLES.ADMIN, ROLES.MANAGER), createZakat);
router.put('/:id', authorize(ROLES.ADMIN, ROLES.MANAGER), updateZakat);
router.delete('/:id', authorize(ROLES.ADMIN), deleteZakat);
router.post('/:id/distribute', authorize(ROLES.ADMIN, ROLES.MANAGER), markAsDistributed);

module.exports = router;
