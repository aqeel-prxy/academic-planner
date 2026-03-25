import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const EXAM_PREP_BASE = `${API_URL}/exam-preparation`;

const api = {
  // Events
  getEvents: async () => {
    const response = await axios.get(`${API_URL}/events`);
    return response.data;
  },
  
  createEvent: async (event) => {
    const response = await axios.post(`${API_URL}/events`, event);
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

  // Exam Preparation
  getExamPreparations: async () => {
    const response = await axios.get(EXAM_PREP_BASE);
    return response.data;
  },

  getUpcomingExams: async () => {
    const response = await axios.get(`${EXAM_PREP_BASE}/upcoming`);
    return response.data;
  },

  createExamPreparation: async (payload) => {
    const response = await axios.post(EXAM_PREP_BASE, payload);
    return response.data;
  },

  updateExamPreparation: async (id, payload) => {
    const response = await axios.put(`${EXAM_PREP_BASE}/${id}`, payload);
    return response.data;
  },

  deleteExamPreparation: async (id) => {
    const response = await axios.delete(`${EXAM_PREP_BASE}/${id}`);
    return response.data;
  },
  
  // Courses
  getCourses: async () => {
    const response = await axios.get(`${API_URL}/courses`);
    return response.data;
  }
};

export default api;