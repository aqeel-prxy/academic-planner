import React from 'react';
import { Modal, Button } from 'react-bootstrap';
import './ExamDetailsModal.css';

const ExamDetailsModal = ({ show, onHide, exam, onEdit }) => {
  if (!exam) {
    return null;
  }

  const title = `${exam.subject || 'Exam'}${exam.examTitle ? ` • ${exam.examTitle}` : ''}`;

  return (
    <Modal show={show} onHide={onHide} size="lg" centered className="exam-details-modal">
      <div className="exam-details-header">
        <div>
          <div className="exam-details-badge">Exam</div>
          <h2 className="exam-details-title">{title}</h2>
        </div>
        <button type="button" className="exam-details-close" onClick={onHide} aria-label="Close">&times;</button>
      </div>

      <Modal.Body className="exam-details-body">
        <div className="exam-details-grid">
          <div className="exam-details-item">
            <span className="k">Date</span>
            <span className="v">{exam.examDate || '—'}</span>
          </div>
          <div className="exam-details-item">
            <span className="k">Time</span>
            <span className="v">
              {exam.startTime || '—'}{exam.endTime ? ` – ${exam.endTime}` : ''}
            </span>
          </div>
          <div className="exam-details-item">
            <span className="k">Venue</span>
            <span className="v">{exam.venue || '—'}</span>
          </div>
          <div className="exam-details-item">
            <span className="k">Priority</span>
            <span className="v">{exam.priority || '—'}</span>
          </div>
          <div className="exam-details-item">
            <span className="k">Status</span>
            <span className="v">{exam.status || '—'}</span>
          </div>
          <div className="exam-details-item">
            <span className="k">Progress</span>
            <span className="v">{exam.preparationProgress ?? 0}%</span>
          </div>
          <div className="exam-details-item">
            <span className="k">Study Target</span>
            <span className="v">{exam.studyHoursTarget ?? 0} hrs</span>
          </div>
        </div>

        {exam.notes && (
          <div className="exam-details-notes">
            <div className="k">Notes</div>
            <div className="v">{exam.notes}</div>
          </div>
        )}
      </Modal.Body>

      <Modal.Footer className="exam-details-footer">
        <div className="exam-details-footer-actions">
          <Button
            variant="outline-primary"
            onClick={() => onEdit && onEdit(exam)}
            className="exam-details-btn exam-details-btn-edit"
          >
            Edit
          </Button>
          <Button variant="outline-secondary" onClick={onHide} className="exam-details-btn">
            Close
          </Button>
        </div>
      </Modal.Footer>
    </Modal>
  );
};

export default ExamDetailsModal;
