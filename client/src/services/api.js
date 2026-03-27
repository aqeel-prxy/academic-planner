import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

const api = {
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

  getTimetables: async () => ([
    { key: 'default', name: 'My Week' }
  ]),

  getAssignments: async (params = {}) => {
    const response = await axios.get(`${API_URL}/assignments`, { params });
    return response.data;
  },

  getAssignmentSummary: async () => {
    const response = await axios.get(`${API_URL}/assignments/summary`);
    return response.data;
  },

  getAssignmentById: async (id) => {
    const response = await axios.get(`${API_URL}/assignments/${id}`);
    return response.data;
  },

  createAssignment: async (assignment) => {
    const response = await axios.post(`${API_URL}/assignments`, assignment);
    return response.data;
  },

  updateAssignment: async (id, assignment) => {
    const response = await axios.put(`${API_URL}/assignments/${id}`, assignment);
    return response.data;
  },

  deleteAssignment: async (id) => {
    const response = await axios.delete(`${API_URL}/assignments/${id}`);
    return response.data;
  }
};

export default api;
