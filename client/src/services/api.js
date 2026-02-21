import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

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
  
  // Courses
  getCourses: async () => {
    const response = await axios.get(`${API_URL}/courses`);
    return response.data;
  }
};

export default api;