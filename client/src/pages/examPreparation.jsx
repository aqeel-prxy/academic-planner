import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Modal, Button } from 'react-bootstrap';
import api from '../services/api';
import './ExamPreparationPage.css';

const initialForm = {
	subject: '',
	examTitle: '',
	examDate: '',
	startTime: '',
	endTime: '',
	venue: '',
	priority: 'Medium',
	status: 'Planned',
	preparationProgress: 0,
	studyHoursTarget: 0,
	notes: '',
	lecturePdfs: []
};

const normalizeApiList = (response) => {
	if (Array.isArray(response)) return response;
	if (response && Array.isArray(response.data)) return response.data;
	return [];
};

const ExamPreparation = () => {
	const location = useLocation();
	const navigate = useNavigate();
	const [items, setItems] = useState([]);
	const [form, setForm] = useState(initialForm);
	const [editingId, setEditingId] = useState(null);
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState(false);
	const [pdfSavingKey, setPdfSavingKey] = useState('');
	const [error, setError] = useState('');
	const [lecturePdfFiles, setLecturePdfFiles] = useState([]);
	const [selectedExam, setSelectedExam] = useState(null);
	const [isDetailsOpen, setIsDetailsOpen] = useState(false);

	const submitLabel = useMemo(() => (editingId ? 'Update Exam' : 'Add Exam'), [editingId]);

	const getEditIdFromQuery = () => {
		const params = new URLSearchParams(location.search);
		return params.get('edit');
	};

	const load = async () => {
		try {
			setLoading(true);
			setError('');
			const res = await api.getExamPreparations();
			const list = normalizeApiList(res);
			setItems(list);

			const editId = getEditIdFromQuery();
			if (editId) {
				const target = list.find((x) => String(x.id) === String(editId));
				if (target) {
					startEdit(target);
					// clear query so refresh doesn't keep forcing edit
					navigate('/exam-preparation', { replace: true });
				}
			}

			return list;
		} catch (e) {
			setError(e?.response?.data?.message || e?.response?.data?.error || 'Failed to load exams');
			setItems([]);
			return [];
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		load();
	}, []);

	const onChange = (e) => {
		const { name, value } = e.target;
		setForm((prev) => ({ ...prev, [name]: value }));
	};

	const reset = () => {
		setForm(initialForm);
		setLecturePdfFiles([]);
		setEditingId(null);
	};

	const closeModal = () => {
		setIsModalOpen(false);
		reset();
		setError('');
	};

	const openAdd = () => {
		reset();
		setError('');
		setIsModalOpen(true);
	};

	const onSubmit = async (e) => {
		e.preventDefault();
		setSaving(true);
		setError('');
		try {
			if (!form.startTime || !form.endTime) {
				setError('Start Time and End Time are required.');
				return;
			}
			const startMinutes = Number(form.startTime.split(':')[0]) * 60 + Number(form.startTime.split(':')[1]);
			const endMinutes = Number(form.endTime.split(':')[0]) * 60 + Number(form.endTime.split(':')[1]);
			if (!(endMinutes > startMinutes)) {
				setError('End Time must be after Start Time.');
				return;
			}

			const payload = {
				...form,
				preparationProgress: Number(form.preparationProgress || 0),
				studyHoursTarget: Number(form.studyHoursTarget || 0),
				lecturePdfs: Array.isArray(form.lecturePdfs) ? form.lecturePdfs : [],
				lecturePdfFiles
			};

			if (editingId) {
				await api.updateExamPreparation(editingId, payload);
			} else {
				await api.createExamPreparation(payload);
			}
			closeModal();
			await load();
		} catch (err) {
			setError(err?.response?.data?.message || err?.response?.data?.error || 'Failed to save exam');
		} finally {
			setSaving(false);
		}
	};

	const startEdit = (exam) => {
		setEditingId(exam.id);
		setForm({
			...initialForm,
			subject: exam.subject || '',
			examTitle: exam.examTitle || '',
			examDate: exam.examDate || '',
			startTime: exam.startTime || '',
			endTime: exam.endTime || '',
			venue: exam.venue || '',
			priority: exam.priority || 'Medium',
			status: exam.status || 'Planned',
			preparationProgress: exam.preparationProgress ?? 0,
			studyHoursTarget: exam.studyHoursTarget ?? 0,
			notes: exam.notes || '',
			lecturePdfs: Array.isArray(exam.lecturePdfs) ? exam.lecturePdfs : []
		});
		setLecturePdfFiles([]);
		setError('');
		setIsModalOpen(true);
	};

	const onPdfFilesChange = (e) => {
		const files = Array.from(e.target.files || []);
		setLecturePdfFiles(files);
	};

	const togglePdfCompleted = async (examId, pdfId, completed) => {
		try {
			setPdfSavingKey(`${examId}:${pdfId}`);
			setError('');
			await api.updateExamPdfStatus(examId, pdfId, completed);
			const refreshed = await load();
			if (isDetailsOpen && selectedExam && String(selectedExam.id) === String(examId)) {
				const updatedExam = refreshed.find((exam) => String(exam.id) === String(examId));
				if (updatedExam) setSelectedExam(updatedExam);
			}
		} catch (err) {
			setError(err?.response?.data?.message || err?.response?.data?.error || 'Failed to update PDF progress');
		} finally {
			setPdfSavingKey('');
		}
	};

	const removePdf = async (examId, pdfId) => {
		const ok = window.confirm('Delete this PDF from the exam?');
		if (!ok) return;

		try {
			setPdfSavingKey(`${examId}:${pdfId}`);
			setError('');
			await api.deleteExamPdf(examId, pdfId);
			const refreshed = await load();
			if (isDetailsOpen && selectedExam && String(selectedExam.id) === String(examId)) {
				const updatedExam = refreshed.find((exam) => String(exam.id) === String(examId));
				if (updatedExam) setSelectedExam(updatedExam);
				else closeDetails();
			}
		} catch (err) {
			setError(err?.response?.data?.message || err?.response?.data?.error || 'Failed to delete PDF');
		} finally {
			setPdfSavingKey('');
		}
	};

	const remove = async (id) => {
		const ok = window.confirm('Delete this exam?');
		if (!ok) return;
		try {
			setError('');
			await api.deleteExamPreparation(id);
			if (editingId === id) reset();
			await load();
		} catch (err) {
			setError(err?.response?.data?.message || err?.response?.data?.error || 'Failed to delete exam');
		}
	};

	const openDetails = (exam) => {
		setSelectedExam(exam);
		setIsDetailsOpen(true);
	};

	const closeDetails = () => {
		setIsDetailsOpen(false);
		setSelectedExam(null);
	};

	const onExamItemKeyDown = (event, exam) => {
		if (event.key === 'Enter' || event.key === ' ') {
			event.preventDefault();
			openDetails(exam);
		}
	};

	const detailsPdfTotal = Array.isArray(selectedExam?.lecturePdfs) ? selectedExam.lecturePdfs.length : 0;
	const detailsPdfCompleted = Array.isArray(selectedExam?.lecturePdfs)
		? selectedExam.lecturePdfs.filter((pdf) => Boolean(pdf.completed)).length
		: 0;
	const detailsPdfPercent = detailsPdfTotal > 0 ? Math.round((detailsPdfCompleted / detailsPdfTotal) * 100) : 0;
	const examCount = items.length;
	const examPdfCount = items.reduce((total, exam) => total + (Array.isArray(exam.lecturePdfs) ? exam.lecturePdfs.length : 0), 0);
	const examFinishedCount = items.reduce(
		(total, exam) => total + (Array.isArray(exam.lecturePdfs) ? exam.lecturePdfs.filter((pdf) => Boolean(pdf.completed)).length : 0),
		0
	);

	return (
		<div className="exam-prep-page">
			<header className="exam-prep-header">
				<div className="exam-header-copy">
					<p className="exam-header-kicker">Academic planner</p>
					<h1>Exam Preparation</h1>
					<p>Add, update, and track your exams. Exams will also appear in your timetable.</p>
				</div>
				<div className="exam-header-stats">
					<div className="exam-header-stat">
						<span className="exam-header-stat-label">Exams</span>
						<strong>{examCount}</strong>
					</div>
					<div className="exam-header-stat">
						<span className="exam-header-stat-label">PDFs</span>
						<strong>{examPdfCount}</strong>
					</div>
					<div className="exam-header-stat">
						<span className="exam-header-stat-label">Done</span>
						<strong>{examFinishedCount}</strong>
					</div>
				</div>
			</header>

			<div className="exam-prep-grid">
				<section className="exam-card">
					<div className="exam-card-title">
						<h2>Upcoming Exams</h2>
						<div className="exam-card-actions">
							<button type="button" className="btn-primary" onClick={openAdd}>
								Add Exam
							</button>
							<button type="button" className="btn-ghost" onClick={load} disabled={loading}>
								Refresh
							</button>
						</div>
					</div>

					{loading ? (
						<div className="exam-empty">Loading...</div>
					) : items.length === 0 ? (
						<div className="exam-empty">No exams added yet.</div>
					) : (
						<div className="exam-list">
							{items.map((exam) => (
								<article
									className="exam-item"
									key={exam.id}
									onClick={() => openDetails(exam)}
									onKeyDown={(event) => onExamItemKeyDown(event, exam)}
									tabIndex={0}
									role="button"
									aria-label={`Open details for ${exam.subject} ${exam.examTitle}`}
								>
									<div className="exam-item-top">
										<div>
											<div className="exam-date">{exam.examDate}</div>
											<div className="exam-title">{exam.subject} • {exam.examTitle}</div>
											{(exam.startTime || exam.endTime || exam.venue) && (
												<div className="exam-sub">
													{exam.startTime && <span>{exam.startTime}</span>}
													{exam.endTime && <span>– {exam.endTime}</span>}
													{exam.venue && <span> • {exam.venue}</span>}
												</div>
											)}
										</div>
										<div className="pill">{exam.priority || 'Medium'}</div>
									</div>
									{exam.notes && <div className="exam-notes">{exam.notes}</div>}
									{Array.isArray(exam.lecturePdfs) && exam.lecturePdfs.length > 0 && (
										<div className="exam-pdf-list">
											{exam.lecturePdfs.map((pdf) => {
												const isPdfBusy = pdfSavingKey === `${exam.id}:${pdf.id}`;
												return (
													<div className="exam-pdf-item" key={pdf.id}>
														<label className="exam-pdf-check" onClick={(e) => e.stopPropagation()}>
															<input
																type="checkbox"
																checked={Boolean(pdf.completed)}
																disabled={isPdfBusy}
																onChange={(e) => togglePdfCompleted(exam.id, pdf.id, e.target.checked)}
															/>
															<span>{pdf.fileName || 'Lecture PDF'}</span>
														</label>
														<div className="exam-pdf-actions">
															<a href={pdf.url} target="_blank" rel="noreferrer" className="exam-pdf-link" onClick={(e) => e.stopPropagation()}>
																Open
															</a>
															<button type="button" className="btn-small danger" onClick={(e) => {
																e.stopPropagation();
																removePdf(exam.id, pdf.id);
															}} disabled={isPdfBusy}>
																Remove
															</button>
														</div>
													</div>
												);
											})}
										</div>
									)}
									<div className="exam-item-actions">
										<button type="button" className="btn-small" onClick={(e) => {
											e.stopPropagation();
											startEdit(exam);
										}}>Edit</button>
										<button type="button" className="btn-small danger" onClick={(e) => {
											e.stopPropagation();
											remove(exam.id);
										}}>Delete</button>
									</div>
								</article>
							))}
						</div>
					)}
				</section>
			</div>

			<Modal show={isDetailsOpen} onHide={closeDetails} size="lg" centered className="exam-details-modal">
				<div className="exam-details-hero">
					<div>
						<div className="exam-details-date">{selectedExam?.examDate || 'No date'}</div>
						<h2 className="exam-details-title">{selectedExam?.subject || 'Subject'} • {selectedExam?.examTitle || 'Exam'}</h2>
						<div className="exam-details-sub">
							<span>{selectedExam?.startTime || '--:--'} - {selectedExam?.endTime || '--:--'}</span>
							<span>•</span>
							<span>{selectedExam?.venue || 'Venue not set'}</span>
						</div>
					</div>
					<button type="button" className="exam-form-modal-close details-close" onClick={closeDetails} aria-label="Close">&times;</button>
				</div>

				<Modal.Body className="exam-details-body">
					<div className="exam-details-grid">
						<div className="exam-stat-card">
							<div className="exam-stat-label">Priority</div>
							<div className="exam-stat-value">{selectedExam?.priority || 'Medium'}</div>
						</div>
						<div className="exam-stat-card">
							<div className="exam-stat-label">Status</div>
							<div className="exam-stat-value">{selectedExam?.status || 'Planned'}</div>
						</div>
						<div className="exam-stat-card">
							<div className="exam-stat-label">Study Hours Target</div>
							<div className="exam-stat-value">{Number(selectedExam?.studyHoursTarget || 0)}h</div>
						</div>
					</div>

					<section className="exam-details-section">
						<div className="exam-section-head">
							<h3>Preparation Progress</h3>
							<span>{Number(selectedExam?.preparationProgress || 0)}%</span>
						</div>
						<div className="exam-progress-track">
							<div
								className="exam-progress-fill"
								style={{ width: `${Math.max(0, Math.min(100, Number(selectedExam?.preparationProgress || 0)))}%` }}
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
								{selectedExam?.lecturePdfs?.map((pdf) => (
									<div className="exam-details-pdf-item" key={pdf.id}>
										<div className="exam-details-pdf-left">
											<label className="exam-details-pdf-check">
												<input
													type="checkbox"
													checked={Boolean(pdf.completed)}
													disabled={pdfSavingKey === `${selectedExam?.id}:${pdf.id}`}
													onChange={(e) => togglePdfCompleted(selectedExam?.id, pdf.id, e.target.checked)}
												/>
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

					<section className="exam-details-section">
						<div className="exam-section-head">
							<h3>Notes</h3>
						</div>
						<div className="exam-details-notes">{selectedExam?.notes || 'No notes added yet.'}</div>
					</section>
				</Modal.Body>
			</Modal>

			<Modal show={isModalOpen} onHide={closeModal} size="lg" centered className="exam-form-modal">
				<div className="exam-form-modal-header">
					<h2 className="exam-form-modal-title">{editingId ? 'Edit Exam' : 'Add Exam'}</h2>
					<button type="button" className="exam-form-modal-close" onClick={closeModal} aria-label="Close">&times;</button>
				</div>
				<Modal.Body className="exam-form-modal-body">
					<form className="exam-form" onSubmit={onSubmit}>
						<div className="row-2">
							<label>
								Subject
								<input name="subject" value={form.subject} onChange={onChange} placeholder="e.g., ITPM" required />
							</label>
							<label>
								Exam Title
								<input name="examTitle" value={form.examTitle} onChange={onChange} placeholder="e.g., Final Exam" required />
							</label>
						</div>

						<div className="row-3">
							<label>
								Exam Date
								<input type="date" name="examDate" value={form.examDate} onChange={onChange} required />
							</label>
							<label>
								Start Time
								<input type="time" name="startTime" value={form.startTime} onChange={onChange} required />
							</label>
							<label>
								End Time
								<input type="time" name="endTime" value={form.endTime} onChange={onChange} required />
							</label>
						</div>

						<div className="row-2">
							<label>
								Venue
								<input name="venue" value={form.venue} onChange={onChange} placeholder="e.g., Hall A" />
							</label>
							<label>
								Priority
								<select name="priority" value={form.priority} onChange={onChange}>
									<option>Low</option>
									<option>Medium</option>
									<option>High</option>
								</select>
							</label>
						</div>

						<div className="row-3">
							<label>
								Status
								<select name="status" value={form.status} onChange={onChange}>
									<option>Planned</option>
									<option>In Progress</option>
									<option>Completed</option>
								</select>
							</label>
							<label>
								Progress (%)
								<div className="progress-radio-group" role="radiogroup" aria-label="Preparation progress">
									{[0, 25, 50, 75, 100].map((value) => (
										<label key={value} className="progress-radio-item">
											<input
												type="radio"
												name="preparationProgress"
												value={String(value)}
												checked={Number(form.preparationProgress) === value}
												onChange={onChange}
											/>
											<span>{value}</span>
										</label>
									))}
								</div>
							</label>
							<label>
								Study Hours Target
								<input type="number" min="0" name="studyHoursTarget" value={form.studyHoursTarget} onChange={onChange} />
							</label>
						</div>

						<label>
							Notes
							<textarea name="notes" value={form.notes} onChange={onChange} rows={3} placeholder="Key lessons, tips, resources..." />
						</label>

						<label>
							Lecture PDFs (upload multiple)
							<input type="file" accept="application/pdf,.pdf" multiple onChange={onPdfFilesChange} />
							{lecturePdfFiles.length > 0 && (
								<div className="exam-upload-count">{lecturePdfFiles.length} PDF(s) selected</div>
							)}
						</label>

						{Array.isArray(form.lecturePdfs) && form.lecturePdfs.length > 0 && (
							<div className="exam-existing-pdfs">
								<div className="exam-existing-pdfs-title">Already uploaded PDFs</div>
								{form.lecturePdfs.map((pdf) => (
									<div key={pdf.id} className="exam-existing-pdf-row">
										<span>{pdf.fileName}</span>
										<a href={pdf.url} target="_blank" rel="noreferrer">Open</a>
									</div>
								))}
							</div>
						)}

						{error && <div className="exam-error">{error}</div>}
						<div className="exam-form-modal-footer">
							<Button variant="outline-secondary" onClick={closeModal} disabled={saving} className="exam-btn exam-btn-cancel">
								Cancel
							</Button>
							<Button variant="primary" type="submit" disabled={saving} className="exam-btn exam-btn-save">
								{saving ? 'Saving...' : submitLabel}
							</Button>
						</div>
					</form>
				</Modal.Body>
			</Modal>
		</div>
	);
};

export default ExamPreparation;
