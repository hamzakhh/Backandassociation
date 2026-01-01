const Donor = require('../models/Donor');
const Donation = require('../models/Donation');
const { formatPaginatedResponse, getPaginationParams } = require('../utils/helpers');
const logger = require('../utils/logger');

exports.getAllDonors = async (req, res, next) => {
  try {
    const { page, limit, type, search } = req.query;
    const { skip, itemsPerPage } = getPaginationParams(page, limit);

    const filter = {};
    if (type) filter.type = type;
    if (search) {
      filter.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { companyName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
      ];
    }

    const donors = await Donor.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(itemsPerPage)
      .populate('sponsoredOrphans', 'firstName lastName');

    const total = await Donor.countDocuments(filter);

    res.status(200).json({
      success: true,
      ...formatPaginatedResponse(donors, page, limit, total),
    });
  } catch (error) {
    next(error);
  }
};

exports.getDonorById = async (req, res, next) => {
  try {
    const donor = await Donor.findById(req.params.id)
      .populate('sponsoredOrphans');

    if (!donor) {
      return res.status(404).json({
        success: false,
        message: 'Donateur non trouvé',
      });
    }

    res.status(200).json({
      success: true,
      data: donor,
    });
  } catch (error) {
    next(error);
  }
};

exports.createDonor = async (req, res, next) => {
  try {
    req.body.createdBy = req.user._id;
    const donor = await Donor.create(req.body);

    logger.info(`Donateur créé: ${donor.fullName} par ${req.user.email}`);

    res.status(201).json({
      success: true,
      message: 'Donateur créé avec succès',
      data: donor,
    });
  } catch (error) {
    next(error);
  }
};

exports.updateDonor = async (req, res, next) => {
  try {
    // Ne pas permettre la modification des stats
    delete req.body.totalDonated;
    delete req.body.donationCount;
    delete req.body.lastDonationDate;

    const donor = await Donor.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!donor) {
      return res.status(404).json({
        success: false,
        message: 'Donateur non trouvé',
      });
    }

    logger.info(`Donateur mis à jour: ${donor.fullName} par ${req.user.email}`);

    res.status(200).json({
      success: true,
      message: 'Donateur mis à jour',
      data: donor,
    });
  } catch (error) {
    next(error);
  }
};

exports.deleteDonor = async (req, res, next) => {
  try {
    const donor = await Donor.findById(req.params.id);

    if (!donor) {
      return res.status(404).json({
        success: false,
        message: 'Donateur non trouvé',
      });
    }

    // Vérifier s'il a des donations
    const donationCount = await Donation.countDocuments({ donor: donor._id });
    if (donationCount > 0) {
      return res.status(400).json({
        success: false,
        message: 'Impossible de supprimer un donateur avec des donations enregistrées',
      });
    }

    await donor.deleteOne();

    logger.info(`Donateur supprimé: ${donor.fullName} par ${req.user.email}`);

    res.status(200).json({
      success: true,
      message: 'Donateur supprimé',
    });
  } catch (error) {
    next(error);
  }
};

exports.getDonorDonations = async (req, res, next) => {
  try {
    const { page, limit } = req.query;
    const { skip, itemsPerPage } = getPaginationParams(page, limit);

    const donations = await Donation.find({ donor: req.params.id })
      .sort({ paymentDate: -1 })
      .skip(skip)
      .limit(itemsPerPage)
      .populate('createdBy', 'firstName lastName');

    const total = await Donation.countDocuments({ donor: req.params.id });

    res.status(200).json({
      success: true,
      ...formatPaginatedResponse(donations, page, limit, total),
    });
  } catch (error) {
    next(error);
  }
};

exports.getDonorStats = async (req, res, next) => {
  try {
    const total = await Donor.countDocuments();
    const active = await Donor.countDocuments({ isActive: true });
    const byType = await Donor.aggregate([
      { $group: { _id: '$type', count: { $sum: 1 } } },
    ]);

    const totalDonated = await Donor.aggregate([
      { $group: { _id: null, total: { $sum: '$totalDonated' } } },
    ]);

    res.status(200).json({
      success: true,
      data: {
        total,
        active,
        byType,
        totalDonated: totalDonated[0]?.total || 0,
      },
    });
  } catch (error) {
    next(error);
  }
};
