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
    // Don't redirect to /login if we're already on the login page (i.e. login attempt failed)
    const isLoginRequest = path.includes('/auth/login');
    removeToken();
    if (!isLoginRequest && typeof window !== 'undefined') {
      window.location.href = '/login';
    }
    throw new ApiError(401, 'Invalid credentials');
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
  getActivity: (limit?: number) => apiFetch(`/api/v1/admin/activity?limit=${limit || 10}`),
  getEmailLogs: (limit?: number) => apiFetch(`/api/v1/admin/email-logs?limit=${limit || 50}`),
  getSmtpStatus: () => apiFetch('/api/v1/admin/smtp/status'),
  sendSmtpTest: (email: string) => apiFetch('/api/v1/admin/smtp/test', { method: 'POST', body: { email } }),

  // Students
  listStudents: (params?: { page?: number; limit?: number; search?: string; department?: string; status?: string; batch?: string }) => {
    const query = new URLSearchParams();
    if (params?.page) query.set('page', String(params.page));
    if (params?.limit) query.set('limit', String(params.limit));
    if (params?.search) query.set('search', params.search);
    if (params?.department) query.set('department', params.department);
    if (params?.status) query.set('status', params.status);
    if (params?.batch) query.set('batch', params.batch);
    return apiFetch(`/api/v1/admin/students?${query.toString()}`);
  },
  getStudent: (id: string) => apiFetch(`/api/v1/admin/students/${id}`),
  updateStudent: (id: string, data: Record<string, unknown>) => apiFetch(`/api/v1/admin/students/${id}`, { method: 'PATCH', body: data }),
  deleteStudent: (id: string) => apiFetch(`/api/v1/admin/students/${id}`, { method: 'DELETE' }),
  createStudent: (data: { usn: string; email: string; fullName: string; department: string; batch?: string; phone?: string; gender?: string; category?: string; cgpa?: number; tenthPercent?: number; twelfthPercent?: number; backlogs?: number }) =>
    apiFetch('/api/v1/admin/students', { method: 'POST', body: data }),

  // Bulk upload
  uploadStudents: (file: File, department?: string, batch?: string) => {
    const formData = new FormData();
    formData.append('file', file);
    if (department) formData.append('department', department);
    if (batch) formData.append('batch', batch);
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
  deleteCompany: (id: string) => apiFetch(`/api/v1/admin/companies/${id}`, { method: 'DELETE' }),

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

  // Batches
  listBatches: () => apiFetch('/api/v1/admin/batches'),
  createBatch: (data: { department: string; year: number; currentSemester: number }) =>
    apiFetch('/api/v1/admin/batches', { method: 'POST', body: data }),
  promoteBatch: (id: string) => apiFetch(`/api/v1/admin/batches/${id}/promote`, { method: 'POST' }),
  deleteBatch: (id: string) => apiFetch(`/api/v1/admin/batches/${id}`, { method: 'DELETE' }),

  // Departments
  listDepartments: () => apiFetch('/api/v1/admin/departments'),
  createDepartment: (data: { code: string; name: string; type?: string }) =>
    apiFetch('/api/v1/admin/departments', { method: 'POST', body: data }),
  updateDepartment: (id: string, data: { code?: string; name?: string; type?: string }) =>
    apiFetch(`/api/v1/admin/departments/${id}`, { method: 'PATCH', body: data }),
  deleteDepartment: (id: string) =>
    apiFetch(`/api/v1/admin/departments/${id}`, { method: 'DELETE' }),

  // Drives
  listDrives: () => apiFetch('/api/v1/admin/drives'),
  getDrive: (id: string) => apiFetch(`/api/v1/admin/drives/${id}`),
  createDrive: (data: {
    title: string; type: 'single' | 'multiple'; jobId?: string; jobIds?: string[];
    description?: string; driveDate?: string; departments?: string[];
  }) => apiFetch('/api/v1/admin/drives', { method: 'POST', body: data }),
  rejectDriveStudents: (driveId: string, studentIds: string[], reason?: string) =>
    apiFetch(`/api/v1/admin/drives/${driveId}/reject`, { method: 'POST', body: { studentIds, reason } }),
  approveAllDrive: (driveId: string) =>
    apiFetch(`/api/v1/admin/drives/${driveId}/approve-all`, { method: 'POST' }),
  allocateDriveSlots: (driveId: string, slots: Array<{ timeSlot: string; classroom: string; departments: string[] }>) =>
    apiFetch(`/api/v1/admin/drives/${driveId}/allocate-slots`, { method: 'POST', body: { slots } }),
  updateDriveStatus: (driveId: string, status: string) =>
    apiFetch(`/api/v1/admin/drives/${driveId}/status`, { method: 'PATCH', body: { status } }),
  deleteDrive: (id: string) => apiFetch(`/api/v1/admin/drives/${id}`, { method: 'DELETE' }),
  // Feedback
  getDriveStudentFeedback: (driveId: string) => apiFetch(`/api/v1/admin/drives/${driveId}/feedback/students`),
  getDriveCompanyFeedback: (driveId: string) => apiFetch(`/api/v1/admin/drives/${driveId}/feedback/company`),
  getDriveFeedbackSummary: (driveId: string) => apiFetch(`/api/v1/admin/drives/${driveId}/feedback/summary`),
};

// ─── Student ─────────────────────────────────────
export const studentApi = {
  getProfile: () => apiFetch('/api/v1/student/profile'),
  updateProfile: (data: Record<string, unknown>) => apiFetch('/api/v1/student/profile', { method: 'PATCH', body: data }),
  uploadProfilePhoto: (file: File) => {
    const formData = new FormData();
    formData.append('photo', file);
    return apiFetch<{ photoUrl: string }>('/api/v1/student/profile/photo', { method: 'POST', body: formData, isFormData: true });
  },
  getEligibleJobs: () => apiFetch('/api/v1/student/jobs'),
  applyForJob: (jobId: string, cvId?: string) => apiFetch('/api/v1/student/apply', { method: 'POST', body: { jobId, cvId } }),
  getApplications: () => apiFetch('/api/v1/student/applications'),
  getInterviews: () => apiFetch('/api/v1/student/interviews'),
  getAvailableDrives: () => apiFetch('/api/v1/student/drives/available'),
  registerForDrive: (driveId: string) => apiFetch(`/api/v1/student/drives/${driveId}/register`, { method: 'POST' }),
  declineDrive: (driveId: string) => apiFetch(`/api/v1/student/drives/${driveId}/decline`, { method: 'POST' }),
  getDriveAllocations: () => apiFetch('/api/v1/student/drives'),
  getNotifications: () => apiFetch('/api/v1/student/notifications'),
  markNotificationRead: (id: string) => apiFetch(`/api/v1/student/notifications/${id}/read`, { method: 'PATCH' }),
  getMeetings: () => apiFetch('/api/v1/student/meetings'),
  // Feedback
  submitDriveFeedback: (driveId: string, data: Record<string, unknown>) => apiFetch(`/api/v1/student/drives/${driveId}/feedback`, { method: 'POST', body: data }),
  getMyFeedback: () => apiFetch('/api/v1/student/feedback'),
  getPendingFeedback: () => apiFetch('/api/v1/student/feedback/pending'),
};

// ─── Company ─────────────────────────────────────
export const companyApi = {
  getDashboard: () => apiFetch('/api/v1/company/dashboard'),
  getProfile: () => apiFetch('/api/v1/company/profile'),
  updateProfile: (data: Record<string, unknown>) => apiFetch('/api/v1/company/profile', { method: 'PATCH', body: data }),
  createJob: (data: Record<string, unknown>) => apiFetch('/api/v1/company/jobs', { method: 'POST', body: data }),
  getJobs: () => apiFetch('/api/v1/company/jobs'),
  listJobs: () => apiFetch('/api/v1/company/jobs'),
  getJob: (jobId: string) => apiFetch(`/api/v1/company/jobs/${jobId}`),
  updateJob: (jobId: string, data: Record<string, unknown>) => apiFetch(`/api/v1/company/jobs/${jobId}`, { method: 'PATCH', body: data }),
  updateJobRounds: (jobId: string, roundsConfig: Record<string, unknown>[]) => apiFetch(`/api/v1/company/jobs/${jobId}/rounds`, { method: 'PATCH', body: { roundsConfig } }),
  publishJob: (jobId: string) => apiFetch(`/api/v1/company/jobs/${jobId}/publish`, { method: 'PATCH' }),
  addAvailability: (jobId: string, data: Record<string, unknown>) => apiFetch(`/api/v1/company/jobs/${jobId}/availability`, { method: 'POST', body: data }),
  getAvailability: (jobId: string) => apiFetch(`/api/v1/company/jobs/${jobId}/availability`),
  getCandidates: (jobId: string) => apiFetch(`/api/v1/company/jobs/${jobId}/candidates`),
  getDrives: () => apiFetch('/api/v1/company/drives'),
  markAttendance: (slotId: string, attendance: string) => apiFetch('/api/v1/company/attendance', { method: 'PATCH', body: { slotId, attendance } }),
  markRoundResult: (slotId: string, result: string) => apiFetch('/api/v1/company/round-result', { method: 'PATCH', body: { slotId, result } }),
  submitRoundResults: (jobId: string, round: number, selectedStudentIds: string[]) =>
    apiFetch(`/api/v1/company/jobs/${jobId}/submit-round-results`, { method: 'POST', body: { round, selectedStudentIds } }),
  getStudentProfile: (studentId: string) =>
    apiFetch(`/api/v1/company/students/${studentId}`),
  // Meetings
  createRoundMeeting: (data: Record<string, unknown>) =>
    apiFetch('/api/v1/company/meetings', { method: 'POST', body: data }),
  getRoundMeetings: (jobId: string) =>
    apiFetch(`/api/v1/company/jobs/${jobId}/meetings`),
  getRoundMeeting: (meetingId: string) =>
    apiFetch(`/api/v1/company/meetings/${meetingId}`),
  updateRoundMeeting: (meetingId: string, data: Record<string, unknown>) =>
    apiFetch(`/api/v1/company/meetings/${meetingId}`, { method: 'PATCH', body: data }),
  deleteRoundMeeting: (meetingId: string) =>
    apiFetch(`/api/v1/company/meetings/${meetingId}`, { method: 'DELETE' }),
  // Feedback
  submitStudentFeedback: (driveId: string, studentId: string, data: Record<string, unknown>) =>
    apiFetch(`/api/v1/company/drives/${driveId}/students/${studentId}/feedback`, { method: 'POST', body: data }),
  getDriveFeedback: (driveId: string) => apiFetch(`/api/v1/company/drives/${driveId}/feedback`),
};

export { ApiError, getToken, removeToken, getStoredUser };
