import React, { useState, useEffect } from 'react';
import { Modal, Button, Form, Row, Col } from 'react-bootstrap';

const EventModal = ({ show, onHide, onSave, eventData, selectedSlot }) => {
  const [formData, setFormData] = useState({
    id: null,
    title: '',
    courseCode: '',
    start: '',
    end: '',
    location: '',
    backgroundColor: '#3788d8'
  });

  // Populate form when editing existing event
  useEffect(() => {
    if (eventData) {
      setFormData({
        id: eventData.id,
        title: eventData.title,
        courseCode: eventData.extendedProps?.courseCode || '',
        start: eventData.start?.toISOString?.().slice(0, 16) || '',
        end: eventData.end?.toISOString?.().slice(0, 16) || '',
        location: eventData.extendedProps?.location || '',
        backgroundColor: eventData.backgroundColor || '#3788d8'
      });
    } else if (selectedSlot) {
      // New event from date click
      setFormData({
        ...formData,
        start: selectedSlot.start.toISOString().slice(0, 16),
        end: selectedSlot.end.toISOString().slice(0, 16)
      });
    }
  }, [eventData, selectedSlot]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = () => {
    // Validation (Business Rules)
    if (!formData.title || !formData.courseCode || !formData.start || !formData.end) {
      alert('Please fill all required fields');
      return;
    }
    
    if (new Date(formData.start) >= new Date(formData.end)) {
      alert('End time must be after start time');
      return;
    }

    onSave(formData);
    onHide();
  };

  return (
    <Modal show={show} onHide={onHide} size="lg">
      <Modal.Header closeButton>
        <Modal.Title>{eventData ? 'Edit Class' : 'Add New Class'}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form>
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
                />
              </Form.Group>
            </Col>
          </Row>

          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Start Date & Time *</Form.Label>
                <Form.Control
                  type="datetime-local"
                  name="start"
                  value={formData.start}
                  onChange={handleChange}
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>End Date & Time *</Form.Label>
                <Form.Control
                  type="datetime-local"
                  name="end"
                  value={formData.end}
                  onChange={handleChange}
                />
              </Form.Group>
            </Col>
          </Row>

          <Form.Group className="mb-3">
            <Form.Label>Location</Form.Label>
            <Form.Control
              type="text"
              name="location"
              value={formData.location}
              onChange={handleChange}
              placeholder="e.g., Room 3.02"
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Color</Form.Label>
            <Form.Control
              type="color"
              name="backgroundColor"
              value={formData.backgroundColor}
              onChange={handleChange}
            />
          </Form.Group>
        </Form>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>
          Cancel
        </Button>
        <Button variant="primary" onClick={handleSubmit}>
          {eventData ? 'Save Changes' : 'Add Class'}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default EventModal;