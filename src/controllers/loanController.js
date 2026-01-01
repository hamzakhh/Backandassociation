const mongoose = require('mongoose');
const Loan = require('../models/Loan');
const Equipment = require('../models/Equipment');
const Patient = require('../models/Patient');
const asyncHandler = require('express-async-handler');
const { LOAN_STATUS } = require('../config/constants');

/**
 * @desc    Créer un nouveau prêt d'équipement
 * @route   POST /api/loans
 * @access  Privé
 */
const createLoan = asyncHandler(async (req, res) => {
  const { equipmentId, patientId, expectedReturnDate, notes } = req.body;
  const userId = req.user.id;

  // Vérifier que l'équipement est disponible
  const equipment = await Equipment.findById(equipmentId);
  if (!equipment) {
    res.status(404);
    throw new Error('Équipement non trouvé');
  }

  if (equipment.status !== 'available') {
    res.status(400);
    throw new Error('Cet équipement n\'est pas disponible pour le prêt');
  }

  // Vérifier que le patient existe
  const patient = await Patient.findById(patientId);
  if (!patient) {
    res.status(404);
    throw new Error('Patient non trouvé');
  }

  // Créer le prêt
  const loan = await Loan.create({
    equipment: equipmentId,
    patient: patientId,
    expectedReturnDate,
    conditionBefore: equipment.condition,
    notes,
    createdBy: userId,
    lastUpdatedBy: userId
  });

  // Mettre à jour l'équipement
  equipment.status = 'borrowed';
  equipment.currentBorrower = {
    name: `${patient.firstName} ${patient.lastName}`,
    phone: patient.phone,
    address: patient.address,
    idCard: '',
    lentDate: new Date()
  };
  equipment.loanHistory.push({
    borrower: {
      name: `${patient.firstName} ${patient.lastName}`,
      phone: patient.phone,
      address: patient.address,
      idCard: ''
    },
    lentDate: new Date(),
    condition: equipment.condition,
    lentBy: userId
  });
  await equipment.save();

  // Mettre à jour le patient
  patient.borrowedEquipment.push(equipmentId);
  patient.activeLoans += 1;
  await patient.save();

  res.status(201).json({
    success: true,
    data: loan
  });
});

/**
 * @desc    Retourner un équipement emprunté
 * @route   PUT /api/loans/:id/return
 * @access  Privé
 */
const returnEquipment = asyncHandler(async (req, res) => {
  try {
    console.log('Starting returnEquipment with params:', req.params, 'body:', req.body);
    const { condition, notes } = req.body;
    const userId = req.user.id;
    const loanId = req.params.id;

    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(loanId)) {
      console.error('Invalid loan ID format:', loanId);
      return res.status(400).json({
        success: false,
        message: 'ID de prêt invalide',
        error: 'INVALID_LOAN_ID',
        loanId
      });
    }

    console.log('Looking for loan with ID:', loanId);
    const loan = await Loan.findById(loanId);
    if (!loan) {
      console.error('Loan not found:', loanId);
      return res.status(404).json({
        success: false,
        message: 'Prêt non trouvé',
        error: 'LOAN_NOT_FOUND',
        loanId
      });
    }

    console.log('Found loan:', {
      id: loan._id,
      status: loan.status,
      equipment: loan.equipment,
      patient: loan.patient
    });

    if (loan.status === LOAN_STATUS.COMPLETED) {
      console.error('Loan already completed:', loanId);
      return res.status(400).json({
        success: false,
        message: 'Ce prêt est déjà clôturé',
        error: 'LOAN_ALREADY_COMPLETED',
        loanId
      });
    }

    console.log('Marking loan as returned...');
    // Mettre à jour le prêt
    await loan.markAsReturned(condition, notes, userId);
    console.log('Successfully marked loan as returned:', loanId);

    // Récupérer le prêt mis à jour avec les informations peuplées
    const updatedLoan = await Loan.findById(loanId)
      .populate('equipment', 'name type serialNumber')
      .populate('patient', 'firstName lastName')
      .populate('createdBy', 'name')
      .populate('closedBy', 'name');

    res.json({
      success: true,
      data: updatedLoan
    });
  } catch (error) {
    console.error('Error in returnEquipment:', {
      message: error.message,
      stack: error.stack,
      loanId: req.params.id,
      body: req.body
    });
    
    res.status(500).json({
      success: false,
      message: 'Erreur lors du retour de l\'équipement',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      errorCode: 'RETURN_EQUIPMENT_ERROR'
    });
  }
});

/**
 * @desc    Obtenir les détails d'un prêt
 * @route   GET /api/loans/:id
 * @access  Privé
 */
const getLoanDetails = asyncHandler(async (req, res) => {
  // Validate ObjectId format
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    res.status(400);
    throw new Error('ID de prêt invalide');
  }

  const loan = await Loan.findById(req.params.id)
    .populate('equipment', 'name type serialNumber')
    .populate('patient', 'firstName lastName phone')
    .populate('createdBy', 'name')
    .populate('closedBy', 'name');

  if (!loan) {
    res.status(404);
    throw new Error('Prêt non trouvé');
  }

  res.json({
    success: true,
    data: loan
  });
});

/**
 * @desc    Obtenir la liste des prêts actifs
 * @route   GET /api/loans/active
 * @access  Privé
 */
/**
 * @desc    Annuler un prêt
 * @route   PATCH /api/loans/:id/cancel
 * @access  Privé (admin, medical)
 */


const deleteLoan = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({
      success: false,
      message: 'ID de prêt invalide'
    });
  }

  const loan = await Loan.findById(id);
  if (!loan) {
    return res.status(404).json({
      success: false,
      message: 'Prêt non trouvé'
    });
  }

  await loan.deleteOne();

  res.json({
    success: true,
    message: 'Prêt supprimé avec succès'
  });
});

const cancelLoan = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { reason } = req.body;
  const userId = req.user.id;

  // Valider l'ID
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({
      success: false,
      message: 'ID de prêt invalide',
      error: 'INVALID_LOAN_ID'
    });
  }

  // Trouver le prêt
  const loan = await Loan.findById(id);
  if (!loan) {
    return res.status(404).json({
      success: false,
      message: 'Prêt non trouvé',
      error: 'LOAN_NOT_FOUND'
    });
  }

  // Vérifier si le prêt est déjà annulé
  if (loan.status === LOAN_STATUS.CANCELLED) {
    return res.status(400).json({
      success: false,
      message: 'Ce prêt est déjà annulé',
      error: 'LOAN_ALREADY_CANCELLED'
    });
  }

  // Vérifier si le prêt est déjà clôturé
  if (loan.status === LOAN_STATUS.COMPLETED) {
    return res.status(400).json({
      success: false,
      message: 'Impossible d\'annuler un prêt déjà clôturé',
      error: 'LOAN_ALREADY_COMPLETED'
    });
  }

  try {
    // Mettre à jour le statut du prêt
    loan.status = LOAN_STATUS.CANCELLED;
    loan.cancellationReason = reason;
    loan.closedBy = userId;
    loan.closedAt = new Date();
    loan.lastUpdatedBy = userId;
    await loan.save();

    // Mettre à jour le statut de l'équipement
    const Equipment = mongoose.model('Equipment');
    await Equipment.findByIdAndUpdate(loan.equipment, {
      $set: {
        status: 'available',
        currentBorrower: null,
        updatedAt: new Date()
      }
    });

    // Mettre à jour le compteur de prêts actifs du patient
    const Patient = mongoose.model('Patient');
    await Patient.findByIdAndUpdate(
      loan.patient,
      {
        $pull: { borrowedEquipment: loan.equipment },
        $inc: { activeLoans: -1 }
      }
    );

    res.json({
      success: true,
      message: 'Prêt annulé avec succès',
      data: loan
    });

  } catch (error) {
    console.error('Erreur lors de l\'annulation du prêt:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'annulation du prêt',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

const getActiveLoans = asyncHandler(async (req, res) => {
  try {
    console.log('Fetching active loans with query:', req.query);
    const { page = 1, limit = 10 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Get total count of active loans
    const total = await Loan.countDocuments({ status: LOAN_STATUS.ACTIVE });
    

    
    // Get paginated loans
    const loans = await Loan.find({ status: LOAN_STATUS.ACTIVE })
      .sort({ expectedReturnDate: 1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate([
        { path: 'equipment', select: 'name type serialNumber' },
        { path: 'patient', select: 'firstName lastName' },
        { path: 'createdBy', select: 'name' }
      ]);

    console.log('Found loans:', loans.length);
    
    res.json({
      success: true,
      count: loans.length,
      data: loans,
      totalPages: Math.ceil(total / parseInt(limit)),
      currentPage: parseInt(page)
    });
  } catch (error) {
    console.error('Error in getActiveLoans:', {
      message: error.message,
      stack: error.stack,
      query: req.query
    });
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des prêts actifs',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * @desc    Obtenir l'historique des prêts
 * @route   GET /api/loans/history
 * @access  Privé
 */
const getLoanHistory = asyncHandler(async (req, res) => {
  const { 
    page = 1, 
    limit = 10, 
    patientId, 
    equipmentId, 
    status,
    startDate,
    endDate
  } = req.query;

  const query = {};
  
  if (patientId) query.patient = patientId;
  if (equipmentId) query.equipment = equipmentId;
  if (status) query.status = status;
  
  if (startDate || endDate) {
    query.startDate = {};
    if (startDate) query.startDate.$gte = new Date(startDate);
    if (endDate) query.startDate.$lte = new Date(endDate);
  }

  const options = {
    page: parseInt(page),
    limit: parseInt(limit),
    sort: { startDate: -1 },
    populate: [
      { path: 'equipment', select: 'name type serialNumber' },
      { path: 'patient', select: 'firstName lastName' },
      { path: 'createdBy', select: 'name' },
      { path: 'closedBy', select: 'name' }
    ]
  };

  const history = await Loan.paginate(query, options);

  res.json({
    success: true,
    count: history.totalDocs,
    data: history.docs,
    totalPages: history.totalPages,
    currentPage: history.page
  });
});

/**
 * @desc    Obtenir les statistiques des prêts
 * @route   GET /api/loans/stats
 * @access  Privé
 */
const getLoanStats = asyncHandler(async (req, res) => {
  const [
    totalLoans,
    activeLoans,
    overdueLoans,
    equipmentStats,
    patientStats
  ] = await Promise.all([
    // Nombre total de prêts
    Loan.countDocuments(),
    
    // Nombre de prêts actifs
    Loan.countDocuments({ status: LOAN_STATUS.ACTIVE }),
    
    // Nombre de prêts en retard
    Loan.countDocuments({
      status: LOAN_STATUS.ACTIVE,
      expectedReturnDate: { $lt: new Date() }
    }),
    
    // Statistiques par type d'équipement
    Loan.aggregate([
      { $match: { status: LOAN_STATUS.ACTIVE } },
      { $lookup: { from: 'equipment', localField: 'equipment', foreignField: '_id', as: 'equipment' } },
      { $unwind: '$equipment' },
      { $group: { _id: '$equipment.type', count: { $sum: 1 } } }
    ]),
    
    // Top patients avec le plus de prêts
    Loan.aggregate([
      { $group: { _id: '$patient', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 },
      { $lookup: { from: 'patients', localField: '_id', foreignField: '_id', as: 'patient' } },
      { $unwind: '$patient' },
      { $project: { _id: 0, patient: { $concat: ['$patient.firstName', ' ', '$patient.lastName'] }, count: 1 } }
    ])
  ]);

  res.json({
    success: true,
    data: {
      totalLoans,
      activeLoans,
      overdueLoans,
      equipmentStats,
      topBorrowers: patientStats
    }
  });
});

module.exports = {
  createLoan,
  returnEquipment,
  getLoanDetails,
  getActiveLoans,
  cancelLoan,
  getLoanHistory,
  getLoanStats,
  deleteLoan
};
