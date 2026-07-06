import api from './axios';

export const authAPI = {
  login: (data) => api.post('/auth/login', data),
  register: (data) => api.post('/auth/register', data),
  forgotPassword: (data) => api.post('/auth/forgot-password', data),
  logout: () => api.post('/auth/logout'),
  getMe: () => api.get('/auth/me'),
};

export const employeeAPI = {
  getAll: (params) => api.get('/employees', { params }),
  getOne: (id) => api.get(`/employees/${id}`),
  create: (data) => api.post('/employees', data),
  approve: (id) => api.put(`/employees/${id}/approve`),
  reject: (id) => api.put(`/employees/${id}/reject`),
  deactivate: (id) => api.put(`/employees/${id}/deactivate`),
  activate: (id) => api.put(`/employees/${id}/activate`),
  delete: (id) => api.delete(`/employees/${id}`),
  resetPassword: (id, data) => api.put(`/employees/${id}/reset-password`, data),
  export: () => api.get('/employees/export', { responseType: 'blob' }),
};

export const candidateAPI = {
  getAll: (params) => api.get('/candidates', { params }),
  getMy: () => api.get('/candidates/my'),
  getOne: (id) => api.get(`/candidates/${id}`),
  create: (data) => api.post('/candidates', data),
  update: (id, data) => api.put(`/candidates/${id}`, data),
  delete: (id) => api.delete(`/candidates/${id}`),
};

export const assignmentAPI = {
  getAll: (params) => api.get('/assignments', { params }),
  getMy: () => api.get('/assignments/my'),
  assign: (data) => api.post('/assignments', data),
  sync: (data) => api.put('/assignments/sync', data),
  remove: (id) => api.delete(`/assignments/${id}`),
  reassign: (data) => api.put('/assignments/reassign', data),
};

export const attendanceAPI = {
  startWork: (data) => api.post('/attendance/start', data),
  endWork: (data) => api.post('/attendance/end', data),
  mark: (data) => api.post('/attendance/start', data),
  getMy: (params) => api.get('/attendance/my', { params }),
  getToday: () => api.get('/attendance/today'),
  getAll: (params) => api.get('/attendance', { params }),
  getMonthlySummary: (params) => api.get('/attendance/monthly-summary', { params }),
  getStats: () => api.get('/attendance/stats'),
  export: (params) => api.get('/attendance/export', { params, responseType: 'blob' }),
};

export const dprAPI = {
  submit: (data) => api.post('/dpr', data),
  getMy: (params) => api.get('/dpr/my', { params }),
  getAll: (params) => api.get('/dpr', { params }),
  getGrouped: (params) => api.get('/dpr', { params: { ...params, grouped: 'true' } }),
  update: (id, data) => api.put(`/dpr/${id}`, data),
  exportCSV: (params) => api.get('/dpr/export/csv', { params, responseType: 'blob' }),
  exportPDF: (params) => api.get('/dpr/export/pdf', { params, responseType: 'blob' }),
};

export const dashboardAPI = {
  getAdmin: () => api.get('/dashboard/admin'),
  getEmployee: () => api.get('/dashboard/employee'),
};

export const settingsAPI = {
  get: () => api.get('/settings'),
  getClientIP: () => api.get('/client-ip'),
  update: (data) => api.put('/settings', data),
};

export const notificationAPI = {
  getAll: (params) => api.get('/notifications', { params }),
  markRead: (id) => api.put(`/notifications/${id}/read`),
  markAllRead: () => api.put('/notifications/read-all'),
};

export const profileAPI = {
  update: (data) => {
    if (data instanceof FormData) {
      return api.put('/profile', data, { headers: { 'Content-Type': 'multipart/form-data' } });
    }
    return api.put('/profile', data);
  },
};
