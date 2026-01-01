const Donation = require('../models/Donation');
const { formatPaginatedResponse, getPaginationParams, generateReceiptNumber } = require('../utils/helpers');
const logger = require('../utils/logger');

exports.getAllDonations = async (req, res, next) => {
  try {
    const { page, limit, category, type, startDate, endDate } = req.query;
    const { skip, itemsPerPage } = getPaginationParams(page, limit);

    const filter = {};
    if (category) filter.category = category;
    if (type) filter.type = type;
    if (startDate || endDate) {
      filter.paymentDate = {};
      if (startDate) filter.paymentDate.$gte = new Date(startDate);
      if (endDate) filter.paymentDate.$lte = new Date(endDate);
    }

    const donations = await Donation.find(filter)
      .sort({ paymentDate: -1 })
      .skip(skip)
      .limit(itemsPerPage)
      .populate('donor', 'firstName lastName companyName email phone')
      .populate('createdBy', 'firstName lastName');

    const total = await Donation.countDocuments(filter);

    res.status(200).json({
      success: true,
      ...formatPaginatedResponse(donations, page, limit, total),
    });
  } catch (error) {
    next(error);
  }
};

exports.getDonationById = async (req, res, next) => {
  try {
    const donation = await Donation.findById(req.params.id)
      .populate('donor')
      .populate('createdBy', 'firstName lastName');

    if (!donation) {
      return res.status(404).json({
        success: false,
        message: 'Donation non trouvée',
      });
    }

    res.status(200).json({
      success: true,
      data: donation,
    });
  } catch (error) {
    next(error);
  }
};

exports.createDonation = async (req, res, next) => {
  try {
    req.body.createdBy = req.user._id;
    
    // Générer un numéro de reçu si non fourni
    if (!req.body.receiptNumber) {
      req.body.receiptNumber = generateReceiptNumber();
    }

    const donation = await Donation.create(req.body);
    await donation.populate('donor', 'firstName lastName companyName');

    logger.info(`Donation créée: ${donation.amount} DZD de ${donation.donor.firstName || donation.donor.companyName} par ${req.user.email}`);

    res.status(201).json({
      success: true,
      message: 'Donation enregistrée avec succès',
      data: donation,
    });
  } catch (error) {
    next(error);
  }
};

exports.updateDonation = async (req, res, next) => {
  try {
    const donation = await Donation.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('donor');

    if (!donation) {
      return res.status(404).json({
        success: false,
        message: 'Donation non trouvée',
      });
    }

    logger.info(`Donation mise à jour: ${donation.receiptNumber} par ${req.user.email}`);

    res.status(200).json({
      success: true,
      message: 'Donation mise à jour',
      data: donation,
    });
  } catch (error) {
    next(error);
  }
};

exports.deleteDonation = async (req, res, next) => {
  try {
    const donation = await Donation.findByIdAndDelete(req.params.id);

    if (!donation) {
      return res.status(404).json({
        success: false,
        message: 'Donation non trouvée',
      });
    }

    logger.info(`Donation supprimée: ${donation.receiptNumber} par ${req.user.email}`);

    res.status(200).json({
      success: true,
      message: 'Donation supprimée',
    });
  } catch (error) {
    next(error);
  }
};

exports.getDonationStats = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    
    const matchStage = {};
    if (startDate || endDate) {
      matchStage.paymentDate = {};
      if (startDate) matchStage.paymentDate.$gte = new Date(startDate);
      if (endDate) matchStage.paymentDate.$lte = new Date(endDate);
    }

    const stats = await Donation.aggregate([
      ...(Object.keys(matchStage).length > 0 ? [{ $match: matchStage }] : []),
      {
        $group: {
          _id: null,
          totalAmount: { $sum: '$amount' },
          count: { $sum: 1 },
          avgAmount: { $avg: '$amount' },
        },
      },
    ]);

    const byCategory = await Donation.aggregate([
      ...(Object.keys(matchStage).length > 0 ? [{ $match: matchStage }] : []),
      {
        $group: {
          _id: '$category',
          total: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
    ]);

    const byType = await Donation.aggregate([
      ...(Object.keys(matchStage).length > 0 ? [{ $match: matchStage }] : []),
      {
        $group: {
          _id: '$type',
          total: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
    ]);

    res.status(200).json({
      success: true,
      data: {
        overview: stats[0] || { totalAmount: 0, count: 0, avgAmount: 0 },
        byCategory,
        byType,
      },
    });
  } catch (error) {
    next(error);
  }
};

exports.getDonationReport = async (req, res, next) => {
  try {
    const { year, month } = req.query;

    const matchStage = {};
    if (year) {
      matchStage.$expr = { $eq: [{ $year: '$paymentDate' }, parseInt(year)] };
      if (month) {
        matchStage.$expr = {
          $and: [
            { $eq: [{ $year: '$paymentDate' }, parseInt(year)] },
            { $eq: [{ $month: '$paymentDate' }, parseInt(month)] },
          ],
        };
      }
    }

    const report = await Donation.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: {
            year: { $year: '$paymentDate' },
            month: { $month: '$paymentDate' },
            category: '$category',
          },
          total: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
      { $sort: { '_id.year': -1, '_id.month': -1 } },
    ]);

    res.status(200).json({
      success: true,
      data: report,
    });
  } catch (error) {
    next(error);
  }
};
