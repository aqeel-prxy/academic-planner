import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = {
  // Events (optional timetableKey for split-student timetables)
  getEvents: async (timetableKey = 'default') => {
    const response = await axios.get(`${API_URL}/events`, { params: { timetableKey } });
    return response.data;
  },

  createEvent: async (event) => {
    const response = await axios.post(`${API_URL}/events`, event);
    return response.data;
  },

  // Timetable versions (e.g. My Week, Weekend 5.1, 5.2)
  getTimetables: async () => {
    const response = await axios.get(`${API_URL}/timetables`);
    return response.data;
  },
  
  updateEvent: async (id, event) => {
    const response = await axios.put(`${API_URL}/events/${id}`, event);
    return response.data;
  },
  
  deleteEvent: async (id) => {
    const response = await axios.delete(`${API_URL}/events/${id}`);
    return response.data;
  },
  
  // Courses for current timetable only (no past subjects in new timetable)
  getCourses: async (timetableKey = 'default') => {
    const response = await axios.get(`${API_URL}/timetables/${encodeURIComponent(timetableKey)}/courses`);
    return response.data;
  },

  // Attendance (per timetable)
  getAttendance: async (timetableKey = 'default') => {
    const response = await axios.get(`${API_URL}/attendance`, { params: { timetableKey } });
    return response.data;
  },
  upsertAttendance: async (data) => {
    const response = await axios.post(`${API_URL}/attendance`, data);
    return response.data;
  },
  updateAttendance: async (id, data) => {
    const response = await axios.put(`${API_URL}/attendance/${id}`, data);
    return response.data;
  },
  deleteAttendance: async (id) => {
    await axios.delete(`${API_URL}/attendance/${id}`);
  },

  // Exam preparation
  getExamPreparations: async () => {
    const response = await axios.get(`${API_URL}/exam-preparation`);
    return response.data;
  },
  getExamPreparationById: async (id) => {
    const response = await axios.get(`${API_URL}/exam-preparation/${id}`);
    return response.data?.data || response.data;
  },
  createExamPreparation: async (payload) => {
    const response = await axios.post(`${API_URL}/exam-preparation`, payload);
    return response.data?.data || response.data;
  },
  updateExamPreparation: async (id, payload) => {
    const response = await axios.put(`${API_URL}/exam-preparation/${id}`, payload);
    return response.data?.data || response.data;
  },
  deleteExamPreparation: async (id) => {
    const response = await axios.delete(`${API_URL}/exam-preparation/${id}`);
    return response.data;
  }
};

export default api;