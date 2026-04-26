const { DataTypes } = require('sequelize');
const bcrypt = require('bcryptjs');
const { sequelize } = require('../config/database');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  username: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true,
    validate: {
      len: [3, 50]
    }
  },
  email: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true
    }
  },
  passwordHash: {
    type: DataTypes.STRING(255),
    allowNull: false,
    field: 'password_hash'
  },
  firstName: {
    type: DataTypes.STRING(50),
    field: 'first_name'
  },
  lastName: {
    type: DataTypes.STRING(50),
    field: 'last_name'
  },
  phoneNumber: {
    type: DataTypes.STRING(20),
    field: 'phone_number'
  },
  dateOfBirth: {
    type: DataTypes.DATEONLY,
    field: 'date_of_birth'
  },
  walletBalance: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0.00,
    field: 'wallet_balance'
  },
  lockedBalance: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0.00,
    field: 'locked_balance'
  },
  isEmailVerified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    field: 'is_email_verified'
  },
  isPhoneVerified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    field: 'is_phone_verified'
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    field: 'is_active'
  },
  isBanned: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    field: 'is_banned'
  },
  banReason: {
    type: DataTypes.TEXT,
    field: 'ban_reason'
  },
  bannedUntil: {
    type: DataTypes.DATE,
    field: 'banned_until'
  },
  lastLoginAt: {
    type: DataTypes.DATE,
    field: 'last_login_at'
  },
  failedLoginAttempts: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    field: 'failed_login_attempts'
  },
  lockUntil: {
    type: DataTypes.DATE,
    field: 'lock_until'
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
  tableName: 'users',
  timestamps: true,
  indexes: [
    {
      unique: true,
      fields: ['email']
    },
    {
      unique: true,
      fields: ['username']
    },
    {
      fields: ['isActive', 'isBanned']
    }
  ]
});

// Instance methods
User.prototype.validPassword = function(password) {
  return bcrypt.compareSync(password, this.passwordHash);
};

User.prototype.hashPassword = function(password) {
  return bcrypt.hashSync(password, bcrypt.genSaltSync(12));
};

// Hooks
User.addHook('beforeCreate', async (user) => {
  if (user.passwordHash) {
    user.passwordHash = user.hashPassword(user.passwordHash);
  }
});

User.addHook('beforeUpdate', async (user) => {
  if (user.changed('passwordHash')) {
    user.passwordHash = user.hashPassword(user.passwordHash);
  }
});

// Associations will be defined in index.js
User.associate = function(models) {
  // User has many roles through UserRole
  User.belongsToMany(models.Role, { 
    through: models.UserRole,
    foreignKey: 'userId',
    otherKey: 'roleId'
  });
  
  // User has many wallet transactions
  User.hasMany(models.WalletTransaction, {
    foreignKey: 'userId',
    as: 'transactions'
  });
  
  // User has many payments
  User.hasMany(models.Payment, {
    foreignKey: 'userId',
    as: 'payments'
  });
  
  // User has many tournament participants
  User.hasMany(models.TournamentParticipant, {
    foreignKey: 'userId',
    as: 'participants'
  });
  
  // User has many chat messages (as sender)
  User.hasMany(models.ChatMessage, {
    foreignKey: 'senderId',
    as: 'sentMessages'
  });
  
  // User has many chat messages (as recipient)
  User.hasMany(models.ChatMessage, {
    foreignKey: 'recipientId',
    as: 'receivedMessages'
  });
  
  // User has many teams (as captain)
  User.hasMany(models.Team, {
    foreignKey: 'captainId',
    as: 'captainedTeams'
  });
  
  // User has many team memberships
  User.hasMany(models.TeamMember, {
    foreignKey: 'userId',
    as: 'teamMemberships'
  });
  
  // User has many VIP subscriptions
  User.hasMany(models.VipSubscription, {
    foreignKey: 'userId',
    as: 'subscriptions'
  });
  
  // User has many notifications
  User.hasMany(models.Notification, {
    foreignKey: 'userId',
    as: 'notifications'
  });
  
  // User has many audit logs
  User.hasMany(models.AuditLog, {
    foreignKey: 'userId',
    as: 'auditLogs'
  });
};

module.exports = User;
