import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
const EXAM_PREP_BASE = `${API_URL}/exam-preparation`;

const http = axios.create({
  baseURL: API_URL,
  timeout: 15000,
});

const isNotFound = (error) => error?.response?.status === 404;

const toExamFormData = (payload) => {
  const formData = new FormData();
  const { lecturePdfFiles = [], lecturePdfs = [], ...rest } = payload || {};

  Object.entries(rest).forEach(([key, value]) => {
    formData.append(key, value == null ? '' : String(value));
  });

  formData.append('lecturePdfs', JSON.stringify(lecturePdfs));
  lecturePdfFiles.forEach((file) => {
    formData.append('lecturePdfs', file);
  });

  return formData;
};

const api = {
  // Events
  getEvents: async (timetableKey = 'default') => {
    const response = await http.get('/events', { params: { timetableKey } });
    return response.data;
  },

  createEvent: async (event) => {
    const response = await http.post('/events', event);
    return response.data;
  },

  updateEvent: async (id, event) => {
    const response = await http.put(`/events/${id}`, event);
    return response.data;
  },

  deleteEvent: async (id) => {
    const response = await http.delete(`/events/${id}`);
    return response.data;
  },

  // Timetables
  getTimetables: async () => {
    try {
      const response = await http.get('/timetables');
      const data = response.data;
      return Array.isArray(data) ? data : [];
    } catch (error) {
      if (isNotFound(error)) return [{ key: 'default', name: 'My Week' }];
      throw error;
    }
  },

  getTimetableCourses: async (timetableKey = 'default') => {
    try {
      const response = await http.get(`/timetables/${encodeURIComponent(timetableKey)}/courses`);
      return response.data;
    } catch (error) {
      if (isNotFound(error)) return [];
      throw error;
    }
  },

  // Exam preparation
  getExamPreparations: async () => {
    const response = await http.get('/exam-preparation');
    return response.data?.data ?? response.data;
  },

  getUpcomingExams: async () => {
    const response = await http.get('/exam-preparation/upcoming');
    return response.data?.data ?? response.data;
  },

  getExamPreparationById: async (id) => {
    const response = await http.get(`/exam-preparation/${id}`);
    return response.data?.data ?? response.data;
  },

  createExamPreparation: async (payload) => {
    const response = await http.post(EXAM_PREP_BASE, toExamFormData(payload), {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data?.data ?? response.data;
  },

  updateExamPreparation: async (id, payload) => {
    const response = await http.put(`${EXAM_PREP_BASE}/${id}`, toExamFormData(payload), {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data?.data ?? response.data;
  },

  updateExamPdfStatus: async (examId, pdfId, completed) => {
    const response = await http.patch(`/exam-preparation/${examId}/pdfs/${pdfId}`, { completed });
    return response.data;
  },

  deleteExamPdf: async (examId, pdfId) => {
    const response = await http.delete(`/exam-preparation/${examId}/pdfs/${pdfId}`);
    return response.data;
  },

  deleteExamPreparation: async (id) => {
    const response = await http.delete(`/exam-preparation/${id}`);
    return response.data;
  },

  askExamAiQuestion: async (examId, question) => {
    const response = await http.post(`/exam-preparation/${examId}/ai-chat/ask`, { question });
    return response.data;
  },

  getExamAiChatHistory: async (examId) => {
    const response = await http.get(`/exam-preparation/${examId}/ai-chat/history`);
    return response.data;
  },

  clearExamAiChatHistory: async (examId) => {
    const response = await http.delete(`/exam-preparation/${examId}/ai-chat/history`);
    return response.data;
  },

  // Assignments
  getAssignments: async (params = {}) => {
    const response = await http.get('/assignments', { params });
    return response.data;
  },

  getAssignmentSummary: async () => {
    const response = await http.get('/assignments/summary');
    return response.data;
  },

  getAssignmentById: async (id) => {
    const response = await http.get(`/assignments/${id}`);
    return response.data;
  },

  createAssignment: async (assignment) => {
    const response = await http.post('/assignments', assignment);
    return response.data;
  },

  updateAssignment: async (id, assignment) => {
    const response = await http.put(`/assignments/${id}`, assignment);
    return response.data;
  },

  deleteAssignment: async (id) => {
    const response = await http.delete(`/assignments/${id}`);
    return response.data;
  },

  // Modules
  getModules: async () => {
    const response = await http.get('/modules');
    const data = response.data;
    return Array.isArray(data) ? data : (data?.value || data);
  },

  getModulesBySemester: async (semester, year) => {
    const response = await http.get('/modules/semester', { params: { semester, year } });
    return response.data;
  },

  getModuleById: async (id) => {
    const response = await http.get(`/modules/${id}`);
    return response.data;
  },

  createModule: async (module) => {
    const response = await http.post('/modules', module);
    return response.data;
  },

  updateModule: async (id, module) => {
    const response = await http.put(`/modules/${id}`, module);
    return response.data;
  },

  deleteModule: async (id) => {
    const response = await http.delete(`/modules/${id}`);
    return response.data;
  },

  // Grades
  getGrades: async () => {
    const response = await http.get('/grades');
    return response.data;
  },

  getGradesByModule: async (moduleId) => {
    const response = await http.get(`/grades/module/${moduleId}`);
    return response.data;
  },

  getGradesBySemester: async (semester) => {
    const response = await http.get(`/grades/semester/${semester}`);
    return response.data;
  },

  createGrade: async (grade) => {
    const response = await http.post('/grades', grade);
    return response.data;
  },

  updateGrade: async (id, grade) => {
    const response = await http.put(`/grades/${id}`, grade);
    return response.data;
  },

  deleteGrade: async (id) => {
    const response = await http.delete(`/grades/${id}`);
    return response.data;
  },

  getGPAStatistics: async (semester) => {
    const response = await http.get('/grades/stats/gpa', { params: { semester } });
    return response.data;
  },

  getGPATrend: async () => {
    const response = await http.get('/grades/stats/trend');
    return response.data;
  },

  getRiskAnalysis: async (semester) => {
    const response = await http.get('/grades/stats/risk', { params: { semester } });
    return response.data;
  },

  // Module organizer
  getModuleResources: async (moduleId) => {
    const response = await http.get('/module-resources', { params: { moduleId } });
    return response.data;
  },

  createModuleResource: async (payload) => {
    const response = await http.post('/module-resources', payload);
    return response.data;
  },

  createModuleResourceForm: async (formData) => {
    const response = await http.post('/module-resources', formData);
    return response.data;
  },

  updateModuleResource: async (id, payload) => {
    const response = await http.put(`/module-resources/${id}`, payload);
    return response.data;
  },

  updateModuleResourceForm: async (id, formData) => {
    const response = await http.put(`/module-resources/${id}`, formData);
    return response.data;
  },

  deleteModuleResource: async (id) => {
    const response = await http.delete(`/module-resources/${id}`);
    return response.data;
  },

  getModuleResourceDownloadUrl: (id) => `${API_URL}/module-resources/${id}/download`,

  // Attendance
  getAttendance: async (timetableKey = 'default') => {
    try {
      const response = await http.get('/attendance', { params: { timetableKey } });
      return response.data;
    } catch (error) {
      if (isNotFound(error)) return [];
      throw error;
    }
  },

  upsertAttendance: async (data) => {
    const response = await http.post('/attendance', data);
    return response.data;
  },

  updateAttendance: async (id, data) => {
    const response = await http.put(`/attendance/${id}`, data);
    return response.data;
  },

  deleteAttendance: async (id) => {
    const response = await http.delete(`/attendance/${id}`);
    return response.data;
  },
};

export default api;
