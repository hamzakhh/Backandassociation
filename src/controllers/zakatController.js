const Zakat = require('../models/Zakat');
const { formatPaginatedResponse, getPaginationParams } = require('../utils/helpers');
const logger = require('../utils/logger');

exports.getAllZakat = async (req, res, next) => {
  try {
    const { page, limit, type, year, status } = req.query;
    const { skip, itemsPerPage } = getPaginationParams(page, limit);

    const filter = {};
    if (type) filter.type = type;
    if (year) filter.year = parseInt(year);
    if (status) filter.status = status;

    const zakats = await Zakat.find(filter)
      .sort({ distributionDate: -1 })
      .skip(skip)
      .limit(itemsPerPage)
      .populate('donor', 'firstName lastName companyName')
      .populate('distributedBy', 'firstName lastName')
      .populate('createdBy', 'firstName lastName');

    const total = await Zakat.countDocuments(filter);

    res.status(200).json({
      success: true,
      ...formatPaginatedResponse(zakats, page, limit, total),
    });
  } catch (error) {
    next(error);
  }
};

exports.getZakatById = async (req, res, next) => {
  try {
    const zakat = await Zakat.findById(req.params.id)
      .populate('donor')
      .populate('distributedBy', 'firstName lastName')
      .populate('createdBy', 'firstName lastName');

    if (!zakat) {
      return res.status(404).json({
        success: false,
        message: 'Distribution non trouvée',
      });
    }

    res.status(200).json({
      success: true,
      data: zakat,
    });
  } catch (error) {
    next(error);
  }
};

exports.createZakat = async (req, res, next) => {
  try {
    req.body.createdBy = req.user._id;
    const zakat = await Zakat.create(req.body);

    logger.info(`Zakat créée: ${zakat.type} pour ${zakat.beneficiary.name} par ${req.user.email}`);

    res.status(201).json({
      success: true,
      message: 'Distribution créée avec succès',
      data: zakat,
    });
  } catch (error) {
    next(error);
  }
};

exports.updateZakat = async (req, res, next) => {
  try {
    const zakat = await Zakat.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!zakat) {
      return res.status(404).json({
        success: false,
        message: 'Distribution non trouvée',
      });
    }

    logger.info(`Zakat mise à jour: ${zakat._id} par ${req.user.email}`);

    res.status(200).json({
      success: true,
      message: 'Distribution mise à jour',
      data: zakat,
    });
  } catch (error) {
    next(error);
  }
};

exports.deleteZakat = async (req, res, next) => {
  try {
    const zakat = await Zakat.findByIdAndDelete(req.params.id);

    if (!zakat) {
      return res.status(404).json({
        success: false,
        message: 'Distribution non trouvée',
      });
    }

    logger.info(`Zakat supprimée: ${zakat._id} par ${req.user.email}`);

    res.status(200).json({
      success: true,
      message: 'Distribution supprimée',
    });
  } catch (error) {
    next(error);
  }
};

exports.markAsDistributed = async (req, res, next) => {
  try {
    const zakat = await Zakat.findById(req.params.id);

    if (!zakat) {
      return res.status(404).json({
        success: false,
        message: 'Distribution non trouvée',
      });
    }

    zakat.status = 'distributed';
    zakat.distributedBy = req.user._id;
    await zakat.save();

    logger.info(`Zakat distribuée: ${zakat._id} par ${req.user.email}`);

    res.status(200).json({
      success: true,
      message: 'Distribution marquée comme distribuée',
      data: zakat,
    });
  } catch (error) {
    next(error);
  }
};

exports.getZakatStats = async (req, res, next) => {
  try {
    const { year } = req.query;
    const matchStage = year ? { year: parseInt(year) } : {};

    const byType = await Zakat.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 },
          totalAmount: { $sum: '$amount' },
        },
      },
    ]);

    const byStatus = await Zakat.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
    ]);

    const [totalStats] = await Zakat.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: null,
          totalAmount: { $sum: '$amount' },
          totalDonations: { $sum: 1 }
        }
      }
    ]);

    res.status(200).json({
      success: true,
      data: {
        totalAmount: totalStats?.totalAmount || 0,
        totalDonations: totalStats?.totalDonations || 0,
        totalBeneficiaries: await Zakat.countDocuments(matchStage),
        byType,
        byStatus,
      },
    });
  } catch (error) {
    next(error);
  }
};

exports.getZakatReport = async (req, res, next) => {
  try {
    const { year } = req.query;
    
    if (!year) {
      return res.status(400).json({
        success: false,
        message: 'L\'année est requise',
      });
    }

    const report = await Zakat.aggregate([
      { $match: { year: parseInt(year) } },
      {
        $group: {
          _id: {
            type: '$type',
            month: { $month: '$distributionDate' },
          },
          count: { $sum: 1 },
          totalAmount: { $sum: '$amount' },
          beneficiaries: { $push: '$beneficiary.name' },
        },
      },
      { $sort: { '_id.month': 1 } },
    ]);

    res.status(200).json({
      success: true,
      data: report,
    });
  } catch (error) {
    next(error);
  }
};
