const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-v2');

const volunteerSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: [true, 'Le prénom est requis'],
    trim: true
  },
  lastName: {
    type: String,
    required: [true, 'Le nom est requis'],
    trim: true
  },
  age: {
    type: Number,
    required: [true, "L'âge est requis"],
    min: [16, "L'âge minimum est de 16 ans"],
    max: [100, "L'âge maximum est de 100 ans"]
  },
  gender: {
    type: String,
    enum: ['Masculin', 'Féminin', 'Autre'],
    required: [true, 'Le genre est requis']
  },
  phone: {
    type: String,
    required: [true, 'Le numéro de téléphone est requis'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'L\'email est requis'],
    trim: true,
    lowercase: true,
    match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Veuillez entrer un email valide']
  },
  address: {
    type: String,
    trim: true
  },
  skills: [{
    type: String,
    trim: true
  }],
  availability: {
    type: String,
    trim: true
  },
  joinDate: {
    type: Date,
    default: Date.now
  },
  photo: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    enum: ['Actif', 'Inactif', 'En attente'],
    default: 'Actif'
  },
  notes: {
    type: String,
    trim: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Index pour la recherche
volunteerSchema.index({ firstName: 'text', lastName: 'text', email: 'text' });

// Ajout du plugin de pagination
volunteerSchema.plugin(mongoosePaginate);

const Volunteer = mongoose.model('Volunteer', volunteerSchema);

module.exports = Volunteer;
