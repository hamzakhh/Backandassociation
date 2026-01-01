// Statuts des prêts
exports.LOAN_STATUS = {
  ACTIVE: 'active',
  COMPLETED: 'completed',
  OVERDUE: 'overdue',
  CANCELLED: 'cancelled'
};

// Statuts des équipements
exports.EQUIPMENT_STATUS = {
  AVAILABLE: 'available',
  BORROWED: 'borrowed',
  MAINTENANCE: 'maintenance',
  DECOMMISSIONED: 'decommissioned',
  LOST: 'lost'
};

// Conditions des équipements
exports.EQUIPMENT_CONDITION = {
  NEW: 'new',
  EXCELLENT: 'excellent',
  GOOD: 'good',
  FAIR: 'fair',
  POOR: 'poor',
  UNUSABLE: 'unusable'
};

module.exports = {
  // Rôles utilisateurs
  ROLES: {
    ADMIN: 'admin',
    USER: 'user'
  },

  // Ré-export des constantes pour la rétrocompatibilité
  LOAN_STATUS: exports.LOAN_STATUS,
  EQUIPMENT_STATUS: exports.EQUIPMENT_STATUS,
  EQUIPMENT_CONDITION: exports.EQUIPMENT_CONDITION,

  // Statuts des orphelins
  ORPHAN_STATUS: {
    ACTIVE: 'active',
    GRADUATED: 'graduated',
    TRANSFERRED: 'transferred'
  },

  // Types de donateurs
  DONOR_TYPE: {
    INDIVIDUAL: 'individual',
    COMPANY: 'company'
  },

  // Catégories de donations
  DONATION_CATEGORY: {
    EQUIPMENT: 'equipment',
    ORPHANS: 'orphans',
    ZAKAT: 'zakat',
    RAMADAN: 'ramadan',
    GENERAL: 'general'
  },

  // Types de paiement
  PAYMENT_TYPE: {
    CASH: 'cash',
    CHECK: 'check',
    BANK_TRANSFER: 'bank_transfer',
    ONLINE: 'online'
  },

  // Fréquence de don
  DONATION_FREQUENCY: {
    ONE_TIME: 'one-time',
    MONTHLY: 'monthly',
    QUARTERLY: 'quarterly',
    ANNUAL: 'annual'
  },

  // Types de Zakat
  ZAKAT_TYPE: {
    FITR: 'zakat_fitr',
    MAL: 'zakat_mal',
    RAMADAN: 'ramadan_aid'
  },

  // Statuts de distribution Zakat
  ZAKAT_STATUS: {
    PENDING: 'pending',
    DISTRIBUTED: 'distributed',
    CANCELLED: 'cancelled'
  },

  // Pagination
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 10,
  MAX_LIMIT: 100
};
