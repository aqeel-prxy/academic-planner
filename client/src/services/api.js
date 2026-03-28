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
  
  // Modules
  getModules: async () => {
    try {
      console.log('Fetching modules...');
      const response = await axios.get(`${API_URL}/modules`);
      console.log('Modules fetched:', response.data);
      // Handle both array and object { value: [...] } formats
      const modules = Array.isArray(response.data) ? response.data : (response.data.value || response.data);
      console.log('Processed modules:', modules);
      return modules;
    } catch (error) {
      console.error('Error fetching modules:', error.message);
      throw error;
    }
  },
  
  getModulesBySemester: async (semester, year) => {
    const response = await axios.get(`${API_URL}/modules/semester`, {
      params: { semester, year }
    });
    return response.data;
  },
  
  getModuleById: async (id) => {
    const response = await axios.get(`${API_URL}/modules/${id}`);
    return response.data;
  },
  
  createModule: async (module) => {
    try {
      console.log('Creating module with data:', module);
      const response = await axios.post(`${API_URL}/modules`, module);
      console.log('Module creation response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Module creation error:', error.response?.data || error.message);
      throw error;
    }
  },
  
  updateModule: async (id, module) => {
    const response = await axios.put(`${API_URL}/modules/${id}`, module);
    return response.data;
  },
  
  deleteModule: async (id) => {
    const response = await axios.delete(`${API_URL}/modules/${id}`);
    return response.data;
  },
  
  // Grades
  getGrades: async () => {
    const response = await axios.get(`${API_URL}/grades`);
    return response.data;
  },
  
  getGradesByModule: async (moduleId) => {
    const response = await axios.get(`${API_URL}/grades/module/${moduleId}`);
    return response.data;
  },
  
  getGradesBySemester: async (semester) => {
    const response = await axios.get(`${API_URL}/grades/semester/${semester}`);
    return response.data;
  },
  
  createGrade: async (grade) => {
    const response = await axios.post(`${API_URL}/grades`, grade);
    return response.data;
  },
  
  updateGrade: async (id, grade) => {
    const response = await axios.put(`${API_URL}/grades/${id}`, grade);
    return response.data;
  },
  
  deleteGrade: async (id) => {
    const response = await axios.delete(`${API_URL}/grades/${id}`);
    return response.data;
  },
  
  getGPAStatistics: async (semester) => {
    const response = await axios.get(`${API_URL}/grades/stats/gpa`, {
      params: { semester }
    });
    return response.data;
  },
  
  getGPATrend: async () => {
    const response = await axios.get(`${API_URL}/grades/stats/trend`);
    return response.data;
  },
  
  getRiskAnalysis: async (semester) => {
    const response = await axios.get(`${API_URL}/grades/stats/risk`, {
      params: { semester }
    });
    return response.data;
  },
  
  // Courses
  getCourses: async () => {
    const response = await axios.get(`${API_URL}/courses`);
    return response.data;
  },

  // Module organizer (lectures, labs, tutorials, notes)
  getModuleResources: async (moduleId) => {
    const response = await axios.get(`${API_URL}/module-resources`, {
      params: { moduleId }
    });
    return response.data;
  },

  createModuleResource: async (payload) => {
    const response = await axios.post(`${API_URL}/module-resources`, payload);
    return response.data;
  },

  /** multipart/form-data; field name for file: `document` */
  createModuleResourceForm: async (formData) => {
    const response = await axios.post(`${API_URL}/module-resources`, formData);
    return response.data;
  },

  updateModuleResource: async (id, payload) => {
    const response = await axios.put(`${API_URL}/module-resources/${id}`, payload);
    return response.data;
  },

  updateModuleResourceForm: async (id, formData) => {
    const response = await axios.put(`${API_URL}/module-resources/${id}`, formData);
    return response.data;
  },

  deleteModuleResource: async (id) => {
    const response = await axios.delete(`${API_URL}/module-resources/${id}`);
    return response.data;
  },

  getModuleResourceDownloadUrl: (id) => `${API_URL}/module-resources/${id}/download`
};

export default api;