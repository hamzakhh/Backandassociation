const mongoose = require('mongoose');
const { DONATION_CATEGORY, PAYMENT_TYPE } = require('../config/constants');

const donationSchema = new mongoose.Schema({
  donor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Donor',
    required: [true, 'Le donateur est requis'],
  },
  amount: {
    type: Number,
    required: [true, 'Le montant est requis'],
    min: [0, 'Le montant doit être positif'],
  },
  currency: {
    type: String,
    default: 'DZD',
  },
  type: {
    type: String,
    enum: Object.values(PAYMENT_TYPE),
    default: PAYMENT_TYPE.CASH,
  },
  category: {
    type: String,
    enum: Object.values(DONATION_CATEGORY),
    required: [true, 'La catégorie est requise'],
  },
  
  // Détails du paiement
  paymentReference: String,
  paymentDate: {
    type: Date,
    required: [true, 'La date de paiement est requise'],
    default: Date.now,
  },
  receiptNumber: {
    type: String,
    unique: true,
  },
  
  // Attribution
  designatedFor: {
    type: {
      type: String,
      enum: ['orphan', 'equipment', 'project', 'zakat'],
    },
    reference: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: 'designatedFor.type',
    },
  },
  
  project: String,
  notes: String,
  isRecurring: {
    type: Boolean,
    default: false,
  },
  
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
}, {
  timestamps: true,
});

// Index pour la recherche et les rapports
donationSchema.index({ donor: 1, paymentDate: -1 });
donationSchema.index({ category: 1, paymentDate: -1 });
// receiptNumber index is already created by unique: true

// Hook post-save pour mettre à jour les stats du donateur
donationSchema.post('save', async function() {
  const Donor = mongoose.model('Donor');
  const donor = await Donor.findById(this.donor);
  if (donor) {
    await donor.updateStats();
  }
});

// Hook post-delete pour mettre à jour les stats du donateur
donationSchema.post('findOneAndDelete', async function(doc) {
  if (doc) {
    const Donor = mongoose.model('Donor');
    const donor = await Donor.findById(doc.donor);
    if (donor) {
      await donor.updateStats();
    }
  }
});

module.exports = mongoose.model('Donation', donationSchema);
