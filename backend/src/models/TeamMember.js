const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const TeamMember = sequelize.define('TeamMember', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  teamId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'team_id',
    references: {
      model: 'Teams',
      key: 'id'
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
  role: {
    type: DataTypes.ENUM('captain', 'member', 'co-captain'),
    defaultValue: 'member'
  },
  joinedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    field: 'joined_at'
  },
  leftAt: {
    type: DataTypes.DATE,
    field: 'left_at'
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    field: 'is_active'
  },
  invitedBy: {
    type: DataTypes.UUID,
    field: 'invited_by',
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  invitedAt: {
    type: DataTypes.DATE,
    field: 'invited_at'
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
  tableName: 'team_members',
  timestamps: true,
  indexes: [
    {
      fields: ['teamId', 'userId'],
      unique: true
    },
    {
      fields: ['teamId', 'isActive']
    },
    {
      fields: ['userId', 'isActive']
    },
    {
      fields: ['invitedBy']
    ]
  ]
});

// Prevent duplicate team membership
TeamMember.addHook('beforeCreate', async (member) => {
  const existing = await TeamMember.findOne({
    where: {
      teamId: member.teamId,
      userId: member.userId,
      isActive: true
    }
  });
  
  if (existing) {
    throw new Error('User is already a member of this team');
  }
});

// Associations will be defined in index.js
TeamMember.associate = function(models) {
  // Belongs to Team
  TeamMember.belongsTo(models.Team, {
    foreignKey: 'teamId',
    as: 'team'
  });
  
  // Belongs to User
  TeamMember.belongsTo(models.User, {
    foreignKey: 'userId',
    as: 'user'
  });
  
  // Belongs to User (inviter)
  TeamMember.belongsTo(models.User, {
    foreignKey: 'invitedBy',
    as: 'inviter'
  });
};

module.exports = TeamMember;
