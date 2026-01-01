const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-v2');
const { LOAN_STATUS } = require('../config/constants');

const loanSchema = new mongoose.Schema({
  equipment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Equipment',
    required: [true, 'L\'équipement est requis'],
    index: true
  },
  patient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient',
    required: [true, 'Le patient est requis'],
    index: true
  },
  startDate: {
    type: Date,
    default: Date.now,
    required: true
  },
  expectedReturnDate: {
    type: Date,
    required: [true, 'La date de retour prévue est requise']
  },
  actualReturnDate: Date,
  status: {
    type: String,
    enum: Object.values(LOAN_STATUS),
    default: LOAN_STATUS.ACTIVE,
    required: true
  },
  cancellationReason: {
    type: String,
    default: ''
  },
  cancelledAt: {
    type: Date
  },
  cancelledBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  conditionBefore: {
    type: String,
    required: [true, 'L\'état initial de l\'équipement est requis']
  },
  conditionAfter: String,
  notes: String,
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  closedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  lastUpdatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Index pour les requêtes fréquentes
loanSchema.index({ status: 1, expectedReturnDate: 1 });
loanSchema.index({ patient: 1, status: 1 });
loanSchema.index({ equipment: 1, status: 1 });

// Méthode pour marquer un prêt comme retourné
loanSchema.methods.markAsReturned = async function(conditionAfter, notes, userId) {
  this.status = LOAN_STATUS.COMPLETED;
  this.actualReturnDate = new Date();
  this.conditionAfter = conditionAfter;
  this.notes = notes;
  this.closedBy = userId;
  this.lastUpdatedBy = userId;
  
  // Save the loan first to ensure we have the latest data
  await this.save();
  
  const Equipment = mongoose.model('Equipment');
  const Patient = mongoose.model('Patient');
  
  try {
    // 1. First find the equipment
    const equipment = await Equipment.findById(this.equipment);
    if (!equipment) {
      throw new Error('Equipment not found');
    }

    // 2. Find the loan in history
    const loanHistoryIndex = equipment.loanHistory.findIndex(
      entry => entry.loanId && entry.loanId.toString() === this._id.toString()
    );

    // 3. Prepare the update object
    const update = {
      $set: {
        status: 'available',
        currentBorrower: null,
        condition: conditionAfter,
        updatedAt: new Date()
      }
    };

    // 4. If loan is in history, update it, otherwise add a new entry
    if (loanHistoryIndex >= 0) {
      // Update existing history entry
      update.$set[`loanHistory.${loanHistoryIndex}.returnedDate`] = this.actualReturnDate;
      update.$set[`loanHistory.${loanHistoryIndex}.condition`] = conditionAfter;
      update.$set[`loanHistory.${loanHistoryIndex}.notes`] = notes;
      update.$set[`loanHistory.${loanHistoryIndex}.returnedBy`] = userId;
    } else {
      // Add new history entry
      const loan = await this.constructor.findById(this._id)
        .populate('patient', 'firstName lastName phone address')
        .populate('createdBy', 'name');

      const newHistoryEntry = {
        loanId: this._id,
        borrower: {
          name: loan.patient ? `${loan.patient.firstName} ${loan.patient.lastName}` : 'Inconnu',
          phone: loan.patient?.phone || '',
          address: loan.patient?.address || '',
          idCard: ''
        },
        lentDate: this.startDate,
        returnedDate: this.actualReturnDate,
        condition: conditionAfter,
        notes: notes,
        lentBy: this.createdBy,
        returnedBy: userId
      };

      update.$push = { loanHistory: newHistoryEntry };
    }

    // 5. Apply all updates
    await Equipment.findByIdAndUpdate(this.equipment, update);

    // 6. Update the patient's borrowed equipment
    await Patient.findByIdAndUpdate(
      this.patient,
      {
        $pull: { borrowedEquipment: this.equipment },
        $inc: { activeLoans: -1 }
      }
    );

  } catch (error) {
    console.error('Error in markAsReturned:', error);
    throw error;
  }
};

// Add pagination plugin to the schema
loanSchema.plugin(mongoosePaginate);

const Loan = mongoose.model('Loan', loanSchema);
module.exports = Loan;
