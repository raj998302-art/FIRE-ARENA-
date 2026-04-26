'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useState, useEffect, useRef } from 'react';
import { chatAPI } from '@/lib/api';
import io from 'socket.io-client';

export default function ChatPage() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Array<any>>([]);
  const [inputValue, setInputValue] = useState('');
  const [typingUsers, setTypingUsers] = useState<Array<any>>([]);
  const [scrollToBottom, setScrollToBottom] = useState(true);
  const [uploading, setUploading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [socket, setSocket] = useState<any>(null);
  const [onlineUsers, setOnlineUsers] = useState<Array<any>>([]);

  useEffect(() => {
    if (!user?.id) return;

    // Initialize socket connection
    const socketIo = io(process.env.NEXT_PUBLIC_SOCKET_URL || '', {
      auth: {
        token: localStorage.getItem('fire_arena_token')
      }
    });

    setSocket(socketIo);

    // Join global chat room
    socketIo.emit('join_room', 'global_chat');

    // Load initial chat history
    loadChatHistory();

    // Socket event listeners
    socketIo.on('new_message', (message) => {
      setMessages(prev => [...prev, message]);
      setScrollToBottom(true);
    });

    socketIo.on('user_typing', (data) => {
      setTypingUsers(prev => {
        // Remove user if not typing
        if (!data.isTyping) {
          return prev.filter(user => user.userId !== data.userId);
        }

        // Add or update user typing status
        const existingIndex = prev.findIndex(user => user.userId === data.userId);
        if (existingIndex >= 0) {
          const updated = [...prev];
          updated[existingIndex] = data;
          return updated;
        }
        return [...prev, data];
      });
    });

    socketIo.on('user_online', (userData) => {
      setOnlineUsers(prev => [...prev, userData]);
    });

    socketIo.on('user_offline', (userData) => {
      setOnlineUsers(prev => prev.filter(user => user.userId !== userData.userId));
    });

    socketIo.on('online_users', (users) => {
      setOnlineUsers(users);
    });

    socketIo.on('message_read', (data) => {
      setMessages(prev => prev.map(msg =>
        msg.id === data.messageId ? {...msg, isRead: true} : msg
      ));
    });

    // Cleanup on unmount
    return () => {
      socketIo.emit('leave_room', 'global_chat');
      socketIo.disconnect();
    };
  }, [user?.id]);

  const loadChatHistory = async () => {
    try {
      const response = await chatAPI.getHistory('global_chat');
      setMessages(response.data.messages);
      setScrollToBottom(true);
    } catch (error) {
      console.error('Failed to load chat history:', error);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    try {
      const response = await chatAPI.sendMessage({
        conversationId: 'global_chat',
        message: inputValue.trim(),
        messageType: 'text'
      });

      setInputValue('');

      // Emit typing stopped
      if (socket) {
        socket.emit('typing', {
          roomId: 'global_chat',
          isTyping: false
        });
      }
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const response = await chatAPI.uploadFile(file);
      const fileUrl = response.data.data.fileUrl;

      // Send message with file
      const response = await chatAPI.sendMessage({
        conversationId: 'global_chat',
        message: '', // Empty message for file-only
        messageType: file.type.startsWith('image/') ? 'image' : 'file',
        fileUrl: fileUrl,
        fileName: file.name
      });

      // Emit typing stopped
      if (socket) {
        socket.emit('typing', {
          roomId: 'global_chat',
          isTyping: false
        });
      }
    } catch (error) {
      console.error('Failed to upload file:', error);
    } finally {
      setUploading(false);
      e.target.value = ''; // Reset file input
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setInputValue(value);

    // Emit typing indicator
    if (socket) {
      socket.emit('typing', {
        roomId: 'global_chat',
        isTyping: value.length > 0
      });
    }
  };

  useEffect(() => {
    if (scrollToBottom && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
      setScrollToBottom(false);
    }
  }, [messages, scrollToBottom]);

  if (!user) {
    return <div className="flex h-screen items-center justify-center">Please log in</div>;
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <div className="flex h-screen">
        {/* Sidebar */}
        <aside className="w-64 bg-[#1a1a1a] border-r border-gray-700">
          <div className="flex items-center h-16 px-4 border-b border-gray-700">
            <span className="text-xl font-bold text-neon-blue">FIRE ARENA CHAT</span>
          </div>

          <div className="flex items-center px-4 py-3 border-b border-gray-700">
            <div className="w-3 h-3 bg-neon-blue rounded-full mr-2"></div>
            <span className="text-xs text-gray-400">Global Chat</span>
          </div>

          <div className="mt-4 space-y-2 px-4">
            <p className="text-xs text-gray-500">ONLINE ({onlineUsers.length})</div>
            <div className="space-y-1 max-h-60 overflow-y-auto">
              {onlineUsers.map((userData: any) => (
                <div key={userData.userId} className="flex items-center space-x-2 px-2 py-1 rounded-hover">
                  <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                  <span className="text-xs text-gray-300">{userData.username}</span>
                </div>
              ))}
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 flex flex-col">
          <header className="bg-[#1a1a1a] border-b border-gray-700 px-6 py-4">
            <div className="flex justify-between items-center">
              <h1 className="text-xl font-bold text-neon-blue">Global Chat</h1>
              <div className="flex items-center space-x-3">
                <span className="text-xs text-gray-400">
                  {messages.length} messages
                </span>
              </div>
            </div>
          </header>

          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                Start the conversation!
              </div>
            ) : (
              <>
                {messages.map((message: any) => (
                  <div key={message.id} className={`flex ${message.senderId === user?.id ? 'justify-end' : 'justify-start'} max-w-[80%]`}>
                    <div className={`max-w-[70%] rounded-xl px-4 py-2 ${message.senderId === user?.id ? 'bg-neon-blue text-white' : 'bg-[#1a1a1a] text-white'}`}>
                      {/* File preview */}
                      {message.fileUrl && message.messageType === 'image' && (
                        <img
                          src={message.fileUrl}
                          alt="Uploaded image"
                          className="max-w-[200px] max-h-[200px] rounded-lg mb-2"
                        />
                      )}
                      {message.fileUrl && message.messageType === 'file' && (
                        <div className="flex items-center space-x-2 mb-2">
                          <span className="text-xs text-neon-blue">📎</span>
                          <a
                            href={message.fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-neon-blue underline"
                          >
                            {message.fileName || 'Attachment'}
                          </a>
                        </div>
                      )}

                      <p className="text-sm break-words whitespace-pre-wrap">{message.message}</p>
                      <div className="flex justify-between items-center mt-1">
                        <span className="text-xs text-gray-400">
                          {new Date(message.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </span>
                        {!message.isRead && message.recipientId === user?.id && (
                          <span className="text-xs bg-green-500 text-white rounded-full px-2 py-0">✓</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </>
            )}
          </div>

          <div className="bg-[#1a1a1a] border-t border-gray-700 px-4 py-3">
            {typingUsers.length > 0 && (
              <div className="flex items-center space-x-2 text-xs text-gray-400 mb-2">
                {typingUsers.map((userData: any, index: number) => (
                  <span key={`${userData.userId}-${index}`}>
                    {userData.username}{index < typingUsers.length - 1 ? ', ' : ''}
                  </span>
                ))}
                {typingUsers.length === 1 ? 'is typing' : 'are typing'}
              </div>
            )}

            <div className="flex items-center space-x-3">
              {/* File upload */}
              <label
                htmlFor="file-upload"
                className="flex items-center space-x-2 text-xs text-gray-400 cursor-pointer hover:text-neutral-300"
              >
                <span className="w-3 h-3 bg-neon-blue rounded-flex"></span>
                Upload File
              </label>
              <input
                id="file-upload"
                type="file"
                accept="image/*,.pdf,.txt,.doc,.docx"
                onChange={handleFileUpload}
                className="hidden"
              />

              <div className="flex-1 ml-4">
                <textarea
                  value={inputValue}
                  onChange={handleInputChange}
                  onKeyDown={handleKeyDown}
                  placeholder="Type a message..."
                  className="flex-1 min-h-[60px] resize-none px-4 py-3 bg-[#1a1a1a] border border-gray-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-neon-blue"
                  rows={2}
                />
                {uploading && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-neon-blue"></div>
                )}
              </div>

              <button
                onClick={handleSendMessage}
                disabled={!inputValue.trim() || uploading}
                className="ml-3 bg-neon-blue text-white px-5 py-3 rounded-xl font-medium hover:bg-neon-blue/90 transition-all duration-200"
              >
                {uploading ? 'Uploading...' : 'Send'}
              </button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}