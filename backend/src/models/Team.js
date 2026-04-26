const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Team = sequelize.define('Team', {
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
  captainId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'captain_id',
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  maxMembers: {
    type: DataTypes.INTEGER,
    defaultValue: 4,
    validate: {
      min: 2,
      max: 10
    }
  },
  currentMembers: {
    type: DataTypes.INTEGER,
    defaultValue: 1,
    field: 'current_members'
  },
  status: {
    type: DataTypes.ENUM('active', 'inactive', 'disbanded'),
    defaultValue: 'active'
  },
  teamLogo: {
    type: DataTypes.STRING(255),
    field: 'team_logo'
  },
  teamBanner: {
    type: DataTypes.STRING(255),
    field: 'team_banner'
  },
  createdBy: {
    type: DataTypes.UUID,
    field: 'created_by',
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  updatedBy: {
    type: DataTypes.UUID,
    field: 'updated_by',
    references: {
      model: 'Users',
      key: 'id'
    }
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
  tableName: 'teams',
  timestamps: true,
  indexes: [
    {
      fields: ['captainId']
    },
    {
      fields: ['status']
    },
    {
      fields: ['createdBy']
    ]
  ]
});

// Instance methods
Team.prototype.isFull = function() {
  return this.currentMembers >= this.maxMembers;
};

Team.prototype.canJoin = function() {
  return this.status === 'active' && !this.isFull();
};

// Associations will be defined in index.js
Team.associate = function(models) {
  // Belongs to User (captain)
  Team.belongsTo(models.User, {
    foreignKey: 'captainId',
    as: 'captain'
  });
  
  // Belongs to User (creator)
  Team.belongsTo(models.User, {
    foreignKey: 'createdBy',
    as: 'creator'
  });
  
  // Belongs to User (updater)
  Team.belongsTo(models.User, {
    foreignKey: 'updatedBy',
    as: 'updater'
  });
  
  // Has many team members
  Team.hasMany(models.TeamMember, {
    foreignKey: 'teamId',
    as: 'members'
  });
  
  // Has many tournament participants (through teams)
  Team.hasMany(models.TournamentParticipant, {
    foreignKey: 'teamId',
    as: 'tournamentParticipants'
  });
};

module.exports = Team;
