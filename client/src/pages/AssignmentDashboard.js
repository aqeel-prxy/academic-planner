import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Button, Form, Spinner, Toast, ToastContainer } from 'react-bootstrap';
import AssignmentFormModal from '../components/assignments/AssignmentFormModal';
import AssignmentDetailsModal from '../components/assignments/AssignmentDetailsModal';
import api from '../services/api';
import './AssignmentDashboard.css';

const STATUS_OPTIONS = ['All', 'Pending', 'Completed', 'Overdue'];
const PRIORITY_OPTIONS = ['All', 'High', 'Medium', 'Low'];
const SORT_OPTIONS = [
  { value: 'dueDate', label: 'Nearest due date' },
  { value: 'priority', label: 'Highest priority' },
  { value: 'course', label: 'Course' },
  { value: 'title', label: 'Title' }
];

const formatDate = (value) => new Intl.DateTimeFormat('en-GB', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit'
}).format(new Date(value));

const getStatusTone = (status) => {
  if (status === 'Completed') return 'completed';
  if (status === 'Overdue') return 'overdue';
  return 'pending';
};

const getRequestErrorMessage = (error, fallbackMessage) => {
  if (!error.response) {
    return 'Assignment service is not reachable. Start the backend server on port 5000 and try again.';
  }

  const serverErrors = error.response.data?.errors;
  if (serverErrors?.length) {
    return serverErrors.map((item) => item.msg).join(', ');
  }

  return error.response.data?.error || fallbackMessage;
};

const AssignmentDashboard = () => {
  const [assignments, setAssignments] = useState([]);
  const [summary, setSummary] = useState({ total: 0, pending: 0, completed: 0, overdue: 0 });
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [priorityFilter, setPriorityFilter] = useState('All');
  const [sortBy, setSortBy] = useState('dueDate');
  const [viewMode, setViewMode] = useState('card');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [detailsAssignment, setDetailsAssignment] = useState(null);

  const loadAssignments = useCallback(async () => {
    setIsLoading(true);
    setError('');

    try {
      const params = {
        search: search || undefined,
        status: statusFilter === 'All' ? undefined : statusFilter,
        priority: priorityFilter === 'All' ? undefined : priorityFilter,
        sortBy
      };

      const [assignmentData, summaryData] = await Promise.all([
        api.getAssignments(params),
        api.getAssignmentSummary()
      ]);

      setAssignments(assignmentData);
      setSummary(summaryData);
    } catch (loadError) {
      setError(getRequestErrorMessage(loadError, 'Failed to load assignments.'));
    } finally {
      setIsLoading(false);
    }
  }, [priorityFilter, search, sortBy, statusFilter]);

  useEffect(() => {
    loadAssignments();
  }, [loadAssignments]);

  const courseOptions = useMemo(() => {
    const courses = assignments.map((assignment) => assignment.course);
    return Array.from(new Set(courses)).sort((a, b) => a.localeCompare(b));
  }, [assignments]);

  const summaryCards = [
    { label: 'Total assignments', value: summary.total, tone: 'neutral' },
    { label: 'Pending', value: summary.pending, tone: 'pending' },
    { label: 'Completed', value: summary.completed, tone: 'completed' },
    { label: 'Overdue', value: summary.overdue, tone: 'overdue' }
  ];

  const openCreateModal = () => {
    setSelectedAssignment(null);
    setShowForm(true);
  };

  const openEditModal = (assignment) => {
    setSelectedAssignment(assignment);
    setDetailsAssignment(null);
    setShowForm(true);
  };

  const handleSaveAssignment = async (payload) => {
    setIsSaving(true);
    setError('');

    try {
      if (payload.id) {
        await api.updateAssignment(payload.id, payload);
        setToast({ message: 'Assignment updated successfully.', tone: 'success' });
      } else {
        await api.createAssignment(payload);
        setToast({ message: 'Assignment created successfully.', tone: 'success' });
      }

      setShowForm(false);
      setSelectedAssignment(null);
      await loadAssignments();
    } catch (saveError) {
      const message = getRequestErrorMessage(saveError, 'Failed to save assignment.');
      setError(message);
      setToast({ message, tone: 'error' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteAssignment = async (assignmentId) => {
    setIsSaving(true);

    try {
      await api.deleteAssignment(assignmentId);
      setDetailsAssignment(null);
      setToast({ message: 'Assignment deleted.', tone: 'success' });
      await loadAssignments();
    } catch (deleteError) {
      setToast({ message: getRequestErrorMessage(deleteError, 'Failed to delete assignment.'), tone: 'error' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleStatus = async (assignment) => {
    setIsSaving(true);

    try {
      const nextStatus = assignment.status === 'Completed' ? 'Pending' : 'Completed';
      const updated = await api.updateAssignment(assignment.id, { status: nextStatus });
      setDetailsAssignment(updated);
      setToast({
        message: nextStatus === 'Completed' ? 'Assignment marked as completed.' : 'Assignment reopened for editing.',
        tone: 'success'
      });
      await loadAssignments();
    } catch (statusError) {
      setToast({ message: getRequestErrorMessage(statusError, 'Failed to update assignment status.'), tone: 'error' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleChecklistToggle = async (assignment, itemId) => {
    const checklist = assignment.checklist.map((item) => (
      item.id === itemId ? { ...item, completed: !item.completed } : item
    ));

    setIsSaving(true);

    try {
      const updated = await api.updateAssignment(assignment.id, { checklist });
      setDetailsAssignment(updated);
      setToast({ message: 'Checklist progress updated.', tone: 'success' });
      await loadAssignments();
    } catch (checklistError) {
      setToast({ message: getRequestErrorMessage(checklistError, 'Failed to update checklist.'), tone: 'error' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="assignment-dashboard-page">
      <section className="assignment-hero">
        <div className="hero-copy">
          <span className="hero-kicker">Assignment Management System</span>
          <h1>Keep deadlines visible and coursework under control.</h1>
          <p>
            Track every assignment in one workspace, break work into checklist items, and focus attention on what is urgent without losing sight of completed progress.
          </p>
        </div>
        <div className="hero-actions">
          <Button className="primary-cta" onClick={openCreateModal}>Add assignment</Button>
          <div className="hero-inline-note">Due dates, priorities, attachments, and status updates sync with the backend.</div>
        </div>
      </section>

      <section className="summary-grid">
        {summaryCards.map((card) => (
          <article key={card.label} className={`summary-card tone-${card.tone}`}>
            <span>{card.label}</span>
            <strong>{card.value}</strong>
          </article>
        ))}
      </section>

      <section className="assignment-controls">
        <div className="search-panel">
          <label htmlFor="assignment-search">Search assignments</label>
          <input id="assignment-search" type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search by title or course" />
        </div>
        <div className="filter-row">
          <Form.Select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
            {STATUS_OPTIONS.map((status) => <option key={status} value={status}>{status} status</option>)}
          </Form.Select>
          <Form.Select value={priorityFilter} onChange={(event) => setPriorityFilter(event.target.value)}>
            {PRIORITY_OPTIONS.map((priority) => <option key={priority} value={priority}>{priority} priority</option>)}
          </Form.Select>
          <Form.Select value={sortBy} onChange={(event) => setSortBy(event.target.value)}>
            {SORT_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
          </Form.Select>
          <div className="view-toggle">
            <button type="button" className={viewMode === 'card' ? 'active' : ''} onClick={() => setViewMode('card')}>Cards</button>
            <button type="button" className={viewMode === 'table' ? 'active' : ''} onClick={() => setViewMode('table')}>Table</button>
          </div>
        </div>
      </section>

      {error && <Alert variant="danger" className="assignment-alert">{error}</Alert>}

      {isLoading ? (
        <div className="assignment-loading-state">
          <Spinner animation="border" />
          <span>Loading assignments...</span>
        </div>
      ) : assignments.length === 0 ? (
        <section className="empty-state-card">
          <div className="empty-state-illustration">+</div>
          <h2>No assignments match this view.</h2>
          <p>Add your first assignment or adjust the current filters to see coursework here.</p>
          <Button onClick={openCreateModal}>Create assignment</Button>
        </section>
      ) : viewMode === 'card' ? (
        <section className="assignment-card-grid">
          {assignments.map((assignment) => (
            <article key={assignment.id} className={`assignment-card tone-${getStatusTone(assignment.status)}`} onClick={() => setDetailsAssignment(assignment)}>
              <div className="assignment-card-top">
                <div>
                  <div className="assignment-card-course">{assignment.course}</div>
                  <h2>{assignment.title}</h2>
                </div>
                <span className={`assignment-status-badge status-${assignment.status.toLowerCase()}`}>{assignment.status}</span>
              </div>
              <div className="assignment-card-meta">
                <span>Due {formatDate(assignment.dueDate)}</span>
                <span>{assignment.weighting}% weighting</span>
              </div>
              <div className="assignment-card-tags">
                <span className="priority-pill">{assignment.priority} priority</span>
                <span className="progress-pill">{assignment.progress}% checklist progress</span>
              </div>
              <p>{assignment.description || 'Open for full details, checklist tracking, and completion controls.'}</p>
            </article>
          ))}
        </section>
      ) : (
        <section className="assignment-table-shell">
          <table className="assignment-table">
            <thead>
              <tr>
                <th>Assignment</th>
                <th>Course</th>
                <th>Due date</th>
                <th>Weighting</th>
                <th>Priority</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {assignments.map((assignment) => (
                <tr key={assignment.id} className={`row-${getStatusTone(assignment.status)}`} onClick={() => setDetailsAssignment(assignment)}>
                  <td>{assignment.title}</td>
                  <td>{assignment.course}</td>
                  <td>{formatDate(assignment.dueDate)}</td>
                  <td>{assignment.weighting}%</td>
                  <td>{assignment.priority}</td>
                  <td><span className={`assignment-status-badge status-${assignment.status.toLowerCase()}`}>{assignment.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      <AssignmentFormModal
        show={showForm}
        onHide={() => {
          setShowForm(false);
          setSelectedAssignment(null);
        }}
        onSubmit={handleSaveAssignment}
        assignment={selectedAssignment}
        courseOptions={courseOptions}
        isSubmitting={isSaving}
      />

      <AssignmentDetailsModal
        show={Boolean(detailsAssignment)}
        onHide={() => setDetailsAssignment(null)}
        assignment={detailsAssignment}
        onEdit={openEditModal}
        onToggleStatus={handleToggleStatus}
        onDelete={handleDeleteAssignment}
        onChecklistToggle={handleChecklistToggle}
        isBusy={isSaving}
      />

      <ToastContainer position="bottom-end" className="assignment-toast-stack">
        {toast && (
          <Toast onClose={() => setToast(null)} bg={toast.tone === 'error' ? 'danger' : 'success'} delay={2500} autohide>
            <Toast.Body className="toast-copy">{toast.message}</Toast.Body>
          </Toast>
        )}
      </ToastContainer>
    </div>
  );
};

export default AssignmentDashboard;
