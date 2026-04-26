const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const TournamentParticipant = sequelize.define('TournamentParticipant', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  tournamentId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'tournament_id',
    references: {
      model: 'Tournaments',
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
  teamId: {
    type: DataTypes.UUID,
    field: 'team_id',
    references: {
      model: 'Teams',
      key: 'id'
    }
  },
  position: {
    type: DataTypes.INTEGER,
    field: 'position',
    comment: 'Final position in tournament (1st, 2nd, 3rd, etc.)'
  },
  prizeAmount: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0.00,
    field: 'prize_amount'
  },
  isCheckedIn: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    field: 'is_checked_in'
  },
  checkedInAt: {
    type: DataTypes.DATE,
    field: 'checked_in_at'
  },
  isReady: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    field: 'is_ready'
  },
  readyAt: {
    type: DataTypes.DATE,
    field: 'ready_at'
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
  isBot: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    field: 'is_bot'
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
  tableName: 'tournament_participants',
  timestamps: true,
  indexes: [
    {
      fields: ['tournamentId', 'userId'],
      unique: true
    },
    {
      fields: ['tournamentId', 'teamId']
    },
    {
      fields: ['userId', 'joinedAt']
    },
    {
      fields: ['position', 'prizeAmount']
    },
    {
      fields: ['isCheckedIn', 'isReady']
    ]
  ]
});

// Prevent duplicate entries for same user in same tournament
TournamentParticipant.addHook('beforeCreate', async (participant) => {
  const existing = await TournamentParticipant.findOne({
    where: {
      tournamentId: participant.tournamentId,
      userId: participant.userId
    }
  });
  
  if (existing) {
    throw new Error('User already participating in this tournament');
  }
});

// Associations will be defined in index.js
TournamentParticipant.associate = function(models) {
  // Belongs to Tournament
  TournamentParticipant.belongsTo(models.Tournament, {
    foreignKey: 'tournamentId',
    as: 'tournament'
  });
  
  // Belongs to User
  TournamentParticipant.belongsTo(models.User, {
    foreignKey: 'userId',
    as: 'user'
  });
  
  // Belongs to Team
  TournamentParticipant.belongsTo(models.Team, {
    foreignKey: 'teamId',
    as: 'team'
  });
};

module.exports = TournamentParticipant;
