const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const RefreshToken = sequelize.define('RefreshToken', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  token: {
    type: DataTypes.STRING(255),
    allowNull: false,
    unique: true,
    validate: {
      notEmpty: true
    }
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
  expiresAt: {
    type: DataTypes.DATE,
    allowNull: false,
    field: 'expires_at'
  },
  isRevoked: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    field: 'is_revoked'
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
  tableName: 'refresh_tokens',
  timestamps: true,
  indexes: [
    {
      fields: ['token'],
      unique: true
    },
    {
      fields: ['userId', 'isRevoked']
    },
    {
      fields: ['expiresAt']
    }
  ]
});

// Instance methods
RefreshToken.prototype.isExpired = function() {
  return new Date() > this.expiresAt;
};

RefreshToken.prototype.isValid = function() {
  return !this.isExpired() && !this.isRevoked;
};

// Associations will be defined in index.js
RefreshToken.associate = function(models) {
  // Belongs to User
  RefreshToken.belongsTo(models.User, {
    foreignKey: 'userId',
    as: 'user'
  });
};

module.exports = RefreshToken;
