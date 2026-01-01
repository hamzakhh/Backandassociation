const Volunteer = require('../models/Volunteer');
const asyncHandler = require('express-async-handler');
const { uploadFile, deleteFile } = require('../utils/fileUpload');
const fs = require('fs');
const path = require('path');

// @desc    Récupérer tous les bénévoles
// @route   GET /api/volunteers
// @access  Privé
const getVolunteers = asyncHandler(async (req, res) => {
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
  
  const volunteers = await Volunteer.paginate(query, options);
  
  res.json({
    success: true,
    count: volunteers.totalDocs,
    data: volunteers.docs,
    totalPages: volunteers.totalPages,
    currentPage: volunteers.page
  });
});

// @desc    Récupérer un bénévole par ID
// @route   GET /api/volunteers/:id
// @access  Privé
const getVolunteerById = asyncHandler(async (req, res) => {
  const volunteer = await Volunteer.findById(req.params.id);
  
  if (!volunteer) {
    res.status(404);
    throw new Error('Bénévole non trouvé');
  }
  
  res.json({
    success: true,
    data: volunteer
  });
});

// @desc    Créer un bénévole
// @route   POST /api/volunteers
// @access  Privé
const createVolunteer = asyncHandler(async (req, res) => {
  console.log('Requête reçue pour créer un bénévole');
  console.log('Headers:', req.headers);
  console.log('Body:', req.body);
  console.log('Fichiers:', req.files);
  const { 
    firstName, 
    lastName, 
    age, 
    gender, 
    phone, 
    email, 
    address, 
    skills, 
    availability, 
    joinDate, 
    notes 
  } = req.body;
  
  // Vérifier si l'email existe déjà
  const volunteerExists = await Volunteer.findOne({ email });
  
  if (volunteerExists) {
    res.status(400);
    throw new Error('Un bénévole avec cet email existe déjà');
  }
  
  // Gérer le téléchargement de la photo si elle existe
  let photo = '';
  try {
    if (req.file) {
      console.log('Fichier reçu:', req.file);
      photo = req.file.path.replace(/\\/g, '/').replace('uploads/', ''); // Convertir les backslashes en slashes
      console.log('Chemin de la photo:', photo);
    } else {
      console.log('Aucun fichier reçu');
    }

    const volunteerData = {
      firstName,
      lastName,
      age,
      gender,
      phone,
      email,
      address,
      skills: skills ? (Array.isArray(skills) ? skills : skills.split(',').map(skill => skill.trim())) : [],
      availability,
      joinDate: joinDate || Date.now(),
      notes
    };

    // Ajouter la photo uniquement si elle existe
    if (photo) {
      volunteerData.photo = photo;
    }

    console.log('Données du bénévole à créer:', volunteerData);
    const volunteer = await Volunteer.create(volunteerData);
    console.log('Bénévole créé avec succès:', volunteer);
    
    res.status(201).json({
      success: true,
      data: volunteer
    });
  } catch (error) {
    console.error('Erreur lors de la création du bénévole:', error);
    // Supprimer le fichier téléchargé en cas d'erreur
    if (photo && fs.existsSync(path.join(__dirname, '../uploads', photo))) {
      fs.unlinkSync(path.join(__dirname, '../uploads', photo));
    }
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la création du bénévole',
      error: error.message
    });
  }
});

// @desc    Mettre à jour un bénévole
// @route   PUT /api/volunteers/:id
// @access  Privé
const updateVolunteer = asyncHandler(async (req, res) => {
  const volunteer = await Volunteer.findById(req.params.id);
  
  if (!volunteer) {
    res.status(404);
    throw new Error('Bénévole non trouvé');
  }
  
  // Vérifier si l'email est déjà utilisé par un autre bénévole
  if (req.body.email && req.body.email !== volunteer.email) {
    const emailExists = await Volunteer.findOne({ email: req.body.email });
    
    if (emailExists) {
      res.status(400);
      throw new Error('Cet email est déjà utilisé par un autre bénévole');
    }
  }
  
  // Gérer le téléchargement de la nouvelle photo si elle existe
  if (req.files && req.files.photo) {
    // Supprimer l'ancienne photo si elle existe
    if (volunteer.photo) {
      await deleteFile(volunteer.photo);
    }
    
    // Télécharger la nouvelle photo
    req.body.photo = await uploadFile(req.files.photo, 'volunteers');
  }
  
  // Convertir la chaîne de compétences en tableau si nécessaire
  if (req.body.skills && typeof req.body.skills === 'string') {
    req.body.skills = req.body.skills.split(',').map(skill => skill.trim());
  }
  
  const updatedVolunteer = await Volunteer.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true, runValidators: true }
  );
  
  res.json({
    success: true,
    data: updatedVolunteer
  });
});

// @desc    Supprimer un bénévole
// @route   DELETE /api/volunteers/:id
// @access  Privé/Admin
const deleteVolunteer = asyncHandler(async (req, res) => {
  const volunteer = await Volunteer.findById(req.params.id);
  
  if (!volunteer) {
    res.status(404);
    throw new Error('Bénévole non trouvé');
  }
  
  try {
    // Supprimer la photo si elle existe
    if (volunteer.photo) {
      await deleteFile(volunteer.photo);
    }
    
    // Utiliser deleteOne() au lieu de remove()
    await Volunteer.deleteOne({ _id: volunteer._id });
    
    res.json({
      success: true,
      data: {}
    });
  } catch (error) {
    console.error('Erreur lors de la suppression du bénévole:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la suppression du bénévole',
      details: error.message
    });
  }
});

// @desc    Obtenir les statistiques des bénévoles
// @route   GET /api/volunteers/stats
// @access  Privé
const getVolunteerStats = asyncHandler(async (req, res) => {
  const stats = await Volunteer.aggregate([
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        active: {
          $sum: { $cond: [{ $eq: ['$status', 'Actif'] }, 1, 0] }
        },
        inactive: {
          $sum: { $cond: [{ $eq: ['$status', 'Inactif'] }, 1, 0] }
        },
        pending: {
          $sum: { $cond: [{ $eq: ['$status', 'En attente'] }, 1, 0] }
        },
        youngVolunteers: {
          $sum: { $cond: [{ $lte: ['$age', 25] }, 1, 0] }
        },
        newThisMonth: {
          $sum: {
            $cond: [
              { $eq: [{ $month: '$createdAt' }, new Date().getMonth() + 1] },
              1,
              0
            ]
          }
        }
      }
    }
  ]);
  
  res.json({
    success: true,
    data: stats[0] || {
      total: 0,
      active: 0,
      inactive: 0,
      pending: 0,
      youngVolunteers: 0,
      newThisMonth: 0
    }
  });
});

module.exports = {
  getVolunteers,
  getVolunteerById,
  createVolunteer,
  updateVolunteer,
  deleteVolunteer,
  getVolunteerStats
};
