const getBaseUrl = () => {
  const envUrl = import.meta.env.VITE_API_URL;
  if (!envUrl) return '/api';
  return envUrl.endsWith('/api') ? envUrl : `${envUrl.replace(/\/$/, '')}/api`;
};

const API_BASE_URL = getBaseUrl();
console.log(`[API Config] Base API URL: "${API_BASE_URL}" | VITE_API_URL: "${import.meta.env.VITE_API_URL || 'NOT_SET'}"`);

function getAuthHeaders() {
  const token = sessionStorage.getItem('token') || localStorage.getItem('token');
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

  try {
    const response = await fetch(url, config);
    const text = await response.text();
    let data: any = {};

    if (text && text.trim().length > 0) {
      try {
        data = JSON.parse(text);
      } catch (jsonErr) {
        const isNotSet = !import.meta.env.VITE_API_URL;
        const snippet = text.slice(0, 150).replace(/\s+/g, ' ');
        if (isNotSet) {
          throw new Error(`API Config Error: VITE_API_URL is NOT set on Netlify! Request went to "${url}" and received HTML (Status ${response.status}). Set VITE_API_URL in Netlify Site Settings and Trigger a New Deploy.`);
        }
        throw new Error(`Backend Error (${response.status}): Fetching "${url}" returned non-JSON content: "${snippet}...". Verify backend URL and status.`);
      }
    } else {
      if (!response.ok) {
        throw new Error(`Server returned empty response (${response.status}) from "${url}". Ensure backend API is running.`);
      }
    }

    if (!response.ok || (data && data.success === false)) {
      throw new Error(data?.error || `API request to "${url}" failed with status ${response.status}`);
    }

    return data;
  } catch (err: any) {
    if (err.name === 'TypeError' && (err.message === 'Failed to fetch' || err.message.includes('fetch'))) {
      throw new Error(`Network Error: Unreachable backend at "${url}". Verify VITE_API_URL or check if backend service is running.`);
    }
    throw err;
  }
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
  sendDirectPitch: (creatorId: string, payload: any) =>
    request(`/creators/${creatorId}/pitch`, { method: 'POST', body: JSON.stringify(payload) }),
  analyzeCreatorProfile: (socialLink: string) =>
    request('/creators/analyze-profile', { method: 'POST', body: JSON.stringify({ social_link: socialLink }) }),
  syncCreatorLiveData: (creatorId: string) =>
    request(`/creators/${creatorId}/sync-live-data`, { method: 'POST' }),
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
  getAdminCollaborations: () => request('/admin/collaborations'),
  verifyUser: (userId: string) => request(`/admin/verify-user/${userId}`, { method: 'PUT' }),
  getAdminReports: () => request('/admin/reports')
};
