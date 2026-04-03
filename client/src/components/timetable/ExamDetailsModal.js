import React from 'react';
import { Modal, Button } from 'react-bootstrap';
import ExamAiChatPanel from '../examPreparation/ExamAiChatPanel';
import '../../pages/ExamPreparationPage.css';
import './ExamDetailsModal.css';

const ExamDetailsModal = ({ show, onHide, exam, onEdit }) => {
  if (!exam) {
    return null;
  }

  const title = `${exam.subject || 'Exam'}${exam.examTitle ? ` • ${exam.examTitle}` : ''}`;
  const lecturePdfs = Array.isArray(exam.lecturePdfs) ? exam.lecturePdfs : [];
  const detailsPdfTotal = lecturePdfs.length;
  const detailsPdfCompleted = lecturePdfs.filter((pdf) => Boolean(pdf.completed)).length;
  const detailsPdfPercent = detailsPdfTotal > 0 ? Math.round((detailsPdfCompleted / detailsPdfTotal) * 100) : 0;

  return (
    <Modal show={show} onHide={onHide} size="xl" centered className="exam-details-modal exam-details-modal-blue">
      <div className="exam-details-hero">
        <div>
          <div className="exam-details-date">{exam.examDate || '—'}</div>
          <h2 className="exam-details-title">{title}</h2>
          <div className="exam-details-sub">
            <span>{exam.startTime || '—'}{exam.endTime ? ` – ${exam.endTime}` : ''}</span>
            <span>•</span>
            <span>{exam.venue || 'Venue not set'}</span>
          </div>
        </div>
        <button type="button" className="exam-details-close" onClick={onHide} aria-label="Close">&times;</button>
      </div>

      <Modal.Body className="exam-details-body">
        <div className="exam-details-grid">
          <div className="exam-stat-card">
            <div className="exam-stat-label">Priority</div>
            <div className="exam-stat-value">{exam.priority || '—'}</div>
          </div>
          <div className="exam-stat-card">
            <div className="exam-stat-label">Status</div>
            <div className="exam-stat-value">{exam.status || '—'}</div>
          </div>
          <div className="exam-stat-card">
            <div className="exam-stat-label">Study Target</div>
            <div className="exam-stat-value">{exam.studyHoursTarget ?? 0} hrs</div>
          </div>
          <div className="exam-stat-card">
            <div className="exam-stat-label">Progress</div>
            <div className="exam-stat-value">{exam.preparationProgress ?? 0}%</div>
          </div>
        </div>

        <section className="exam-details-section">
          <div className="exam-section-head">
            <h3>Preparation Progress</h3>
            <span>{exam.preparationProgress ?? 0}%</span>
          </div>
          <div className="exam-progress-track">
            <div
              className="exam-progress-fill"
              style={{ width: `${Math.max(0, Math.min(100, Number(exam.preparationProgress || 0)))}%` }}
            />
          </div>
        </section>

        <section className="exam-details-section">
          <div className="exam-section-head">
            <h3>Lecture PDFs</h3>
            <span>{detailsPdfCompleted}/{detailsPdfTotal} completed ({detailsPdfPercent}%)</span>
          </div>
          {detailsPdfTotal === 0 ? (
            <div className="exam-details-empty">No PDFs uploaded for this exam yet.</div>
          ) : (
            <div className="exam-details-pdf-list">
              {lecturePdfs.map((pdf) => (
                <div className="exam-details-pdf-item" key={pdf.id}>
                  <div className="exam-details-pdf-left">
                    <label className="exam-details-pdf-check">
                      <input type="checkbox" checked={Boolean(pdf.completed)} readOnly />
                      <div className={`exam-details-dot ${pdf.completed ? 'done' : ''}`} />
                    </label>
                    <div>
                      <div className="exam-details-pdf-name">{pdf.fileName || 'Lecture PDF'}</div>
                      <div className="exam-details-pdf-status">{pdf.completed ? 'Finished' : 'Pending'}</div>
                    </div>
                  </div>
                  <a href={pdf.url} target="_blank" rel="noreferrer" className="exam-details-open-link">Read PDF</a>
                </div>
              ))}
            </div>
          )}
        </section>

        {exam.notes && (
          <section className="exam-details-section">
            <div className="exam-section-head">
              <h3>Notes</h3>
            </div>
            <div className="exam-details-notes">{exam.notes}</div>
          </section>
        )}

        <ExamAiChatPanel exam={exam} isOpen={show} />
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
