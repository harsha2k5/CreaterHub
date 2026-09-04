const getBaseUrl = () => {
  const envUrl = import.meta.env.VITE_API_URL;
  if (!envUrl) return '/api';
  return envUrl.endsWith('/api') ? envUrl : `${envUrl.replace(/\/$/, '')}/api`;
};

const API_BASE_URL = getBaseUrl();

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
      } catch {
        throw new Error(`Server returned non-JSON response (${response.status}) from "${url}".`);
      }
    } else {
      if (!response.ok) {
        throw new Error(`Server returned empty response (${response.status}) from "${url}".`);
      }
    }

    if (!response.ok || (data && data.success === false)) {
      throw new Error(data?.error || `Request failed with status ${response.status}`);
    }

    return data;
  } catch (err: any) {
    if (err.name === 'TypeError' && (err.message === 'Failed to fetch' || err.message.includes('fetch'))) {
      throw new Error(`Unable to reach backend API at "${url}". Please ensure server is running.`);
    }
    throw err;
  }
}

export const api = {
  // Auth
  register: (payload: any) => request('/auth/register', { method: 'POST', body: JSON.stringify(payload) }),
  login: (payload: any) => request('/auth/login', { method: 'POST', body: JSON.stringify(payload) }),
  getMe: () => request('/auth/me'),

  // Campaigns & Discovery
  getCampaigns: (params: Record<string, string> = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/campaigns${query ? `?${query}` : ''}`);
  },
  getCampaignById: (id: string) => request(`/campaigns/${id}`),
  createCampaign: (payload: any) => request('/campaigns', { method: 'POST', body: JSON.stringify(payload) }),
  updateCampaignStatus: (id: string, status: string) =>
    request(`/campaigns/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
  getCampaignMatches: (campaignId: string) => request(`/campaigns/${campaignId}/matches`),

  // Applications
  applyCampaign: (payload: any) => request('/applications/apply', { method: 'POST', body: JSON.stringify(payload) }),
  getApplications: (params: Record<string, string> = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/applications${query ? `?${query}` : ''}`);
  },
  updateApplicationStatus: (id: string, status: 'ACCEPTED' | 'SHORTLISTED' | 'REJECTED') =>
    request(`/applications/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),

  // Collaborations & Deliverables
  getCollaborations: () => request('/collaborations'),
  getCollaborationById: (id: string) => request(`/collaborations/${id}`),
  submitDeliverableProof: (id: string, payload: any) =>
    request(`/collaborations/${id}/submit`, { method: 'POST', body: JSON.stringify(payload) }),
  reviewDeliverableProof: (id: string, payload: { action: 'APPROVE' | 'REVISION'; feedback?: string }) =>
    request(`/collaborations/${id}/review`, { method: 'POST', body: JSON.stringify(payload) }),

  // Creators & Brands
  getCreators: (params: Record<string, string> = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/creators${query ? `?${query}` : ''}`);
  },
  getCreatorById: (id: string) => request(`/creators/${id}`),
  updateCreatorProfile: (payload: any) => request('/creators/profile', { method: 'POST', body: JSON.stringify(payload) }),
  sendDirectPitch: (creatorId: string, payload: any) =>
    request(`/creators/${creatorId}/pitch`, { method: 'POST', body: JSON.stringify(payload) }),
  getBrands: () => request('/brands'),
  getBrandById: (id: string) => request(`/brands/${id}`),
  getBrandAnalytics: () => request('/brands/analytics'),
  updateBrandProfile: (payload: any) => request('/brands/profile', { method: 'PUT', body: JSON.stringify(payload) }),

  // Official Instagram Graph API (Zero Fake Data)
  getInstagramConnectUrl: () => request('/instagram/connect'),
  getInstagramStatus: () => request('/instagram/status'),
  getInstagramProfile: () => request('/instagram/profile'),
  getInstagramMetrics: () => request('/instagram/metrics'),
  getInstagramMedia: (limit?: number) => request(`/instagram/media${limit ? `?limit=${limit}` : ''}`),
  getInstagramInsights: () => request('/instagram/insights'),
  handleInstagramCallback: (code: string, state?: string) =>
    request('/instagram/callback', { method: 'POST', body: JSON.stringify({ code, state }) }),
  syncInstagramAnalytics: () => request('/instagram/sync', { method: 'POST' }),
  disconnectInstagram: () => request('/instagram/disconnect', { method: 'POST' }),
  getInstagramAnalytics: () => request('/instagram/status'),
  getInstagramConfigStatus: () => request('/instagram/config-status'),
  connectInstagramSandbox: (payload?: any) => request('/instagram/sandbox-connect', { method: 'POST', body: JSON.stringify(payload || {}) }),
  connectInstagramByLink: (payload: { profileUrl: string; followersCount?: number; engagementRate?: number; bio?: string }) =>
    request('/instagram/connect-by-link', { method: 'POST', body: JSON.stringify(payload) }),

  // AI Creator Analysis
  triggerAIAnalysis: () => request('/ai/analyze-creator', { method: 'POST' }),
  getCreatorAIAnalysis: (creatorId: string) => request(`/ai/creator-analysis/${creatorId}`),
  generateCampaignBriefAI: (payload: { prompt: string; category?: string; location?: string; budget?: number }) =>
    request('/ai/generate-campaign-brief', { method: 'POST', body: JSON.stringify(payload) }),

  // Payments & Escrow
  getCreatorEarnings: () => request('/payments/earnings'),
  releaseEscrowPayment: (collabId: string) => request(`/payments/release/${collabId}`, { method: 'POST' }),

  // Messaging & Conversations
  getConversations: () => request('/messages/conversations'),
  getMessages: (conversationId: string) => request(`/messages/${conversationId}`),
  sendMessage: (conversationId: string, payload: { text: string; attachment_url?: string }) =>
    request(`/messages/${conversationId}`, { method: 'POST', body: JSON.stringify(payload) }),

  // Reviews & Notifications
  submitReview: (payload: any) => request('/reviews', { method: 'POST', body: JSON.stringify(payload) }),
  getCollaborationReviews: (collabId: string) => request(`/reviews/collaboration/${collabId}`),
  getNotifications: () => request('/notifications'),
  markNotificationsRead: () => request('/notifications/read-all', { method: 'PUT' }),

  // Admin
  getAdminStats: () => request('/admin/stats'),
  getAdminUsers: () => request('/admin/users'),
  suspendUser: (userId: string) => request(`/admin/users/${userId}/suspend`, { method: 'PUT' }),
  verifyCreatorBadge: (creatorId: string) => request(`/admin/creators/${creatorId}/verify`, { method: 'PUT' }),
  getAdminCampaigns: () => request('/admin/campaigns'),
  moderateCampaign: (id: string, status: string) => request(`/admin/campaigns/${id}/moderate`, { method: 'PATCH', body: JSON.stringify({ status }) }),
  getAdminInstagramHealth: () => request('/admin/instagram-health')
};
