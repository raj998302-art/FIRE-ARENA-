const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const AuditLog = sequelize.define('AuditLog', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  userId: {
    type: DataTypes.UUID,
    field: 'user_id',
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  action: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  entityType: {
    type: DataTypes.STRING(50),
    field: 'entity_type'
  },
  entityId: {
    type: DataTypes.UUID,
    field: 'entity_id'
  },
  changes: {
    type: DataTypes.JSON,
    field: 'changes'
  },
  ipAddress: {
    type: DataTypes.STRING(45),
    field: 'ip_address'
  },
  userAgent: {
    type: DataTypes.TEXT,
    field: 'user_agent'
  },
  sessionId: {
    type: DataTypes.STRING(255),
    field: 'session_id'
  },
  severity: {
    type: DataTypes.ENUM('low', 'medium', 'high', 'critical'),
    defaultValue: 'medium'
  },
  success: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  errorMessage: {
    type: DataTypes.TEXT,
    field: 'error_message'
  },
  createdAt: {
    type: DataTypes.DATE,
    field: 'created_at'
  }
}, {
  tableName: 'audit_logs',
  timestamps: false,
  indexes: [
    {
      fields: ['userId', 'createdAt']
    },
    {
      fields: ['entityType', 'entityId']
    },
    {
      fields: ['action', 'createdAt']
    },
    {
      fields: ['severity', 'createdAt']
    },
    {
      fields: ['ipAddress', 'createdAt']
    ]
  ]
});

// Prevent updates and deletes to maintain audit integrity
AuditLog.addHook('beforeUpdate', () => {
  throw new Error('Audit logs cannot be updated');
});

AuditLog.addHook('beforeDestroy', () => {
  throw new Error('Audit logs cannot be deleted');
});

// Associations will be defined in index.js
AuditLog.associate = function(models) {
  // Belongs to User
  AuditLog.belongsTo(models.User, {
    foreignKey: 'userId',
    as: 'user'
  });
};

module.exports = AuditLog;
