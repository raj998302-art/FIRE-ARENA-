const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const WalletTransaction = sequelize.define('WalletTransaction', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'user_id',
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    validate: {
      min: 0.01
    }
  },
  type: {
    type: DataTypes.ENUM('credit', 'debit'),
    allowNull: false
  },
  category: {
    type: DataTypes.ENUM(
      'deposit', 'withdrawal', 'tournament_entry', 'tournament_prize',
      'referral_bonus', 'vip_subscription', 'vip_renewal', 'bonus', 'adjustment', 'refund'
    ),
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    field: 'description'
  },
  referenceId: {
    type: DataTypes.STRING(100),
    field: 'reference_id',
    comment: 'Reference to payment ID, tournament ID, etc.'
  },
  referenceType: {
    type: DataTypes.STRING(50),
    field: 'reference_type',
    comment: 'Type of reference (payment, tournament, etc.)'
  },
  balanceBefore: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    field: 'balance_before'
  },
  balanceAfter: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    field: 'balance_after'
  },
  isLocked: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    field: 'is_locked',
    comment: 'Indicates if transaction affects locked balance'
  },
  status: {
    type: DataTypes.ENUM('pending', 'completed', 'failed', 'reversed'),
    defaultValue: 'completed'
  },
  processedBy: {
    type: DataTypes.UUID,
    field: 'processed_by',
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  processedAt: {
    type: DataTypes.DATE,
    field: 'processed_at'
  },
  createdAt: {
    type: DataTypes.DATE,
    field: 'created_at'
  },
  updatedAt: {
    type: DataTypes.DATE,
    field: 'updated_at'
  }
}, {
  tableName: 'wallet_transactions',
  timestamps: true,
  indexes: [
    {
      fields: ['userId', 'createdAt']
    },
    {
      fields: ['userId', 'status', 'createdAt']
    },
    {
      fields: ['referenceId', 'referenceType']
    },
    {
      fields: ['processedBy', 'processedAt']
    },
    {
      fields: ['category', 'createdAt']
    ]
  ]
});

// Associations will be defined in index.js
WalletTransaction.associate = function(models) {
  // Belongs to User
  WalletTransaction.belongsTo(models.User, {
    foreignKey: 'userId',
    as: 'user'
  });
  
  // Belongs to User (processor)
  WalletTransaction.belongsTo(models.User, {
    foreignKey: 'processedBy',
    as: 'processor'
  });
};

module.exports = WalletTransaction;
