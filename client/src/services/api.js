import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
const EXAM_PREP_BASE = `${API_URL}/exam-preparation`;

const http = axios.create({
  baseURL: API_URL,
  timeout: 15000
});

const isNotFound = (error) => error?.response?.status === 404;

const toExamFormData = (payload) => {
  const formData = new FormData();
  const {
    lecturePdfFiles = [],
    lecturePdfs = [],
    ...rest
  } = payload || {};

  Object.entries(rest).forEach(([key, value]) => {
    if (value === undefined || value === null) {
      formData.append(key, '');
      return;
    }
    formData.append(key, String(value));
  });

  formData.append('lecturePdfs', JSON.stringify(lecturePdfs));
  lecturePdfFiles.forEach((file) => {
    formData.append('lecturePdfs', file);
  });

  return formData;
};

const api = {
  // Events (optional timetableKey for split-student timetables)
  getEvents: async (timetableKey = 'default') => {
    const response = await http.get('/events', { params: { timetableKey } });
    return response.data;
  },

  createEvent: async (event) => {
    const response = await http.post('/events', event);
    return response.data;
  },

  // Timetable versions (falls back if endpoint is not implemented)
  getTimetables: async () => {
    try {
      const response = await http.get('/timetables');
      return response.data;
    } catch (error) {
      if (isNotFound(error)) return [{ key: 'default', name: 'My Week' }];
      throw error;
    }
  },

  updateEvent: async (id, event) => {
    const response = await http.put(`/events/${id}`, event);
    return response.data;
  },

  deleteEvent: async (id) => {
    const response = await http.delete(`/events/${id}`);
    return response.data;
  },

  // Exam Preparation
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
    const response = await axios.post(EXAM_PREP_BASE, toExamFormData(payload), {
      headers: {
        'Content-Type': 'multipart/form-data'
      },
      timeout: 15000
    });
    return response.data?.data ?? response.data;
  },

  updateExamPreparation: async (id, payload) => {
    const response = await axios.put(`${EXAM_PREP_BASE}/${id}`, toExamFormData(payload), {
      headers: {
        'Content-Type': 'multipart/form-data'
      },
      timeout: 15000
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

  // Courses for current timetable only (no past subjects in new timetable)
  getCourses: async (timetableKey = 'default') => {
    try {
      const response = await http.get(`/timetables/${encodeURIComponent(timetableKey)}/courses`);
      return response.data;
    } catch (error) {
      if (isNotFound(error)) return [];
      throw error;
    }
  },

  // Attendance (per timetable)
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
    await http.delete(`/attendance/${id}`);
  }
};

export default api;
