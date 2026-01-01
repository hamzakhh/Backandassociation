const Equipment = require('../models/Equipment');
const { formatPaginatedResponse, getPaginationParams } = require('../utils/helpers');
const { EQUIPMENT_STATUS } = require('../config/constants');
const logger = require('../utils/logger');

/**
 * @desc    Obtenir tous les équipements
 * @route   GET /api/equipment
 * @access  Private
 */
exports.getAllEquipment = async (req, res, next) => {
  try {
    const { page, limit, status, category, search } = req.query;
    const { skip, itemsPerPage } = getPaginationParams(page, limit);

    // Construire le filtre
    const filter = {};
    if (status) filter.status = status;
    if (category) filter.category = category;
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { type: { $regex: search, $options: 'i' } },
        { serialNumber: { $regex: search, $options: 'i' } },
        { category: { $regex: search, $options: 'i' } },
      ];
    }

    // Récupérer les équipements
    const equipment = await Equipment.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(itemsPerPage)
      .populate('createdBy', 'firstName lastName')
      .populate('assignedUserId', 'firstName lastName role');

    const total = await Equipment.countDocuments(filter);

    res.status(200).json({
      success: true,
      ...formatPaginatedResponse(equipment, page, limit, total),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Obtenir un équipement par ID
 * @route   GET /api/equipment/:id
 * @access  Private
 */
exports.getEquipmentById = async (req, res, next) => {
  try {
    const equipment = await Equipment.findById(req.params.id)
      .populate('createdBy', 'firstName lastName')
      .populate('loanHistory.lentBy', 'firstName lastName')
      .populate('loanHistory.returnedBy', 'firstName lastName')
      .populate('maintenanceHistory.performedBy', 'firstName lastName');

    if (!equipment) {
      return res.status(404).json({
        success: false,
        message: 'Équipement non trouvé',
      });
    }

    res.status(200).json({
      success: true,
      data: equipment,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Créer un équipement
 * @route   POST /api/equipment
 * @access  Private (Admin/Manager)
 */
exports.createEquipment = async (req, res, next) => {
  try {
    req.body.createdBy = req.user._id;

    const equipment = await Equipment.create(req.body);

    logger.info(`Équipement créé: ${equipment.name} par ${req.user.email}`);

    res.status(201).json({
      success: true,
      message: 'Équipement créé avec succès',
      data: equipment,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Mettre à jour un équipement
 * @route   PUT /api/equipment/:id
 * @access  Private (Admin/Manager)
 */
exports.updateEquipment = async (req, res, next) => {
  try {
    const equipment = await Equipment.findById(req.params.id);

    if (!equipment) {
      return res.status(404).json({
        success: false,
        message: 'Équipement non trouvé',
      });
    }

    // Ne pas permettre la modification de certains champs via cette route
    delete req.body.loanHistory;
    delete req.body.maintenanceHistory;
    delete req.body.currentBorrower;

    Object.assign(equipment, req.body);
    await equipment.save();

    logger.info(`Équipement mis à jour: ${equipment.name} par ${req.user.email}`);

    res.status(200).json({
      success: true,
      message: 'Équipement mis à jour',
      data: equipment,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Supprimer un équipement
 * @route   DELETE /api/equipment/:id
 * @access  Private (Admin)
 */
exports.deleteEquipment = async (req, res, next) => {
  try {
    console.log('=== DÉBUT deleteEquipment ===');
    console.log('Headers de la requête:', req.headers);
    console.log('Utilisateur effectuant la suppression:', req.user);
    console.log('ID reçu:', req.params.id);
    
    // Vérifier si l'ID est valide
    if (!req.params.id || !require('mongoose').Types.ObjectId.isValid(req.params.id)) {
      console.error('ID invalide:', req.params.id);
      return res.status(400).json({
        success: false,
        message: 'ID invalide',
      });
    }
    
    const equipment = await Equipment.findById(req.params.id);
    console.log('Équipement trouvé:', equipment ? 'Oui' : 'Non');

    if (!equipment) {
      console.log('Équipement non trouvé avec l\'ID:', req.params.id);
      return res.status(404).json({
        success: false,
        message: 'Équipement non trouvé',
      });
    }

    // Vérifier si l'équipement est prêté
    console.log('Statut de l\'équipement:', equipment.status);
    console.log('Valeur de EQUIPMENT_STATUS.LENT:', EQUIPMENT_STATUS.LENT);
    
    if (equipment.status === EQUIPMENT_STATUS.LENT) {
      console.log('Tentative de suppression d\'un équipement prêté');
      return res.status(400).json({
        success: false,
        message: 'Impossible de supprimer un équipement prêté',
      });
    }

    try {
      console.log('Tentative de suppression...');
      await equipment.deleteOne();
      console.log('Équipement supprimé avec succès');

      logger.info(`Équipement supprimé: ${equipment.name} par ${req.user.email}`);

      return res.status(200).json({
        success: true,
        message: 'Équipement supprimé',
      });
    } catch (deleteError) {
      console.error('Erreur lors de la suppression dans la base de données:', deleteError);
      throw deleteError; // Laisser le gestionnaire d'erreurs global gérer cela
    }
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Prêter un équipement
 * @route   POST /api/equipment/:id/lend
 * @access  Private
 */
exports.lendEquipment = async (req, res, next) => {
  try {
    const equipment = await Equipment.findById(req.params.id);

    if (!equipment) {
      return res.status(404).json({
        success: false,
        message: 'Équipement non trouvé',
      });
    }

    if (equipment.status === EQUIPMENT_STATUS.LENT) {
      return res.status(400).json({
        success: false,
        message: 'Équipement déjà prêté',
      });
    }

    if (equipment.status !== EQUIPMENT_STATUS.AVAILABLE) {
      return res.status(400).json({
        success: false,
        message: 'Équipement non disponible pour le prêt',
      });
    }

    const { name, phone, address, idCard } = req.body;

    equipment.lend({ name, phone, address, idCard }, req.user._id);
    await equipment.save();

    logger.info(`Équipement prêté: ${equipment.name} à ${name} par ${req.user.email}`);

    res.status(200).json({
      success: true,
      message: 'Équipement prêté avec succès',
      data: equipment,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Retourner un équipement
 * @route   POST /api/equipment/:id/return
 * @access  Private
 */
exports.returnEquipment = async (req, res, next) => {
  try {
    const equipment = await Equipment.findById(req.params.id);

    if (!equipment) {
      return res.status(404).json({
        success: false,
        message: 'Équipement non trouvé',
      });
    }

    if (equipment.status !== EQUIPMENT_STATUS.LENT) {
      return res.status(400).json({
        success: false,
        message: 'Équipement non prêté',
      });
    }

    const { condition, notes } = req.body;

    equipment.return(condition, notes, req.user._id);
    await equipment.save();

    logger.info(`Équipement retourné: ${equipment.name} par ${req.user.email}`);

    res.status(200).json({
      success: true,
      message: 'Équipement retourné avec succès',
      data: equipment,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Ajouter une maintenance
 * @route   POST /api/equipment/:id/maintenance
 * @access  Private
 */
exports.addMaintenance = async (req, res, next) => {
  try {
    const equipment = await Equipment.findById(req.params.id);

    if (!equipment) {
      return res.status(404).json({
        success: false,
        message: 'Équipement non trouvé',
      });
    }

    const { date, description, cost } = req.body;

    equipment.maintenanceHistory.push({
      date,
      description,
      cost,
      performedBy: req.user._id,
    });

    equipment.status = EQUIPMENT_STATUS.MAINTENANCE;
    await equipment.save();

    logger.info(`Maintenance ajoutée: ${equipment.name} par ${req.user.email}`);

    res.status(200).json({
      success: true,
      message: 'Maintenance enregistrée',
      data: equipment,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Obtenir les statistiques des équipements
 * @route   GET /api/equipment/stats
 * @access  Private
 */
exports.getEquipmentStats = async (req, res, next) => {
  try {
    const stats = await Equipment.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
    ]);

    const categoryStats = await Equipment.aggregate([
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
        },
      },
    ]);

    const total = await Equipment.countDocuments();

    res.status(200).json({
      success: true,
      data: {
        total,
        byStatus: stats,
        byCategory: categoryStats,
      },
    });
  } catch (error) {
    next(error);
  }
};
