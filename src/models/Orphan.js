const mongoose = require('mongoose');
const { ORPHAN_STATUS } = require('../config/constants');

const orphanSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: [true, 'Le prénom est requis'],
    trim: true,
  },
  lastName: {
    type: String,
    required: [true, 'Le nom est requis'],
    trim: true,
  },
  dateOfBirth: {
    type: Date,
    required: [true, 'La date de naissance est requise'],
  },
  gender: {
    type: String,
    enum: ['male', 'female'],
    required: [true, 'Le genre est requis'],
  },
  photo: String,
  
  // Informations familiales
  guardian: {
    name: {
      type: String,
      required: [true, 'Le nom du tuteur est requis'],
    },
    relationship: String,
    phone: {
      type: String,
      required: [true, 'Le téléphone du tuteur est requis'],
    },
    address: String,
  },
  
  // Informations scolaires
  education: {
    schoolName: String,
    grade: String,
    academicYear: String,
    performance: String,
    notes: String,
  },
  
  // Informations santé
  health: {
    bloodType: String,
    allergies: [String],
    chronicDiseases: [String],
    vaccinations: [{
      name: String,
      date: Date,
    }],
    lastCheckup: Date,
    notes: String,
  },
  
  // Parrainage
  sponsorship: {
    isSponsored: {
      type: Boolean,
      default: false,
    },
    sponsor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Donor',
    },
    monthlyAmount: {
      type: Number,
      min: 0,
    },
    startDate: Date,
    endDate: Date,
  },
  
  status: {
    type: String,
    enum: Object.values(ORPHAN_STATUS),
    default: ORPHAN_STATUS.ACTIVE,
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
orphanSchema.index({ firstName: 'text', lastName: 'text' });

// Virtuel pour l'âge
orphanSchema.virtual('age').get(function() {
  if (!this.dateOfBirth) return null;
  
  const today = new Date();
  const birthDate = new Date(this.dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  
  return age;
});

// Virtuel pour le nom complet
orphanSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

// S'assurer que les virtuels sont inclus dans JSON
orphanSchema.set('toJSON', { virtuals: true });
orphanSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Orphan', orphanSchema);
