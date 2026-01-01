const mongoose = require('mongoose');
const { DONOR_TYPE, DONATION_CATEGORY, DONATION_FREQUENCY } = require('../config/constants');

const donorSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: Object.values(DONOR_TYPE),
    default: DONOR_TYPE.INDIVIDUAL,
  },
  
  // Informations personnelles
  firstName: {
    type: String,
    required: function() {
      return this.type === DONOR_TYPE.INDIVIDUAL;
    },
    trim: true,
  },
  lastName: {
    type: String  ,
    required: function() {
      return this.type === DONOR_TYPE.INDIVIDUAL;
    },
    trim: true,
  },
  companyName: {
    type: String,
    required: function() {
      return this.type === DONOR_TYPE.COMPANY;
    },
    trim: true,
  },
  email: {
    type: String,
    trim: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Email invalide'],
  },
  phone: {
    type: String,
    required: [true, 'Le numéro de téléphone est requis'],
    trim: true,
  },
  address: String,
  city: String,
  
  // Préférences de don
  preferredCategory: [{
    type: String,
    enum: Object.values(DONATION_CATEGORY),
  }],
  donationFrequency: {
    type: String,
    enum: Object.values(DONATION_FREQUENCY),
    default: DONATION_FREQUENCY.ONE_TIME,
  },
  
  // Statistiques (calculées automatiquement)
  totalDonated: {
    type: Number,
    default: 0,
    min: 0,
  },
  donationCount: {
    type: Number,
    default: 0,
    min: 0,
  },
  lastDonationDate: Date,
  
  // Projets sponsorisés
  sponsoredOrphans: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Orphan',
  }],
  
  isActive: {
    type: Boolean,
    default: true,
  },
  notes: String,
  
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
}, {
  timestamps: true,
});

// Index pour la recherche
donorSchema.index({ 
  firstName: 'text', 
  lastName: 'text', 
  companyName: 'text',
  phone: 'text',
  email: 'text'
});

// Virtuel pour le nom complet
donorSchema.virtual('fullName').get(function() {
  if (this.type === DONOR_TYPE.COMPANY) {
    return this.companyName;
  }
  return `${this.firstName} ${this.lastName}`;
});

// S'assurer que les virtuels sont inclus dans JSON
donorSchema.set('toJSON', { virtuals: true });
donorSchema.set('toObject', { virtuals: true });

// Méthode pour mettre à jour les statistiques
donorSchema.methods.updateStats = async function() {
  const Donation = mongoose.model('Donation');
  
  const stats = await Donation.aggregate([
    { $match: { donor: this._id } },
    {
      $group: {
        _id: null,
        totalAmount: { $sum: '$amount' },
        count: { $sum: 1 },
        lastDate: { $max: '$paymentDate' },
      },
    },
  ]);
  
  if (stats.length > 0) {
    this.totalDonated = stats[0].totalAmount;
    this.donationCount = stats[0].count;
    this.lastDonationDate = stats[0].lastDate;
  }
  
  await this.save();
};

module.exports = mongoose.model('Donor', donorSchema);
