const mongoose = require('mongoose');
const { ZAKAT_TYPE, ZAKAT_STATUS } = require('../config/constants');

const zakatSchema = new mongoose.Schema({
  year: {
    type: Number,
    required: [true, 'L\'année est requise'],
  },
  type: {
    type: String,
    enum: Object.values(ZAKAT_TYPE),
    required: [true, 'Le type est requis'],
  },
  
  // Bénéficiaire
  beneficiary: {
    name: {
      type: String,
      required: [true, 'Le nom du bénéficiaire est requis'],
    },
    phone: String,
    address: String,
    familySize: {
      type: Number,
      min: 1,
    },
    idCard: String,
  },
  
  // Montant ou contenu
  amount: {
    type: Number,
    min: 0,
  },
  items: [{
    name: {
      type: String,
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 0,
    },
    unit: String,
  }],
  
  distributionDate: {
    type: Date,
    required: [true, 'La date de distribution est requise'],
  },
  location: String,
  
  // Source
  donor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Donor',
  },
  
  status: {
    type: String,
    enum: Object.values(ZAKAT_STATUS),
    default: ZAKAT_STATUS.PENDING,
  },
  distributedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  notes: String,
  
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
}, {
  timestamps: true,
});

// Index pour les rapports
zakatSchema.index({ year: 1, type: 1 });
zakatSchema.index({ distributionDate: -1 });
zakatSchema.index({ status: 1 });

// Validation: soit amount, soit items doit être fourni
zakatSchema.pre('validate', function(next) {
  if (!this.amount && (!this.items || this.items.length === 0)) {
    next(new Error('Le montant ou les articles sont requis'));
  }
  next();
});

module.exports = mongoose.model('Zakat', zakatSchema);
