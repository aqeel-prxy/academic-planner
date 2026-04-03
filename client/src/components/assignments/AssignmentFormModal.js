import React, { useEffect, useMemo, useState } from 'react';
import { Button, Col, Form, Modal, Row } from 'react-bootstrap';

const PRIORITY_OPTIONS = ['High', 'Medium', 'Low'];

const createEmptyForm = () => ({
  title: '',
  course: '',
  dueDate: '',
  weighting: '',
  description: '',
  priority: 'Medium',
  attachmentName: '',
  attachmentUrl: '',
  checklist: []
});

const toLocalDatetime = (value) => {
  if (!value) return '';
  const date = new Date(value);
  const pad = (number) => String(number).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

const fileToDataUrl = (file) => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = () => resolve(reader.result);
  reader.onerror = () => reject(new Error('Failed to read file'));
  reader.readAsDataURL(file);
});

const isImageAttachment = (url = '', name = '') => {
  const lowerName = name.toLowerCase();
  return url.startsWith('data:image/') || /\.(png|jpe?g|gif|webp|bmp|svg)$/i.test(lowerName);
};

const normalizeAssignment = (assignment) => {
  if (!assignment) return createEmptyForm();

  return {
    title: assignment.title || '',
    course: assignment.course || '',
    dueDate: toLocalDatetime(assignment.dueDate),
    weighting: assignment.weighting ?? '',
    description: assignment.description || '',
    priority: assignment.priority || 'Medium',
    attachmentName: assignment.attachmentName || '',
    attachmentUrl: assignment.attachmentUrl || '',
    checklist: Array.isArray(assignment.checklist) ? assignment.checklist : []
  };
};

const AssignmentFormModal = ({
  show,
  onHide,
  onSubmit,
  assignment,
  courseOptions,
  isSubmitting
}) => {
  const [form, setForm] = useState(createEmptyForm());
  const [errors, setErrors] = useState({});
  const [checklistDraft, setChecklistDraft] = useState('');

  useEffect(() => {
    if (show) {
      setForm(normalizeAssignment(assignment));
      setErrors({});
      setChecklistDraft('');
    }
  }, [assignment, show]);

  const availableCourses = useMemo(() => {
    const merged = assignment?.course && !(courseOptions || []).includes(assignment.course)
      ? [assignment.course, ...(courseOptions || [])]
      : (courseOptions || []);

    return Array.from(new Set(merged.filter(Boolean)));
  }, [assignment, courseOptions]);

  const validate = () => {
    const nextErrors = {};
    const dueDate = new Date(form.dueDate);
    const weighting = Number(form.weighting);

    if (!form.title.trim()) nextErrors.title = 'Assignment title is required.';
    if (!form.course.trim()) nextErrors.course = 'Course is required.';
    if (!form.dueDate) nextErrors.dueDate = 'Due date is required.';
    else if (dueDate <= new Date()) nextErrors.dueDate = 'Due date must be in the future.';
    if (form.weighting === '') nextErrors.weighting = 'Weighting is required.';
    else if (Number.isNaN(weighting) || weighting < 0 || weighting > 100) nextErrors.weighting = 'Weighting must be between 0 and 100.';
    if (!PRIORITY_OPTIONS.includes(form.priority)) nextErrors.priority = 'Select a valid priority.';

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: '' }));
  };

  const handleFileChange = async (event) => {
    const file = event.target.files?.[0];

    if (!file) {
      setForm((current) => ({ ...current, attachmentName: '', attachmentUrl: '' }));
      return;
    }

    try {
      const dataUrl = await fileToDataUrl(file);
      setForm((current) => ({
        ...current,
        attachmentName: file.name,
        attachmentUrl: dataUrl
      }));
    } catch (error) {
      setErrors((current) => ({ ...current, attachment: error.message }));
    }
  };

  const addChecklistItem = () => {
    const text = checklistDraft.trim();
    if (!text) return;

    setForm((current) => ({
      ...current,
      checklist: [...current.checklist, { id: `draft-${Date.now()}`, text, completed: false }]
    }));
    setChecklistDraft('');
  };

  const removeChecklistItem = (itemId) => {
    setForm((current) => ({
      ...current,
      checklist: current.checklist.filter((item) => item.id !== itemId)
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!validate()) return;

    await onSubmit({
      ...assignment,
      ...form,
      title: form.title.trim(),
      course: form.course.trim(),
      weighting: Number(form.weighting),
      description: form.description.trim(),
      checklist: form.checklist
    });
  };

  return (
    <Modal show={show} onHide={onHide} centered size="lg" className="assignment-modal">
      <Modal.Header closeButton className="assignment-modal-header">
        <div>
          <Modal.Title>{assignment ? 'Edit assignment' : 'Add assignment'}</Modal.Title>
          <div className="assignment-modal-subtitle">
            Capture due dates, weighting, checklist tasks, and any supporting file.
          </div>
        </div>
      </Modal.Header>
      <Modal.Body className="assignment-modal-body">
        <Form onSubmit={handleSubmit}>
          <Row className="g-3">
            <Col md={7}>
              <Form.Group>
                <Form.Label>Assignment title <span className="required-marker">*</span></Form.Label>
                <Form.Control name="title" value={form.title} onChange={handleChange} placeholder="e.g. Distributed Systems lab report" isInvalid={Boolean(errors.title)} />
                <Form.Control.Feedback type="invalid">{errors.title}</Form.Control.Feedback>
              </Form.Group>
            </Col>
            <Col md={5}>
              <Form.Group>
                <Form.Label>Priority <span className="required-marker">*</span></Form.Label>
                <Form.Select name="priority" value={form.priority} onChange={handleChange} isInvalid={Boolean(errors.priority)}>
                  {PRIORITY_OPTIONS.map((priority) => <option key={priority} value={priority}>{priority}</option>)}
                </Form.Select>
                <Form.Control.Feedback type="invalid">{errors.priority}</Form.Control.Feedback>
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group>
                <Form.Label>Course or subject <span className="required-marker">*</span></Form.Label>
                <Form.Control list="assignment-course-options" name="course" value={form.course} onChange={handleChange} placeholder="e.g. IT3040" isInvalid={Boolean(errors.course)} />
                <datalist id="assignment-course-options">
                  {availableCourses.map((course) => <option key={course} value={course} />)}
                </datalist>
                <Form.Control.Feedback type="invalid">{errors.course}</Form.Control.Feedback>
              </Form.Group>
            </Col>
            <Col md={3}>
              <Form.Group>
                <Form.Label>Due date <span className="required-marker">*</span></Form.Label>
                <Form.Control type="datetime-local" name="dueDate" value={form.dueDate} onChange={handleChange} isInvalid={Boolean(errors.dueDate)} />
                <Form.Control.Feedback type="invalid">{errors.dueDate}</Form.Control.Feedback>
              </Form.Group>
            </Col>
            <Col md={3}>
              <Form.Group>
                <Form.Label>Weighting (%) <span className="required-marker">*</span></Form.Label>
                <Form.Control type="number" min="0" max="100" step="1" name="weighting" value={form.weighting} onChange={handleChange} placeholder="25" isInvalid={Boolean(errors.weighting)} />
                <Form.Control.Feedback type="invalid">{errors.weighting}</Form.Control.Feedback>
              </Form.Group>
            </Col>
            <Col xs={12}>
              <Form.Group>
                <Form.Label>Description</Form.Label>
                <Form.Control as="textarea" rows={4} name="description" value={form.description} onChange={handleChange} placeholder="Add submission notes, rubric reminders, or links you need later." />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group>
                <Form.Label>Optional file attachment</Form.Label>
                <Form.Control type="file" onChange={handleFileChange} />
                {errors.attachment && <div className="inline-error">{errors.attachment}</div>}
                {form.attachmentName && (
                  <div className="attachment-preview-card">
                    <div className="attachment-preview-name">{form.attachmentName}</div>
                    {isImageAttachment(form.attachmentUrl, form.attachmentName) && (
                      <img
                        src={form.attachmentUrl}
                        alt={form.attachmentName}
                        className="attachment-image-preview compact"
                      />
                    )}
                    <div className="attachment-preview-meta">Stored with this assignment for quick access.</div>
                  </div>
                )}
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group>
                <Form.Label>Checklist items</Form.Label>
                <div className="checklist-draft-row">
                  <Form.Control value={checklistDraft} onChange={(event) => setChecklistDraft(event.target.value)} placeholder="e.g. Finish literature review" />
                  <Button type="button" variant="outline-primary" onClick={addChecklistItem}>Add</Button>
                </div>
                <div className="checklist-editor-list">
                  {form.checklist.length === 0 && <div className="checklist-empty-hint">Break big assignments into smaller subtasks.</div>}
                  {form.checklist.map((item) => (
                    <div key={item.id} className="checklist-editor-item">
                      <span>{item.text}</span>
                      <button type="button" onClick={() => removeChecklistItem(item.id)}>Remove</button>
                    </div>
                  ))}
                </div>
              </Form.Group>
            </Col>
          </Row>
          <div className="assignment-modal-actions">
            <Button variant="outline-secondary" onClick={onHide}>Cancel</Button>
            <Button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Saving...' : (assignment ? 'Save changes' : 'Create assignment')}</Button>
          </div>
        </Form>
      </Modal.Body>
    </Modal>
  );
};

export default AssignmentFormModal;
