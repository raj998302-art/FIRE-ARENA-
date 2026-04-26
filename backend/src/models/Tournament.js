const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Tournament = sequelize.define('Tournament', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  title: {
    type: DataTypes.STRING(100),
    allowNull: false,
    validate: {
      len: [3, 100]
    }
  },
  description: {
    type: DataTypes.TEXT,
    field: 'description'
  },
  gameMode: {
    type: DataTypes.ENUM('solo', 'duo', 'squad'),
    allowNull: false,
    field: 'game_mode'
  },
  maxPlayers: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: 2,
      max: 1000
    }
  },
  currentPlayers: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    field: 'current_players'
  },
  entryFee: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0.00,
    validate: {
      min: 0
    }
  },
  prizePool: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0.00,
    field: 'prize_pool'
  },
  prizeDistribution: {
    type: DataTypes.JSON,
    field: 'prize_distribution',
    comment: 'JSON object defining prize distribution (e.g., {1: 50, 2: 30, 3: 20})'
  },
  status: {
    type: DataTypes.ENUM(
      'draft', 'scheduled', 'registration_open', 'registration_closed',
      'in_progress', 'completed', 'cancelled', 'postponed'
    ),
    defaultValue: 'draft'
  },
  startTime: {
    type: DataTypes.DATE,
    field: 'start_time'
  },
  endTime: {
    type: DataTypes.DATE,
    field: 'end_time'
  },
  registrationDeadline: {
    type: DataTypes.DATE,
    field: 'registration_deadline'
  },
  roomId: {
    type: DataTypes.STRING(50),
    field: 'room_id'
  },
  roomPassword: {
    type: DataTypes.STRING(50),
    field: 'room_password'
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
  isVipOnly: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    field: 'is_vip_only'
  },
  minVipLevel: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    field: 'min_vip_level'
  },
  autoStartWhenFull: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    field: 'auto_start_when_full'
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
  tableName: 'tournaments',
  timestamps: true,
  indexes: [
    {
      fields: ['status', 'startTime']
    },
    {
      fields: ['gameMode', 'status']
    },
    {
      fields: ['isVipOnly', 'minVipLevel']
    },
    {
      fields: ['createdBy']
    }
  ]
});

// Instance methods
Tournament.prototype.isFull = function() {
  return this.currentPlayers >= this.maxPlayers;
};

Tournament.prototype.canJoin = function(userId) {
  // Check if tournament is open for registration
  if (this.status !== 'registration_open' && this.status !== 'scheduled') {
    return false;
  }
  
  // Check if tournament is full
  if (this.isFull()) {
    return false;
  }
  
  // Check if tournament has started
  if (this.startTime && new Date() >= this.startTime) {
    return false;
  }
  
  // Check VIP requirements
  if (this.isVipOnly) {
    // This would need to check user's VIP level in practice
    // For now, we'll assume the check happens in the service layer
  }
  
  return true;
};

// Associations will be defined in index.js
Tournament.associate = function(models) {
  // Belongs to User (creator)
  Tournament.belongsTo(models.User, {
    foreignKey: 'createdBy',
    as: 'creator'
  });
  
  // Belongs to User (updater)
  Tournament.belongsTo(models.User, {
    foreignKey: 'updatedBy',
    as: 'updater'
  });
  
  // Has many participants
  Tournament.hasMany(models.TournamentParticipant, {
    foreignKey: 'tournamentId',
    as: 'participants'
  });
  
  // Has many wallet transactions (entry fees)
  WalletTransaction.belongsTo(Tournament, {
    foreignKey: 'referenceId',
    constraints: false,
    scope: {
      referenceType: 'tournament'
    },
    as: 'entryTransactions'
  });
  
  // Has many wallet transactions (prizes)
  WalletTransaction.belongsTo(Tournament, {
    foreignKey: 'referenceId',
    constraints: false,
    scope: {
      referenceType: 'tournament_prize'
    },
    as: 'prizeTransactions'
  });
};

module.exports = Tournament;
