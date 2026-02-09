/**
 * API Service
 * Axios instance dan fungsi untuk komunikasi dengan backend
 */
import axios from 'axios';

// Base API instance
const api = axios.create({
    baseURL: '/api',
    headers: {
        'Content-Type': 'application/json'
    }
});

// ============================================
// Member API
// ============================================
export const memberAPI = {
    // Get all members
    getAll: (params) => api.get('/members', { params }),

    // Get member by ID
    getById: (id) => api.get(`/members/${id}`),

    // Get classes list
    getClasses: () => api.get('/members/classes'),

    // Create member (with FormData for photo upload)
    create: (formData) => api.post('/members', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    }),

    // Update member
    update: (id, formData) => api.put(`/members/${id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    }),

    // Delete member
    delete: (id) => api.delete(`/members/${id}`)
};

// ============================================
// Card API
// ============================================
export const cardAPI = {
    // Get all cards
    getAll: (params) => api.get('/cards', { params }),

    // Get card by ID
    getById: (id) => api.get(`/cards/${id}`),

    // Create card
    create: (data) => api.post('/cards', data),

    // Pair card with member
    pair: (id, memberId) => api.put(`/cards/${id}/pair`, { member_id: memberId }),

    // Toggle card status
    toggle: (id) => api.put(`/cards/${id}/toggle`),

    // Delete card
    delete: (id) => api.delete(`/cards/${id}`)
};

// ============================================
// Attendance API
// ============================================
export const attendanceAPI = {
    // Get attendance logs with filters
    getAll: (params) => api.get('/attendance', { params }),

    // Get today's attendance (live feed)
    getToday: (limit = 10) => api.get('/attendance/today', { params: { limit } }),

    // Get today's stats
    getStats: () => api.get('/attendance/stats'),

    // Get member attendance history
    getMemberHistory: (memberId, params) => api.get(`/attendance/member/${memberId}`, { params })
};

// ============================================
// IoT API (untuk testing)
// ============================================
export const iotAPI = {
    // Get IoT endpoint status
    getStatus: () => api.get('/iot/status'),

    // Simulate card scan
    scan: (rfid_uid, device_id = 'WEB') => api.post('/iot/scan', { rfid_uid, device_id })
};

export default api;
