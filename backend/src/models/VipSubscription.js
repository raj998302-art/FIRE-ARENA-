const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const VipSubscription = sequelize.define('VipSubscription', {
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
  plan: {
    type: DataTypes.ENUM('weekly', 'monthly'),
    allowNull: false
  },
  amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    validate: {
      min: 1
    }
  },
  startDate: {
    type: DataTypes.DATE,
    allowNull: false,
    field: 'start_date',
    defaultValue: DataTypes.NOW
  },
  endDate: {
    type: DataTypes.DATE,
    allowNull: false,
    field: 'end_date'
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    field: 'is_active'
  },
  autoRenew: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    field: 'auto_renew'
  },
  paymentId: {
    type: DataTypes.UUID,
    field: 'payment_id',
    references: {
      model: 'Payments',
      key: 'id'
    }
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
  tableName: 'vip_subscriptions',
  timestamps: true,
  indexes: [
    {
      fields: ['userId', 'isActive']
    },
    {
      fields: ['userId', 'endDate']
    },
    {
      fields: ['endDate', 'isActive']
    },
    {
      fields: ['paymentId']
    ]
  ]
});

// Instance methods
VipSubscription.prototype.isExpired = function() {
  return new Date() > this.endDate;
};

VipSubscription.prototype.daysRemaining = function() {
  const diffTime = this.endDate - new Date();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

// Associations will be defined in index.js
VipSubscription.associate = function(models) {
  // Belongs to User
  VipSubscription.belongsTo(models.User, {
    foreignKey: 'userId',
    as: 'user'
  });
  
  // Belongs to Payment
  VipSubscription.belongsTo(models.Payment, {
    foreignKey: 'paymentId',
    as: 'payment'
  });
};

module.exports = VipSubscription;
