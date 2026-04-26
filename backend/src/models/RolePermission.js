const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const RolePermission = sequelize.define('RolePermission', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
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
  permissionId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'permission_id',
    references: {
      model: 'Permissions',
      key: 'id'
    }
  },
  grantedBy: {
    type: DataTypes.UUID,
    field: 'granted_by',
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  grantedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    field: 'granted_at'
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
  tableName: 'role_permissions',
  timestamps: true,
  indexes: [
    {
      fields: ['roleId', 'permissionId'],
      unique: true
    },
    {
      fields: ['roleId', 'isActive']
    },
    {
      fields: ['permissionId', 'isActive']
    },
    {
      fields: ['grantedBy']
    }
  ]
});

// Prevent duplicate role-permission assignments
RolePermission.addHook('beforeCreate', async (rolePermission) => {
  const existing = await RolePermission.findOne({
    where: {
      roleId: rolePermission.roleId,
      permissionId: rolePermission.permissionId
    }
  });
  
  if (existing) {
    throw new Error('Permission already assigned to this role');
  }
});

// Associations will be defined in index.js
RolePermission.associate = function(models) {
  // Belongs to Role
  RolePermission.belongsTo(models.Role, {
    foreignKey: 'roleId',
    as: 'role'
  });
  
  // Belongs to Permission
  RolePermission.belongsTo(models.Permission, {
    foreignKey: 'permissionId',
    as: 'permission'
  });
  
  // Belongs to User (grantor)
  RolePermission.belongsTo(models.User, {
    foreignKey: 'grantedBy',
    as: 'grantor'
  });
};

module.exports = RolePermission;
