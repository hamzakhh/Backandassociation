const Orphan = require('../models/Orphan');
const { formatPaginatedResponse, getPaginationParams } = require('../utils/helpers');
const logger = require('../utils/logger');
const path = require('path');
const fs = require('fs');

// Fonction utilitaire pour traiter les données de la requête
const processOrphanData = (req) => {
  const data = { ...req.body };
  
  // Si un fichier a été téléchargé
  if (req.file) {
    data.photo = `/uploads/orphans/${req.file.filename}`;
  }
  
  // Traitement des champs imbriqués si nécessaire
  if (typeof data.guardian === 'string') {
    try {
      data.guardian = JSON.parse(data.guardian);
    } catch (error) {
      logger.error('Erreur lors du parsing de guardian:', error);
    }
  }
  
  if (typeof data.sponsorship === 'string') {
    try {
      data.sponsorship = JSON.parse(data.sponsorship);
    } catch (error) {
      logger.error('Erreur lors du parsing de sponsorship:', error);
    }
  }
  
  return data;
};

exports.getAllOrphans = async (req, res, next) => {
  try {
    const { page, limit, status, search } = req.query;
    const { skip, itemsPerPage } = getPaginationParams(page, limit);

    const filter = {};
    if (status) filter.status = status;
    if (search) {
      filter.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
      ];
    }

    const orphans = await Orphan.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(itemsPerPage)
      .populate('sponsorship.sponsor', 'firstName lastName companyName')
      .populate('createdBy', 'firstName lastName');

    const total = await Orphan.countDocuments(filter);

    res.status(200).json({
      success: true,
      ...formatPaginatedResponse(orphans, page, limit, total),
    });
  } catch (error) {
    next(error);
  }
};

exports.getOrphanById = async (req, res, next) => {
  try {
    const orphan = await Orphan.findById(req.params.id)
      .populate('sponsorship.sponsor')
      .populate('createdBy', 'firstName lastName');

    if (!orphan) {
      return res.status(404).json({
        success: false,
        message: 'Orphelin non trouvé',
      });
    }

    res.status(200).json({
      success: true,
      data: orphan,
    });
  } catch (error) {
    next(error);
  }
};

exports.createOrphan = async (req, res, next) => {
  try {
    const data = processOrphanData(req);
    data.createdBy = req.user._id;
    
    const orphan = await Orphan.create(data);

    logger.info(`Orphelin créé: ${orphan.fullName} par ${req.user.email}`);

    res.status(201).json({
      success: true,
      message: 'Orphelin créé avec succès',
      data: orphan,
    });
  } catch (error) {
    // Supprimer le fichier téléchargé en cas d'erreur
    if (req.file) {
      const filePath = path.join(__dirname, '..', 'uploads', 'orphans', req.file.filename);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }
    next(error);
  }
};

exports.updateOrphan = async (req, res, next) => {
  try {
    const data = processOrphanData(req);
    const orphan = await Orphan.findById(req.params.id);
    
    if (!orphan) {
      // Supprimer le fichier téléchargé si l'orphelin n'existe pas
      if (req.file) {
        const filePath = path.join(__dirname, '..', 'uploads', 'orphans', req.file.filename);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      }
      return res.status(404).json({
        success: false,
        message: 'Orphelin non trouvé',
      });
    }
    
    // Si une nouvelle photo est téléchargée, supprimer l'ancienne
    if (req.file && orphan.photo) {
      const oldPhotoPath = path.join(__dirname, '..', orphan.photo);
      if (fs.existsSync(oldPhotoPath)) {
        fs.unlinkSync(oldPhotoPath);
      }
    }
    
    // Mettre à jour l'orphelin
    const updatedOrphan = await Orphan.findByIdAndUpdate(
      req.params.id,
      data,
      { new: true, runValidators: true }
    );

    logger.info(`Orphelin mis à jour: ${updatedOrphan.fullName} par ${req.user.email}`);

    res.status(200).json({
      success: true,
      message: 'Orphelin mis à jour',
      data: updatedOrphan,
    });
  } catch (error) {
    // Supprimer le fichier téléchargé en cas d'erreur
    if (req.file) {
      const filePath = path.join(__dirname, '..', 'uploads', 'orphans', req.file.filename);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }
    next(error);
  }
};

exports.deleteOrphan = async (req, res, next) => {
  try {
    const orphan = await Orphan.findById(req.params.id);

    if (!orphan) {
      return res.status(404).json({
        success: false,
        message: 'Orphelin non trouvé',
      });
    }
    
    // Supprimer la photo associée si elle existe
    if (orphan.photo) {
      const photoPath = path.join(__dirname, '..', orphan.photo);
      if (fs.existsSync(photoPath)) {
        fs.unlinkSync(photoPath);
      }
    }
    
    // Supprimer l'orphelin de la base de données
    await Orphan.deleteOne({ _id: req.params.id });

    logger.info(`Orphelin supprimé: ${orphan.fullName} par ${req.user.email}`);

    res.status(200).json({
      success: true,
      message: 'Orphelin supprimé',
    });
  } catch (error) {
    next(error);
  }
};

exports.sponsorOrphan = async (req, res, next) => {
  try {
    const { sponsor, monthlyAmount, startDate } = req.body;

    const orphan = await Orphan.findById(req.params.id);

    if (!orphan) {
      return res.status(404).json({
        success: false,
        message: 'Orphelin non trouvé',
      });
    }

    orphan.sponsorship = {
      isSponsored: true,
      sponsor,
      monthlyAmount,
      startDate,
    };

    await orphan.save();

    logger.info(`Orphelin parrainé: ${orphan.fullName} par ${req.user.email}`);

    res.status(200).json({
      success: true,
      message: 'Parrainage enregistré',
      data: orphan,
    });
  } catch (error) {
    next(error);
  }
};

exports.getOrphanStats = async (req, res, next) => {
  try {
    const total = await Orphan.countDocuments();
    const sponsored = await Orphan.countDocuments({ 'sponsorship.isSponsored': true });
    const byStatus = await Orphan.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);
    const byGender = await Orphan.aggregate([
      { $group: { _id: '$gender', count: { $sum: 1 } } },
    ]);

    res.status(200).json({
      success: true,
      data: {
        total,
        sponsored,
        notSponsored: total - sponsored,
        byStatus,
        byGender,
      },
    });
  } catch (error) {
    next(error);
  }
};
