const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Role = sequelize.define('Role', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true,
    validate: {
      len: [2, 50]
    }
  },
  description: {
    type: DataTypes.TEXT,
    field: 'description'
  },
  level: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: 1,
      max: 100
    }
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    field: 'is_active'
  },
  isSystemRole: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    field: 'is_system_role'
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
  tableName: 'roles',
  timestamps: true,
  indexes: [
    {
      unique: true,
      fields: ['name']
    },
    {
      fields: ['level', 'isActive']
    }
  ]
});

// Define role hierarchy (higher number = higher authority)
Role.ROLE_LEVELS = {
  OWNER: 1000,
  CO_OWNER: 900,
  FAM_MANAGER: 800,
  HEAD_PAYMENT_MANAGER: 700,
  SENIOR_PAYMENT_MANAGER: 600,
  PAYMENT_MANAGER: 500,
  HEAD_TOURNAMENT_MANAGER: 400,
  SENIOR_TOURNAMENT_MANAGER: 300,
  TOURNAMENT_MANAGER: 200,
  HEAD_TECHNICAL_MANAGER: 150,
  TECHNICAL_MANAGER: 100,
  HEAD_VIP_MANAGER: 90,
  VIP_MANAGER: 80,
  HEAD_ADMIN: 70,
  SENIOR_ADMIN: 60,
  ADMIN: 50,
  MODERATOR: 40,
  TEAM_SYSTEM_MANAGER: 30,
  ACHIEVEMENT_MANAGER: 20,
  COMMUNITY_MANAGER: 10,
  VIP_USER: 5,
  VIP_PLUS: 4,
  VIP_ELITE: 3,
  REGULAR_USER: 1
};

// Associations will be defined in index.js
Role.associate = function(models) {
  // Role has many users through UserRole
  Role.belongsToMany(models.User, { 
    through: models.UserRole,
    foreignKey: 'roleId',
    otherKey: 'userId'
  });
  
  // Role has many permissions through RolePermission
  Role.belongsToMany(models.Permission, {
    through: models.RolePermission,
    foreignKey: 'roleId',
    otherKey: 'permissionId'
  });
};

module.exports = Role;
