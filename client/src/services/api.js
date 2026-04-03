import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const EXAM_PREP_BASE = `${API_URL}/exam-preparation`;

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
    const response = await axios.get(`${API_URL}/events`, { params: { timetableKey } });
    return response.data;
  },

  createEvent: async (event) => {
    const response = await axios.post(`${API_URL}/events`, event);
    return response.data;
  },

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

  // Assignments (Academic Hub)
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
  },

  // Exam preparation
  getExamPreparations: async () => {
    const response = await axios.get(EXAM_PREP_BASE);
    return response.data?.data ?? response.data;
  },

  getUpcomingExams: async () => {
    const response = await axios.get(`${EXAM_PREP_BASE}/upcoming`);
    return response.data?.data ?? response.data;
  },

  getExamPreparationById: async (id) => {
    const response = await axios.get(`${EXAM_PREP_BASE}/${id}`);
    return response.data?.data ?? response.data;
  },

  createExamPreparation: async (payload) => {
    const response = await axios.post(EXAM_PREP_BASE, toExamFormData(payload), {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  },

  updateExamPreparation: async (id, payload) => {
    const response = await axios.put(`${EXAM_PREP_BASE}/${id}`, toExamFormData(payload), {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  },

  updateExamPdfStatus: async (examId, pdfId, completed) => {
    const response = await axios.patch(`${EXAM_PREP_BASE}/${examId}/pdfs/${pdfId}`, { completed });
    return response.data;
  },

  deleteExamPdf: async (examId, pdfId) => {
    const response = await axios.delete(`${EXAM_PREP_BASE}/${examId}/pdfs/${pdfId}`);
    return response.data;
  },

  deleteExamPreparation: async (id) => {
    const response = await axios.delete(`${EXAM_PREP_BASE}/${id}`);
    return response.data;
  },

  // Modules (GPA / organizer)
  getModules: async () => {
    const response = await axios.get(`${API_URL}/modules`);
    const data = response.data;
    return Array.isArray(data) ? data : (data?.value || data);
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
    const response = await axios.post(`${API_URL}/modules`, module);
    return response.data;
  },

  updateModule: async (id, module) => {
    const response = await axios.put(`${API_URL}/modules/${id}`, module);
    return response.data;
  },

  deleteModule: async (id) => {
    const response = await axios.delete(`${API_URL}/modules/${id}`);
    return response.data;
  },

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

  getTimetableCourses: async (timetableKey = 'default') => {
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
