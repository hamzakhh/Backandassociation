const express = require('express');
const router = express.Router({ mergeParams: true });
const loanController = require('../controllers/loanController');
const { protect, authorize } = require('../middleware/auth');

// Routes protégées - nécessitent une authentification
router.use(protect);

// 1. Définir d'abord toutes les routes spécifiques
// 1.1 Route pour les prêts actifs
router.get('/active', loanController.getActiveLoans);

// 1.2 Route pour les statistiques des prêts
router.get('/stats', authorize('admin', 'medical'), loanController.getLoanStats);

// 1.3 Route pour l'historique des prêts
router.get('/', loanController.getLoanHistory);

// 1.4 Route pour créer un prêt (doit être avant /:id)
router.post('/', authorize('admin', 'medical'), loanController.createLoan);

// 2. Définir ensuite les routes avec paramètres
// 2.1 Route pour retourner un équipement
router.put('/:id/return', authorize('admin', 'medical'), loanController.returnEquipment);

// 2.2 Route pour annuler un prêt
router.put('/:id/cancel', authorize('admin', 'medical'), loanController.cancelLoan);
//delete pret
router.delete('/:id', authorize('admin', 'medical'), loanController.deleteLoan);

// 2.3 Route pour un prêt spécifique (doit être la dernière)
router.route('/:id')
  .get(loanController.getLoanDetails);

module.exports = router;
