const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const ChatMessage = sequelize.define('ChatMessage', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  conversationId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'conversation_id'
  },
  senderId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'sender_id',
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  recipientId: {
    type: DataTypes.UUID,
    field: 'recipient_id',
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  message: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  messageType: {
    type: DataTypes.ENUM('text', 'image', 'file', 'system'),
    defaultValue: 'text'
  },
  fileUrl: {
    type: DataTypes.STRING(255),
    field: 'file_url'
  },
  fileName: {
    type: DataTypes.STRING(255),
    field: 'file_name'
  },
  fileSize: {
    type: DataTypes.INTEGER,
    field: 'file_size'
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
  isEdited: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    field: 'is_edited'
  },
  editedAt: {
    type: DataTypes.DATE,
    field: 'edited_at'
  },
  isDeleted: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    field: 'is_deleted'
  },
  deletedAt: {
    type: DataTypes.DATE,
    field: 'deleted_at'
  },
  replyToId: {
    type: DataTypes.UUID,
    field: 'reply_to_id',
    references: {
      model: 'ChatMessages',
      key: 'id'
    }
  },
  metadata: {
    type: DataTypes.JSON,
    field: 'metadata'
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
  tableName: 'chat_messages',
  timestamps: true,
  indexes: [
    {
      fields: ['conversationId', 'createdAt']
    },
    {
      fields: ['senderId', 'createdAt']
    },
    {
      fields: ['recipientId', 'createdAt']
    },
    {
      fields: ['isRead', 'createdAt']
    },
    {
      fields: ['replyToId']
    }
  ]
});

// Instance methods
ChatMessage.prototype.markAsRead = function() {
  this.isRead = true;
  this.readAt = new Date();
};

// Associations will be defined in index.js
ChatMessage.associate = function(models) {
  // Belongs to User (sender)
  ChatMessage.belongsTo(models.User, {
    foreignKey: 'senderId',
    as: 'sender'
  });
  
  // Belongs to User (recipient)
  ChatMessage.belongsTo(models.User, {
    foreignKey: 'recipientId',
    as: 'recipient'
  });
  
  // Belongs to ChatMessage (reply to)
  ChatMessage.belongsTo(models.ChatMessage, {
    foreignKey: 'replyToId',
    as: 'replyTo'
  });
  
  // Has many ChatMessage (replies)
  ChatMessage.hasMany(models.ChatMessage, {
    foreignKey: 'replyToId',
    as: 'replies'
  });
};

module.exports = ChatMessage;
