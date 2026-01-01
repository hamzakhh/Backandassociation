const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

// Fonction pour créer un middleware de téléchargement personnalisé
const createUploader = (folder, prefix = 'file') => {
  // Créer le dossier d'uploads s'il n'existe pas
  const uploadDir = path.join(__dirname, `../uploads/${folder}`);
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  // Configuration du stockage
  const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
      const uniqueSuffix = Date.now() + '-' + uuidv4();
      const ext = path.extname(file.originalname).toLowerCase();
      cb(null, `${prefix}-${uniqueSuffix}${ext}`);
    }
  });

  // Filtre pour n'accepter que les images
  const fileFilter = (req, file, cb) => {
    const filetypes = /jpeg|jpg|png|gif/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Seules les images (JPEG, JPG, PNG, GIF) sont autorisées'));
    }
  };

  // Configuration de multer
  return multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
    fileFilter: fileFilter
  });
};

// Export des uploaders pour différents types de fichiers
module.exports = {
  uploadOrphanPhoto: createUploader('orphans', 'orphan'),
  uploadVolunteerPhoto: createUploader('volunteers', 'volunteer'),
  uploadPatientPhotos: createUploader('patients', 'patient')
};
