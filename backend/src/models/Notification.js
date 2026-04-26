const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Notification = sequelize.define('Notification', {
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
  title: {
    type: DataTypes.STRING(200),
    allowNull: false
  },
  message: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  type: {
    type: DataTypes.ENUM(
      'payment_success', 'payment_failed', 'withdrawal_request', 'withdrawal_approved',
      'withdrawal_rejected', 'tournament_joined', 'tournament_started', 'tournament_ended',
      'tournament_won', 'vip_expiring', 'vip_expired', 'vip_renewed', 'referral_bonus',
      'achievement_earned', 'system_announcement', 'maintenance_mode', 'security_alert'
    ),
    allowNull: false
  },
  priority: {
    type: DataTypes.ENUM('low', 'medium', 'high', 'urgent'),
    defaultValue: 'medium'
  },
  isRead: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    field: 'is_read'
  },
  readAt: {
    type: DataTypes.DATE,
    field: 'read_at'
  },
  isArchived: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    field: 'is_archived'
  },
  archivedAt: {
    type: DataTypes.DATE,
    field: 'archived_at'
  },
  actionUrl: {
    type: DataTypes.STRING(255),
    field: 'action_url'
  },
  actionText: {
    type: DataTypes.STRING(50),
    field: 'action_text'
  },
  metadata: {
    type: DataTypes.JSON,
    field: 'metadata'
  },
  expiresAt: {
    type: DataTypes.DATE,
    field: 'expires_at'
  },
  sentAt: {
    type: DataTypes.DATE,
    field: 'sent_at'
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
  tableName: 'notifications',
  timestamps: true,
  indexes: [
    {
      fields: ['userId', 'isRead', 'createdAt']
    },
    {
      fields: ['userId', 'type', 'createdAt']
    },
    {
      fields: ['userId', 'priority', 'createdAt']
    },
    {
      fields: ['expiresAt']
    },
    {
      fields: ['isArchived', 'createdAt']
    ]
  ]
});

// Instance methods
Notification.prototype.markAsRead = function() {
  this.isRead = true;
  this.readAt = new Date();
};

Notification.prototype.archive = function() {
  this.isArchived = true;
  this.archivedAt = new Date();
};

// Associations will be defined in index.js
Notification.associate = function(models) {
  // Belongs to User
  Notification.belongsTo(models.User, {
    foreignKey: 'userId',
    as: 'user'
  });
};

module.exports = Notification;
