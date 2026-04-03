import React, { useMemo, useState } from 'react';
import { Button, Modal, ProgressBar } from 'react-bootstrap';

const formatDate = (value) => new Intl.DateTimeFormat('en-GB', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit'
}).format(new Date(value));

const daysUntil = (value) => {
  const diff = new Date(value).getTime() - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
};

const isImageAttachment = (url = '', name = '') => {
  const lowerName = name.toLowerCase();
  return url.startsWith('data:image/') || /\.(png|jpe?g|gif|webp|bmp|svg)$/i.test(lowerName);
};

const AssignmentDetailsModal = ({
  show,
  onHide,
  assignment,
  onEdit,
  onToggleStatus,
  onDelete,
  onChecklistToggle,
  isBusy
}) => {
  const [confirmDelete, setConfirmDelete] = useState(false);

  const dueLabel = useMemo(() => {
    if (!assignment) return '';
    const days = daysUntil(assignment.dueDate);

    if (assignment.status === 'Completed') return 'Completed';
    if (days < 0) return `${Math.abs(days)} day${Math.abs(days) === 1 ? '' : 's'} overdue`;
    if (days === 0) return 'Due today';
    return `${days} day${days === 1 ? '' : 's'} left`;
  }, [assignment]);

  if (!assignment) return null;

  const canPreviewImage = assignment.attachmentUrl && isImageAttachment(assignment.attachmentUrl, assignment.attachmentName);

  return (
    <Modal show={show} onHide={onHide} centered size="lg" className="assignment-modal">
      <Modal.Header closeButton className="assignment-modal-header">
        <div>
          <div className={`details-status-chip status-${assignment.status.toLowerCase()}`}>{assignment.status}</div>
          <Modal.Title>{assignment.title}</Modal.Title>
          <div className="assignment-modal-subtitle">{assignment.course} • Due {formatDate(assignment.dueDate)}</div>
        </div>
      </Modal.Header>
      <Modal.Body className="assignment-modal-body">
        <div className="assignment-details-grid">
          <div className="assignment-details-panel">
            <div className="detail-label">Description</div>
            <p className="detail-copy">{assignment.description || 'No description added yet.'}</p>
            <div className="details-meta-grid">
              <div className="details-meta-card">
                <span className="detail-label">Weighting</span>
                <strong>{assignment.weighting}%</strong>
              </div>
              <div className="details-meta-card">
                <span className="detail-label">Priority</span>
                <strong>{assignment.priority}</strong>
              </div>
              <div className="details-meta-card">
                <span className="detail-label">Timeline</span>
                <strong>{dueLabel}</strong>
              </div>
            </div>
            {assignment.attachmentName && (
              <div className="attachment-preview-card large">
                <div className="detail-label">Attachment</div>
                <div className="attachment-preview-name">{assignment.attachmentName}</div>
                {canPreviewImage && (
                  <img
                    src={assignment.attachmentUrl}
                    alt={assignment.attachmentName}
                    className="attachment-image-preview"
                  />
                )}
                {assignment.attachmentUrl ? (
                  <div className="attachment-action-row">
                    <a href={assignment.attachmentUrl} target="_blank" rel="noreferrer" className="attachment-action-link">
                      Open attachment
                    </a>
                    <a href={assignment.attachmentUrl} download={assignment.attachmentName} className="attachment-action-link secondary">
                      Download
                    </a>
                  </div>
                ) : (
                  <div className="attachment-preview-meta">Attachment content is unavailable for this record.</div>
                )}
              </div>
            )}
          </div>
          <div className="assignment-details-panel checklist-panel">
            <div className="checklist-panel-header">
              <div>
                <div className="detail-label">Checklist progress</div>
                <strong>{assignment.checklistCompletedCount}/{assignment.checklistTotalCount} completed</strong>
              </div>
              <span className="progress-label">{assignment.progress}%</span>
            </div>
            <ProgressBar now={assignment.progress} className="assignment-progress-bar" />
            <div className="details-checklist">
              {assignment.checklist.length === 0 && <div className="checklist-empty-hint">No subtasks yet.</div>}
              {assignment.checklist.map((item) => (
                <label key={item.id} className={`details-checklist-item ${item.completed ? 'done' : ''} ${assignment.isReadOnly ? 'locked' : ''}`}>
                  <input type="checkbox" checked={item.completed} disabled={assignment.isReadOnly || isBusy} onChange={() => onChecklistToggle(assignment, item.id)} />
                  <span>{item.text}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
        {confirmDelete && (
          <div className="delete-confirmation-box">
            <strong>Delete this assignment?</strong>
            <p>This action removes the assignment and its checklist permanently.</p>
            <div className="delete-confirmation-actions">
              <Button variant="outline-secondary" onClick={() => setConfirmDelete(false)}>Cancel</Button>
              <Button variant="danger" onClick={() => onDelete(assignment.id)} disabled={isBusy}>Confirm delete</Button>
            </div>
          </div>
        )}
      </Modal.Body>
      <Modal.Footer className="assignment-modal-actions details-footer">
        <Button variant="outline-secondary" onClick={onHide}>Close</Button>
        <Button variant="outline-danger" onClick={() => setConfirmDelete(true)}>Delete</Button>
        <Button variant="outline-primary" onClick={() => onEdit(assignment)} disabled={assignment.isReadOnly}>Edit</Button>
        <Button onClick={() => onToggleStatus(assignment)} disabled={isBusy}>
          {assignment.status === 'Completed' ? 'Reopen assignment' : 'Mark completed'}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default AssignmentDetailsModal;
