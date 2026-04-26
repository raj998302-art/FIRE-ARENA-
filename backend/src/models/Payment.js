const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Payment = sequelize.define('Payment', {
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
  razorpayOrderId: {
    type: DataTypes.STRING(100),
    field: 'razorpay_order_id',
    unique: true,
    validate: {
      notEmpty: true
    }
  },
  razorpayPaymentId: {
    type: DataTypes.STRING(100),
    field: 'razorpay_payment_id',
    unique: true,
    allowNull: true
  },
  razorpaySignature: {
    type: DataTypes.STRING(255),
    field: 'razorpay_signature',
    allowNull: true
  },
  amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    validate: {
      min: 1
    }
  },
  currency: {
    type: DataTypes.STRING(3),
    defaultValue: 'INR',
    validate: {
      isIn: [['INR', 'USD']]
    }
  },
  status: {
    type: DataTypes.ENUM('created', 'pending', 'success', 'failed', 'refunded'),
    defaultValue: 'created'
  },
  method: {
    type: DataTypes.STRING(50),
    field: 'method',
    comment: 'Payment method used (card, netbanking, wallet, etc.)'
  },
  email: {
    type: DataTypes.STRING(100),
    field: 'email'
  },
  contact: {
    type: DataTypes.STRING(20),
    field: 'contact'
  },
  description: {
    type: DataTypes.TEXT,
    field: 'description'
  },
  notes: {
    type: DataTypes.JSON,
    field: 'notes'
  },
  refundId: {
    type: DataTypes.STRING(100),
    field: 'refund_id'
  },
  refundAmount: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0.00,
    field: 'refund_amount'
  },
  refundStatus: {
    type: DataTypes.ENUM('pending', 'processed', 'failed'),
    field: 'refund_status'
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
  tableName: 'payments',
  timestamps: true,
  indexes: [
    {
      fields: ['userId', 'status', 'createdAt']
    },
    {
      fields: ['razorpayOrderId']
    },
    {
      fields: ['razorpayPaymentId']
    },
    {
      fields: ['status', 'createdAt']
    }
  ]
});

// Instance methods
Payment.prototype.verifySignature = function(keySecret) {
  const crypto = require('crypto');
  const generated_signature = crypto.createHmac('sha256', keySecret)
    .update(this.razorpayOrderId + '|' + this.razorpayPaymentId)
    .digest('hex');
  
  return generated_signature === this.razorpaySignature;
};

// Associations will be defined in index.js
Payment.associate = function(models) {
  // Belongs to User
  Payment.belongsTo(models.User, {
    foreignKey: 'userId',
    as: 'user'
  });
  
  // Has one VIP subscription (if applicable)
  Payment.hasOne(models.VipSubscription, {
    foreignKey: 'paymentId',
    as: 'vipSubscription'
  });
  
  // Has many wallet transactions
  Payment.hasMany(models.WalletTransaction, {
    foreignKey: 'referenceId',
    constraints: false,
    scope: {
      referenceType: 'payment'
    },
    as: 'walletTransactions'
  });
};

module.exports = Payment;
