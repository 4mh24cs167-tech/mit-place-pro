const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface ApiOptions {
  method?: string;
  body?: unknown;
  headers?: Record<string, string>;
  isFormData?: boolean;
}

interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  meta?: { page: number; limit: number; total: number; totalPages: number };
}

class ApiError extends Error {
  constructor(public statusCode: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('auth_token');
}

function setToken(token: string): void {
  localStorage.setItem('auth_token', token);
}

function removeToken(): void {
  localStorage.removeItem('auth_token');
  localStorage.removeItem('auth_user');
}

function getStoredUser(): { id: string; email: string; role: string } | null {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem('auth_user');
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

async function apiFetch<T = unknown>(path: string, options: ApiOptions = {}): Promise<ApiResponse<T>> {
  const { method = 'GET', body, headers = {}, isFormData = false } = options;

  const token = getToken();
  const fetchHeaders: Record<string, string> = {
    ...headers,
  };

  if (token) {
    fetchHeaders['Authorization'] = `Bearer ${token}`;
  }

  if (!isFormData && body) {
    fetchHeaders['Content-Type'] = 'application/json';
  }

  const fetchOptions: RequestInit = {
    method,
    headers: fetchHeaders,
  };

  if (body) {
    fetchOptions.body = isFormData ? (body as FormData) : JSON.stringify(body);
  }

  const response = await fetch(`${API_BASE}${path}`, fetchOptions);

  if (response.status === 401) {
    removeToken();
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
    throw new ApiError(401, 'Session expired');
  }

  const contentType = response.headers.get('content-type');
  if (contentType?.includes('application/json')) {
    const json = await response.json();
    if (!response.ok) {
      throw new ApiError(response.status, json.message || 'Request failed');
    }
    return json as ApiResponse<T>;
  }

  if (!response.ok) {
    throw new ApiError(response.status, 'Request failed');
  }

  return { success: true } as ApiResponse<T>;
}

// ─── Auth ────────────────────────────────────────
export const authApi = {
  async login(email: string, password: string) {
    const res = await apiFetch<{ accessToken: string; user: { id: string; email: string; role: string; mustChangePassword: boolean } }>(
      '/api/v1/auth/login',
      { method: 'POST', body: { email, password } },
    );
    if (res.data?.accessToken) {
      setToken(res.data.accessToken);
      localStorage.setItem('auth_user', JSON.stringify(res.data.user));
    }
    return res;
  },

  async changePassword(currentPassword: string, newPassword: string) {
    return apiFetch('/api/v1/auth/change-password', {
      method: 'PATCH',
      body: { currentPassword, newPassword },
    });
  },

  async forgotPassword(email: string) {
    return apiFetch('/api/v1/auth/forgot-password', {
      method: 'POST',
      body: { email },
    });
  },

  async verifyOtp(email: string, otp: string) {
    return apiFetch<{ verified: boolean }>('/api/v1/auth/verify-otp', {
      method: 'POST',
      body: { email, otp },
    });
  },

  async resetPassword(email: string, otp: string, newPassword: string) {
    return apiFetch('/api/v1/auth/reset-password', {
      method: 'POST',
      body: { email, otp, newPassword },
    });
  },

  logout() {
    removeToken();
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
  },

  getUser() {
    return getStoredUser();
  },

  isAuthenticated() {
    return !!getToken();
  },
};

// ─── Admin ───────────────────────────────────────
export const adminApi = {
  getDashboard: () => apiFetch('/api/v1/admin/dashboard'),
  getActivity: (limit = 10) => apiFetch(`/api/v1/admin/activity?limit=${limit}`),

  // Students
  listStudents: (params?: { page?: number; limit?: number; search?: string; department?: string; status?: string }) => {
    const query = new URLSearchParams();
    if (params?.page) query.set('page', String(params.page));
    if (params?.limit) query.set('limit', String(params.limit));
    if (params?.search) query.set('search', params.search);
    if (params?.department) query.set('department', params.department);
    if (params?.status) query.set('status', params.status);
    return apiFetch(`/api/v1/admin/students?${query.toString()}`);
  },
  getStudent: (id: string) => apiFetch(`/api/v1/admin/students/${id}`),
  updateStudent: (id: string, data: Record<string, unknown>) => apiFetch(`/api/v1/admin/students/${id}`, { method: 'PATCH', body: data }),
  deleteStudent: (id: string) => apiFetch(`/api/v1/admin/students/${id}`, { method: 'DELETE' }),

  // Bulk upload
  uploadStudents: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return apiFetch('/api/v1/admin/students/bulk-upload', { method: 'POST', body: formData, isFormData: true });
  },

  // Companies
  createCompany: (data: Record<string, unknown>) => apiFetch('/api/v1/admin/companies', { method: 'POST', body: data }),
  listCompanies: (params?: { page?: number; search?: string }) => {
    const query = new URLSearchParams();
    if (params?.page) query.set('page', String(params.page));
    if (params?.search) query.set('search', params.search);
    return apiFetch(`/api/v1/admin/companies?${query.toString()}`);
  },
  getCompany: (id: string) => apiFetch(`/api/v1/admin/companies/${id}`),

  // Shortlist
  getShortlist: (jobId: string) => apiFetch(`/api/v1/admin/jobs/${jobId}/shortlist`),
  approveShortlist: (jobId: string, studentIds: string[], approved: boolean) =>
    apiFetch(`/api/v1/admin/jobs/${jobId}/approve`, { method: 'POST', body: { studentIds, approved } }),

  // Slots
  listSlots: (params?: { jobId?: string }) => {
    const query = new URLSearchParams();
    if (params?.jobId) query.set('jobId', params.jobId);
    return apiFetch(`/api/v1/admin/slots?${query.toString()}`);
  },
  generateSlots: (jobId: string, round: number, config?: Record<string, unknown>) =>
    apiFetch('/api/v1/admin/slots/generate', { method: 'POST', body: { jobId, round, ...config } }),
  getSlotTimeline: (date?: string) => {
    const query = new URLSearchParams();
    if (date) query.set('date', date);
    return apiFetch(`/api/v1/admin/slots/timeline?${query.toString()}`);
  },

  // Jobs (admin view)
  listJobs: (params?: { page?: number; search?: string }) => {
    const query = new URLSearchParams();
    if (params?.page) query.set('page', String(params.page));
    if (params?.search) query.set('search', params.search);
    return apiFetch(`/api/v1/admin/jobs?${query.toString()}`);
  },

  // Applications (admin view)
  listApplications: (params?: { page?: number; search?: string; status?: string }) => {
    const query = new URLSearchParams();
    if (params?.page) query.set('page', String(params.page));
    if (params?.search) query.set('search', params.search);
    if (params?.status) query.set('status', params.status);
    return apiFetch(`/api/v1/admin/applications?${query.toString()}`);
  },
};

// ─── Student ─────────────────────────────────────
export const studentApi = {
  getProfile: () => apiFetch('/api/v1/student/profile'),
  updateProfile: (data: Record<string, unknown>) => apiFetch('/api/v1/student/profile', { method: 'PATCH', body: data }),
  getEligibleJobs: () => apiFetch('/api/v1/student/jobs'),
  applyForJob: (jobId: string, cvId?: string) => apiFetch('/api/v1/student/apply', { method: 'POST', body: { jobId, cvId } }),
  getApplications: () => apiFetch('/api/v1/student/applications'),
  getInterviews: () => apiFetch('/api/v1/student/interviews'),
  getNotifications: () => apiFetch('/api/v1/student/notifications'),
  markNotificationRead: (id: string) => apiFetch(`/api/v1/student/notifications/${id}/read`, { method: 'PATCH' }),
};

// ─── Company ─────────────────────────────────────
export const companyApi = {
  getDashboard: () => apiFetch('/api/v1/company/dashboard'),
  getProfile: () => apiFetch('/api/v1/company/profile'),
  createJob: (data: Record<string, unknown>) => apiFetch('/api/v1/company/jobs', { method: 'POST', body: data }),
  getJobs: () => apiFetch('/api/v1/company/jobs'),
  listJobs: () => apiFetch('/api/v1/company/jobs'),
  getJob: (jobId: string) => apiFetch(`/api/v1/company/jobs/${jobId}`),
  publishJob: (jobId: string) => apiFetch(`/api/v1/company/jobs/${jobId}/publish`, { method: 'PATCH' }),
  addAvailability: (jobId: string, data: Record<string, unknown>) => apiFetch(`/api/v1/company/jobs/${jobId}/availability`, { method: 'POST', body: data }),
  getAvailability: (jobId: string) => apiFetch(`/api/v1/company/jobs/${jobId}/availability`),
  getCandidates: (jobId: string) => apiFetch(`/api/v1/company/jobs/${jobId}/candidates`),
  getShortlist: () => apiFetch('/api/v1/company/shortlist'),
  markAttendance: (slotId: string, attendance: string) => apiFetch('/api/v1/company/attendance', { method: 'PATCH', body: { slotId, attendance } }),
  markRoundResult: (slotId: string, result: string) => apiFetch('/api/v1/company/round-result', { method: 'PATCH', body: { slotId, result } }),
};

export { ApiError, getToken, removeToken, getStoredUser };
