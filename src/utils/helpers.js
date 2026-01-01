/**
 * Fonction pour générer un numéro de reçu unique
 */
const generateReceiptNumber = () => {
  const prefix = 'RCP';
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${prefix}-${timestamp}-${random}`;
};

/**
 * Fonction pour calculer l'âge à partir de la date de naissance
 */
const calculateAge = (dateOfBirth) => {
  const today = new Date();
  const birthDate = new Date(dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  
  return age;
};

/**
 * Formater un montant en devise
 */
const formatCurrency = (amount, currency = 'DZD') => {
  return new Intl.NumberFormat('fr-DZ', {
    style: 'currency',
    currency: currency,
  }).format(amount);
};

/**
 * Pagination helper
 */
const getPaginationParams = (page, limit) => {
  const currentPage = parseInt(page) || 1;
  const itemsPerPage = parseInt(limit) || 10;
  const skip = (currentPage - 1) * itemsPerPage;
  
  return { currentPage, itemsPerPage, skip };
};

/**
 * Formater une réponse paginée
 */
const formatPaginatedResponse = (data, page, limit, total) => {
  const { currentPage, itemsPerPage } = getPaginationParams(page, limit);
  
  return {
    data,
    pagination: {
      currentPage,
      itemsPerPage,
      totalItems: total,
      totalPages: Math.ceil(total / itemsPerPage),
      hasNextPage: currentPage * itemsPerPage < total,
      hasPrevPage: currentPage > 1,
    },
  };
};

/**
 * Sanitize user input
 */
const sanitizeInput = (input) => {
  if (typeof input === 'string') {
    return input.trim();
  }
  return input;
};

/**
 * Vérifier si une date est valide
 */
const isValidDate = (date) => {
  return date instanceof Date && !isNaN(date);
};

/**
 * Générer un code de référence unique
 */
const generateReferenceCode = (prefix = 'REF') => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `${prefix}-${year}${month}-${random}`;
};

/**
 * Calculer les statistiques d'une liste de valeurs numériques
 */
const calculateStats = (values) => {
  if (!values || values.length === 0) {
    return { total: 0, average: 0, min: 0, max: 0, count: 0 };
  }
  
  const total = values.reduce((sum, val) => sum + val, 0);
  const average = total / values.length;
  const min = Math.min(...values);
  const max = Math.max(...values);
  
  return {
    total,
    average: Math.round(average * 100) / 100,
    min,
    max,
    count: values.length,
  };
};

module.exports = {
  generateReceiptNumber,
  calculateAge,
  formatCurrency,
  getPaginationParams,
  formatPaginatedResponse,
  sanitizeInput,
  isValidDate,
  generateReferenceCode,
  calculateStats,
};
