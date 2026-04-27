import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('fire_arena_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle 401 Unauthorized errors
    if (error.response?.status === 401) {
      // Clear token and redirect to login
      localStorage.removeItem('fire_arena_token');
      // In a real app, you would dispatch a logout action or redirect
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  login: (data: { email: string; password: string }) => 
    api.post('/auth/login', data),
  
  register: (data: { 
    username: string; 
    email: string; 
    password: string;
    firstName?: string;
    lastName?: string;
    phoneNumber?: string;
  }) => 
    api.post('/auth/register', data),
  
  logout: () => api.post('/auth/logout'),
  
  refreshToken: (refreshToken: string) => 
    api.post('/auth/refresh-token', { refreshToken }),
  
  forgotPassword: (email: string) => 
    api.post('/auth/forgot-password', { email }),
  
  resetPassword: (data: { 
    token: string; 
    password: string; 
  }) => 
    api.post('/auth/reset-password', data),
  
  getProfile: () => api.get('/users/profile'),
  
  updateProfile: (data: { 
    firstName?: string; 
    lastName?: string; 
    phoneNumber?: string; 
    dateOfBirth?: string; 
  }) => 
    api.put('/users/profile', data),
};

export const walletAPI = {
  getBalance: () => api.get('/wallet/balance'),

  getTransactionHistory: (params?: {
    page?: number;
    limit?: number;
    category?: string;
    type?: string;
  }) =>
    api.get('/wallet/transactions', { params }),

  // Internal use only - would be called by payment service after verification
  addFunds: (data: {
    amount: number;
    category: string;
    description?: string;
    referenceId?: string;
    referenceType?: string;
  }) =>
    api.post('/wallet/add-funds', data),

  deductFunds: (data: {
    amount: number;
    category: string;
    description?: string;
    referenceId?: string;
    referenceType?: string;
  }) =>
    api.post('/wallet/deduct-funds', data),

  lockFunds: (data: {
    amount: number;
    category: string;
    description?: string;
    referenceId?: string;
    referenceType?: string;
  }) =>
    api.post('/wallet/lock-funds', data),

  unlockFunds: (data: {
    amount: number;
    category: string;
    description?: string;
    referenceId?: string;
    referenceType?: string;
  }) =>
    api.post('/wallet/unlock-funds', data),
};

export const tournamentAPI = {
  getTournaments: (params?: { 
    page?: number; 
    limit?: number; 
    gameMode?: string; 
    status?: string; 
    isVipOnly?: boolean; 
    search?: string; 
  }) => 
    api.get('/tournaments', { params }),
  
  getTournament: (tournamentId: string) => 
    api.get(`/tournaments/${tournamentId}`),
  
  createTournament: (data: { 
    title: string; 
    description?: string; 
    gameMode: 'solo' | 'duo' | 'squad';
    maxPlayers: number;
    entryFee?: number;
    prizeDistribution?: Record<string, number>;
    startTime?: string;
    endTime?: string;
    registrationDeadline?: string;
    isVipOnly?: boolean;
    minVipLevel?: number;
    autoStartWhenFull?: boolean;
  }) => 
    api.post('/tournaments', data),
  
  joinTournament: (tournamentId: string) => 
    api.post(`/tournaments/${tournamentId}/join`),
  
  leaveTournament: (tournamentId: string) => 
    api.post(`/tournaments/${tournamentId}/leave`),
  
  // Admin/Tournament manager only
  startTournament: (tournamentId: string) => 
    api.post(`/tournaments/${tournamentId}/start`),
  
  completeTournament: (tournamentId: string, results: Array<{ 
    userId: string; 
    position: number; 
    prizeAmount: number; 
  }>) => 
    api.post(`/tournaments/${tournamentId}/complete`, { results }),
  
  cancelTournament: (tournamentId: string) => 
    api.post(`/tournaments/${tournamentId}/cancel`),
};

export const chatAPI = {
  getHistory: (conversationId: string, params: {
    page?: number;
    limit?: number
  } = {}) =>
    axios.get(`${API_BASE_URL}/chat/${conversationId}/history`, { params }),

  sendMessage: (data: {
    conversationId: string;
    recipientId?: string;
    message: string;
    messageType?: string;
    fileUrl?: string;
    fileName?: string;
    replyToId?: string
  }) =>
    axios.post(`${API_BASE_URL}/chat/send`, data),

  getUnreadCount: () =>
    axios.get(`${API_BASE_URL}/chat/unread-count`),

  markAsRead: (messageIds: string[]) =>
    axios.post(`${API_BASE_URL}/chat/mark-as-read`, { messageIds }),

  deleteMessage: (messageId: string) =>
    axios.delete(`${API_BASE_URL}/chat/${messageId}`),

  getMessageById: (messageId: string) =>
    axios.get(`${API_BASE_URL}/chat/${messageId}`),

  uploadFile: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return axios.post(`${API_BASE_URL}/upload`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  }
};

export const vipAPI = {
  getVipStatus: () => api.get('/vip/status'),

  purchaseVip: (data: {
    plan: 'weekly' | 'monthly';
    amount: number;
  }) =>
    api.post('/vip/purchase', data),

  cancelVip: () => api.post('/vip/cancel'),

  getVipTournaments: (params?: {
    page?: number;
    limit?: number;
  }) =>
    api.get('/vip/tournaments', { params }),
};

export const teamAPI = {
  createTeam: (data: { 
    name: string; 
    description?: string; 
  }) => 
    api.post('/team', data),
  
  getTeam: (teamId: string) => 
    api.get(`/team/${teamId}`),
  
  getUserTeams: () => api.get('/team/my-teams'),
  
  joinTeam: (teamId: string) => 
    api.post(`/team/${teamId}/join`),
  
  leaveTeam: (teamId: string) => 
    api.post(`/team/${teamId}/leave`),
  
  getTeamTournaments: (teamId: string) => 
    api.get(`/team/${teamId}/tournaments`),
};

export const notificationAPI = {
  getNotifications: (params?: { 
    page?: number; 
    limit?: number; 
    isRead?: boolean; 
    type?: string; 
    limitUnread?: boolean; 
  }) => 
    api.get('/notifications', { params }),
  
  markAsRead: (notificationId: string) => 
    api.patch(`/notifications/${notificationId}/read`),
  
  markAllAsRead: () => api.post('/notifications/mark-all-read'),
  
  archiveNotification: (notificationId: string) => 
    api.patch(`/notifications/${notificationId}/archive`),
  
  deleteNotification: (notificationId: string) => 
    api.delete(`/notifications/${notificationId}`),
  
  getSettings: () => api.get('/notifications/settings'),
  
  updateSettings: (settings: Record<string, boolean>) => 
    api.post('/notifications/settings', settings),
};

export default api;
