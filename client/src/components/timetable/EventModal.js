import React, { useState, useEffect } from 'react';
import { Modal, Button, Form, Row, Col } from 'react-bootstrap';
import './EventModal.css';

const toLocalDatetime = (date) => {
  if (!date) return '';
  const d = new Date(date);
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const formatTimeForDisplay = (dateStr) => {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  const pad = (n) => String(n).padStart(2, '0');
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const formatTimeRangeDisplay = (startStr, endStr) => {
  if (!startStr || !endStr) return '—';
  return `${formatTimeForDisplay(startStr)} – ${formatTimeForDisplay(endStr)}`;
};

const EventModal = ({ show, onHide, onSave, eventData, selectedSlot }) => {
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    id: null,
    title: '',
    courseCode: '',
    start: '',
    end: '',
    location: '',
    backgroundColor: '#3788d8'
  });

  // Populate form when opening: editing existing event or new event from slot
  useEffect(() => {
    if (!show) return;
    if (eventData) {
      setFormData({
        id: eventData.id,
        title: eventData.title,
        courseCode: eventData.extendedProps?.courseCode || '',
        start: toLocalDatetime(eventData.start),
        end: toLocalDatetime(eventData.end),
        location: eventData.extendedProps?.location || '',
        backgroundColor: eventData.backgroundColor || '#3788d8'
      });
    } else if (selectedSlot) {
      setFormData({
        id: null,
        title: '',
        courseCode: '',
        start: toLocalDatetime(selectedSlot.start),
        end: toLocalDatetime(selectedSlot.end),
        location: '',
        backgroundColor: '#3788d8'
      });
    }
  }, [show, eventData, selectedSlot]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  // Quick duration: set end = start + duration for smooth time-slot changes
  const setDurationMinutes = (minutes) => {
    if (!formData.start) return;
    const start = new Date(formData.start);
    const end = new Date(start.getTime() + minutes * 60 * 1000);
    setFormData({
      ...formData,
      start: toLocalDatetime(start),
      end: toLocalDatetime(end)
    });
  };

  const handleSubmit = async () => {
    // Validation (Business Rules)
    if (!formData.title || !formData.courseCode || !formData.start || !formData.end) {
      alert('Please fill all required fields');
      return;
    }
    
    if (new Date(formData.start) >= new Date(formData.end)) {
      alert('End time must be after start time');
      return;
    }

    setSaving(true);
    try {
      await onSave(formData);
      onHide();
    } finally {
      setSaving(false);
    }
  };

  const hasDetails = formData.title || formData.courseCode || formData.start || formData.end || formData.location;

  return (
    <Modal show={show} onHide={onHide} size="lg" className="event-modal-modern" centered>
      <div className="event-modal-header">
        <h2 className="event-modal-title">{eventData ? 'Edit Class' : 'Add New Class'}</h2>
        <button type="button" className="event-modal-close" onClick={onHide} aria-label="Close">&times;</button>
      </div>
      <Modal.Body className="event-modal-body">
        {hasDetails && (
          <div className="event-detail-summary">
            <div className="event-detail-summary-label">Lecture details</div>
            <div className="event-detail-summary-card">
              <div className="event-detail-row event-detail-title">{formData.title || '—'}</div>
              <div className="event-detail-grid">
                <div className="event-detail-item">
                  <span className="event-detail-item-label">Course code</span>
                  <span className="event-detail-item-value">{formData.courseCode || '—'}</span>
                </div>
                <div className="event-detail-item">
                  <span className="event-detail-item-label">Time</span>
                  <span className="event-detail-item-value">{formatTimeRangeDisplay(formData.start, formData.end)}</span>
                </div>
                <div className="event-detail-item event-detail-item-full">
                  <span className="event-detail-item-label">Location</span>
                  <span className="event-detail-item-value">{formData.location || '—'}</span>
                </div>
              </div>
            </div>
          </div>
        )}
        <Form>
          <div className="event-form-section">
            <span className="event-form-section-label">Course</span>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Course Title *</Form.Label>
                  <Form.Control
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    placeholder="e.g., IT3040 Lecture"
                    className="event-form-control"
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Course Code *</Form.Label>
                  <Form.Control
                    type="text"
                    name="courseCode"
                    value={formData.courseCode}
                    onChange={handleChange}
                    placeholder="e.g., IT3040"
                    className="event-form-control"
                  />
                </Form.Group>
              </Col>
            </Row>
          </div>

          <div className="event-form-section">
            <span className="event-form-section-label">Time slot</span>
            <div className="event-duration-presets">
              <span className="event-duration-label">Quick duration from start:</span>
              <div className="event-duration-btns">
                {[30, 60, 90, 120].map((mins) => (
                  <button
                    key={mins}
                    type="button"
                    className="event-duration-btn"
                    onClick={() => setDurationMinutes(mins)}
                  >
                    {mins === 60 ? '1 hr' : mins === 90 ? '1.5 hr' : mins === 120 ? '2 hr' : `${mins} min`}
                  </button>
                ))}
              </div>
            </div>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Start *</Form.Label>
                  <Form.Control
                    type="datetime-local"
                    name="start"
                    value={formData.start}
                    onChange={handleChange}
                    className="event-form-control event-time-input"
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>End *</Form.Label>
                  <Form.Control
                    type="datetime-local"
                    name="end"
                    value={formData.end}
                    onChange={handleChange}
                    className="event-form-control event-time-input"
                  />
                </Form.Group>
              </Col>
            </Row>
          </div>

          <div className="event-form-section">
            <Row>
              <Col md={8}>
                <Form.Group className="mb-3">
                  <Form.Label>Location</Form.Label>
                  <Form.Control
                    type="text"
                    name="location"
                    value={formData.location}
                    onChange={handleChange}
                    placeholder="e.g., Room 3.02"
                    className="event-form-control"
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Color</Form.Label>
                  <div className="event-color-wrap">
                    <Form.Control
                      type="color"
                      name="backgroundColor"
                      value={formData.backgroundColor}
                      onChange={handleChange}
                      className="event-form-color"
                    />
                    <span className="event-color-value">{formData.backgroundColor}</span>
                  </div>
                </Form.Group>
              </Col>
            </Row>
          </div>
        </Form>
      </Modal.Body>
      <Modal.Footer className="event-modal-footer">
        <Button variant="outline-secondary" onClick={onHide} className="event-btn event-btn-cancel">
          Cancel
        </Button>
        <Button variant="primary" onClick={handleSubmit} disabled={saving} className="event-btn event-btn-save">
          {saving ? 'Saving...' : (eventData ? 'Save Changes' : 'Add Class')}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default EventModal;