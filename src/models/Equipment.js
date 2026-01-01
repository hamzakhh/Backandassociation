const mongoose = require('mongoose');
const { EQUIPMENT_STATUS, EQUIPMENT_CONDITION } = require('../config/constants');

const equipmentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Le nom de l\'équipement est requis'],
    trim: true,
  },
  category: {
    type: String,
    required: [true, 'La catégorie est requise'],
    enum: ['Médical', 'Bureautique'],
    trim: true,
  },
  type: {
    type: String,
    required: [true, 'Le type d\'équipement est requis'],
    trim: true,
  },
  serialNumber: {
    type: String,
    required: [true, 'Le numéro de série est requis'],
    unique: true,
    trim: true,
  },
  status: {
    type: String,
    enum: Object.values(EQUIPMENT_STATUS),
    default: EQUIPMENT_STATUS.AVAILABLE,
  },
  condition: {
    type: String,
    enum: Object.values(EQUIPMENT_CONDITION),
    default: EQUIPMENT_CONDITION.GOOD,
  },
  purchaseDate: {
    type: Date,
  },
  purchasePrice: {
    type: Number,
    min: 0,
  },
    entryDate: {
    type: Date,
    default: null
  },
  currentBorrower: {
    name: String,
    phone: String,
    address: String,
    idCard: String,
    lentDate: Date,
  },
  loanHistory: [{
    borrower: {
      name: String,
      phone: String,
      address: String,
      idCard: String,
    },
    lentDate: {
      type: Date,
      required: true,
    },
    returnDate: Date,
    condition: {
      type: String,
      enum: Object.values(EQUIPMENT_CONDITION),
    },
    notes: String,
    lentBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    returnedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  }],
  maintenanceHistory: [{
    date: {
      type: Date,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    cost: {
      type: Number,
      min: 0,
    },
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  }],
  images: [String],
  notes: String,
  assignedUserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
}, {
  timestamps: true,
});

// Index pour la recherche
equipmentSchema.index({ name: 'text', category: 'text', serialNumber: 'text' });

// Méthode pour prêter l'équipement
equipmentSchema.methods.lend = function(borrowerInfo, userId) {
  this.status = EQUIPMENT_STATUS.LENT;
  this.currentBorrower = {
    ...borrowerInfo,
    lentDate: new Date(),
  };
  
  this.loanHistory.push({
    borrower: borrowerInfo,
    lentDate: new Date(),
    condition: this.condition,
    lentBy: userId,
  });
};

// Méthode pour retourner l'équipement
equipmentSchema.methods.return = function(condition, notes, userId) {
  this.status = EQUIPMENT_STATUS.AVAILABLE;
  this.condition = condition;
  
  const lastLoan = this.loanHistory[this.loanHistory.length - 1];
  if (lastLoan) {
    lastLoan.returnDate = new Date();
    lastLoan.condition = condition;
    lastLoan.notes = notes;
    lastLoan.returnedBy = userId;
  }
  
  this.currentBorrower = undefined;
};

module.exports = mongoose.model('Equipment', equipmentSchema);
