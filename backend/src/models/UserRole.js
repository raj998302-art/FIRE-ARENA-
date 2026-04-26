const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const UserRole = sequelize.define('UserRole', {
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
  roleId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'role_id',
    references: {
      model: 'Roles',
      key: 'id'
    }
  },
  assignedBy: {
    type: DataTypes.UUID,
    field: 'assigned_by',
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  assignedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    field: 'assigned_at'
  },
  expiresAt: {
    type: DataTypes.DATE,
    field: 'expires_at'
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    field: 'is_active'
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
  tableName: 'user_roles',
  timestamps: true,
  indexes: [
    {
      fields: ['userId', 'roleId', 'isActive'],
      unique: true
    },
    {
      fields: ['userId', 'isActive']
    },
    {
      fields: ['roleId', 'isActive']
    },
    {
      fields: ['expiresAt']
    ]
  }
});

// Prevent assigning expired roles
UserRole.addHook('beforeCreate', async (userRole) => {
  if (userRole.expiresAt && userRole.expiresAt < new Date()) {
    throw new Error('Cannot assign expired role');
  }
});

// Associations will be defined in index.js
UserRole.associate = function(models) {
  // Belongs to User
  UserRole.belongsTo(models.User, {
    foreignKey: 'userId',
    as: 'user'
  });
  
  // Belongs to Role
  UserRole.belongsTo(models.Role, {
    foreignKey: 'roleId',
    as: 'role'
  });
  
  // Belongs to User (assigner)
  UserRole.belongsTo(models.User, {
    foreignKey: 'assignedBy',
    as: 'assigner'
  });
};

module.exports = UserRole;
