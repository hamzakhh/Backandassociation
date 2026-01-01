const Patient = require('../models/Patient');
const asyncHandler = require('express-async-handler');
const { uploadFile, deleteFile } = require('../utils/fileUpload');
const fs = require('fs');
const path = require('path');

// @desc    Récupérer tous les patients
// @route   GET /api/patients
// @access  Privé
const getPatients = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, search = '', status } = req.query;

  const query = {};

  if (search) {
    query.$text = { $search: search };
  }

  if (status) {
    query.status = status;
  }

  const options = {
    page: parseInt(page),
    limit: parseInt(limit),
    sort: { createdAt: -1 }
  };

  const patients = await Patient.paginate(query, options);

  res.json({
    success: true,
    count: patients.totalDocs,
    data: patients.docs,
    totalPages: patients.totalPages,
    currentPage: patients.page
  });
});

// @desc    Récupérer un patient par ID
// @route   GET /api/patients/:id
// @access  Privé
const getPatientById = asyncHandler(async (req, res) => {
  const patient = await Patient.findById(req.params.id);

  if (!patient) {
    res.status(404);
    throw new Error('Patient non trouvé');
  }

  res.json({
    success: true,
    data: patient
  });
});

// @desc    Créer un patient
// @route   POST /api/patients
// @access  Privé
const createPatient = asyncHandler(async (req, res) => {
  const {
    firstName,
    lastName,
    address,
    phone,
    guardianFirstName,
    guardianLastName,
    patientType,
    specificEquipment,
    entryDate,
    exitDate
  } = req.body;

  const files = req.files ? Object.values(req.files).flat().map(file => file.path.replace(/\\/g, '/')) : [];

  try {
    const patientData = {
      firstName,
      lastName,
      address,
      phone,
      guardianFirstName,
      guardianLastName,
      patientType,
      specificEquipment: patientType === 'spécifique' ? specificEquipment : '',
      ...(entryDate && { entryDate }),
      ...(exitDate && { exitDate }),
      files
    };

    const patient = await Patient.create(patientData);

    res.status(201).json({
      success: true,
      data: patient
    });
  } catch (error) {
    // Cleanup uploaded files in case of error
    for (const file of files) {
      fs.unlink(path.join(__dirname, '../..', file), (err) => {
        if (err) console.error(`Failed to delete uploaded file: ${file}`, err);
      });
    }

    res.status(400).json({ success: false, message: error.message });
  }
});

// @desc    Mettre à jour un patient
// @route   PUT /api/patients/:id
// @access  Privé
const updatePatient = asyncHandler(async (req, res) => {
  const patient = await Patient.findById(req.params.id);

  if (!patient) {
    res.status(404);
    throw new Error('Patient non trouvé');
  }

  const {
    firstName,
    lastName,
    address,
    phone,
    guardianFirstName,
    guardianLastName,
    patientType,
    specificEquipment,
    entryDate,
    exitDate
  } = req.body;

  const newFiles = req.files ? Object.values(req.files).flat().map(file => file.path.replace(/\\/g, '/')) : [];

  patient.firstName = firstName || patient.firstName;
  patient.lastName = lastName || patient.lastName;
  patient.address = address || patient.address;
  patient.phone = phone || patient.phone;
  patient.guardianFirstName = guardianFirstName || patient.guardianFirstName;
  patient.guardianLastName = guardianLastName || patient.guardianLastName;
  patient.patientType = patientType || patient.patientType;
  patient.specificEquipment = patient.patientType === 'spécifique' ? (specificEquipment || patient.specificEquipment) : '';
  patient.entryDate = entryDate || patient.entryDate;
  patient.exitDate = exitDate || patient.exitDate;

  if (newFiles.length > 0) {
    patient.files = patient.files.concat(newFiles);
  }

  const updatedPatient = await patient.save();

  res.json({
    success: true,
    data: updatedPatient
  });
});

// @desc    Supprimer un patient
// @route   DELETE /api/patients/:id
// @access  Privé/Admin
const deletePatient = asyncHandler(async (req, res) => {
  const patient = await Patient.findById(req.params.id);

  if (!patient) {
    res.status(404);
    throw new Error('Patient non trouvé');
  }

  // Delete associated files
  if (patient.files && patient.files.length > 0) {
    for (const file of patient.files) {
      fs.unlink(path.join(__dirname, '../..', file), (err) => {
        if (err) console.error(`Failed to delete file: ${file}`, err);
      });
    }
  }

  await patient.deleteOne();

  res.json({ success: true, data: {} });
});

// @desc    Obtenir les statistiques des patients
// @route   GET /api/patients/stats
// @access  Privé
const getPatientStats = asyncHandler(async (req, res) => {
  const stats = await Patient.aggregate([
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        present: {
          $sum: { $cond: [{ $eq: ['$status', 'present'] }, 1, 0] }
        },
        absent: {
          $sum: { $cond: [{ $eq: ['$status', 'absent'] }, 1, 0] }
        },
        withEquipment: {
          $sum: { $cond: [{ $ne: ['$equipment', null] }, 1, 0] }
        },
        withGuardians: {
          $sum: { $cond: [{ $and: ['$guardianFirstName', '$guardianLastName'] }, 1, 0] }
        },
        whiteNotebooks: {
          $sum: { $cond: [{ $eq: ['$notebookType', 'blanc'] }, 1, 0] }
        },
        yellowNotebooks: {
          $sum: { $cond: [{ $eq: ['$notebookType', 'jaune'] }, 1, 0] }
        }
      }
    }
  ]);

  res.json({
    success: true,
    data: stats[0] || {
      total: 0,
      present: 0,
      absent: 0,
      withEquipment: 0,
      withGuardians: 0,
      whiteNotebooks: 0,
      yellowNotebooks: 0
    }
  });
});

module.exports = {
  getPatients,
  getPatientById,
  createPatient,
  updatePatient,
  deletePatient,
  getPatientStats
};
