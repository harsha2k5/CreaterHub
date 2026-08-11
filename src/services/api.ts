const API_BASE_URL = 'http://localhost:5000/api';

function getAuthHeaders() {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };
}

async function request(endpoint: string, options: RequestInit = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  const config = {
    ...options,
    headers: {
      ...getAuthHeaders(),
      ...(options.headers || {})
    }
  };

  const response = await fetch(url, config);
  const data = await response.json();

  if (!response.ok || !data.success) {
    throw new Error(data.error || 'API Request failed');
  }

  return data;
}

export const api = {
  // Auth
  register: (payload: any) => request('/auth/register', { method: 'POST', body: JSON.stringify(payload) }),
  login: (payload: any) => request('/auth/login', { method: 'POST', body: JSON.stringify(payload) }),
  getMe: () => request('/auth/me'),

  // Campaigns
  getCampaigns: (params: Record<string, string> = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/campaigns${query ? `?${query}` : ''}`);
  },
  getCampaignById: (id: string) => request(`/campaigns/${id}`),
  createCampaign: (payload: any) => request('/campaigns', { method: 'POST', body: JSON.stringify(payload) }),
  applyCampaign: (id: string, payload: any) => request(`/campaigns/${id}/apply`, { method: 'POST', body: JSON.stringify(payload) }),

  // Applications
  getApplications: () => request('/applications'),
  updateApplicationStatus: (id: string, status: 'accepted' | 'rejected') =>
    request(`/applications/${id}/status`, { method: 'PUT', body: JSON.stringify({ status }) }),

  // Collaborations
  getCollaborations: () => request('/collaborations'),
  getCollaborationById: (id: string) => request(`/collaborations/${id}`),
  submitContentProof: (id: string, payload: any) => request(`/collaborations/${id}/submit`, { method: 'POST', body: JSON.stringify(payload) }),
  reviewContentProof: (id: string, payload: { action: 'approve' | 'revision'; feedback?: string }) =>
    request(`/collaborations/${id}/review`, { method: 'PUT', body: JSON.stringify(payload) }),
  releasePayment: (id: string) => request(`/collaborations/${id}/release-payment`, { method: 'POST' }),

  // Profiles
  getCreators: (params: Record<string, string> = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/creators${query ? `?${query}` : ''}`);
  },
  getCreatorById: (id: string) => request(`/creators/${id}`),
  getBrands: () => request('/brands'),
  getBrandById: (id: string) => request(`/brands/${id}`),

  // Messaging & Notifications
  getConversations: () => request('/messages/conversations'),
  getMessages: (conversationId: string) => request(`/messages/${conversationId}`),
  sendMessage: (conversationId: string, payload: { text: string; attachment_url?: string }) =>
    request(`/messages/${conversationId}`, { method: 'POST', body: JSON.stringify(payload) }),
  getNotifications: () => request('/notifications'),
  markNotificationsRead: () => request('/notifications/read-all', { method: 'PUT' }),

  // Reviews & Reports
  submitReview: (payload: any) => request('/reviews', { method: 'POST', body: JSON.stringify(payload) }),
  submitReport: (payload: any) => request('/reports', { method: 'POST', body: JSON.stringify(payload) }),

  // Admin
  getAdminStats: () => request('/admin/stats'),
  getAdminUsers: () => request('/admin/users'),
  verifyUser: (userId: string) => request(`/admin/verify-user/${userId}`, { method: 'PUT' }),
  getAdminReports: () => request('/admin/reports')
};
