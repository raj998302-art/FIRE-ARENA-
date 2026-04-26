const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Permission = sequelize.define('Permission', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true,
    validate: {
      len: [3, 100]
    }
  },
  description: {
    type: DataTypes.TEXT,
    field: 'description'
  },
  resource: {
    type: DataTypes.STRING(50),
    allowNull: false,
    validate: {
      isIn: [['auth', 'users', 'wallet', 'payments', 'tournaments', 'chat', 'admin', 'vip', 'team', 'notifications', 'roles', 'permissions']]
    }
  },
  action: {
    type: DataTypes.STRING(20),
    allowNull: false,
    validate: {
      isIn: [['create', 'read', 'update', 'delete', 'approve', 'reject', 'manage', 'execute']]
    }
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
  tableName: 'permissions',
  timestamps: true,
  indexes: [
    {
      unique: true,
      fields: ['name']
    },
    {
      fields: ['resource', 'action', 'isActive']
    }
  ]
});

// Associations will be defined in index.js
Permission.associate = function(models) {
  // Permission has many roles through RolePermission
  Permission.belongsToMany(models.Role, {
    through: models.RolePermission,
    foreignKey: 'permissionId',
    otherKey: 'roleId'
  });
};

module.exports = Permission;
