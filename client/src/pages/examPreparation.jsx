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
	notes: ''
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
	const [error, setError] = useState('');

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
		} catch (e) {
			setError(e?.response?.data?.message || e?.response?.data?.error || 'Failed to load exams');
			setItems([]);
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
				studyHoursTarget: Number(form.studyHoursTarget || 0)
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
			notes: exam.notes || ''
		});
		setError('');
		setIsModalOpen(true);
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

	return (
		<div className="exam-prep-page">
			<header className="exam-prep-header">
				<h1>Exam Preparation</h1>
				<p>Add, update, and track your exams. Exams will also appear in your timetable.</p>
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
								<article className="exam-item" key={exam.id}>
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
									<div className="exam-item-actions">
										<button type="button" className="btn-small" onClick={() => startEdit(exam)}>Edit</button>
										<button type="button" className="btn-small danger" onClick={() => remove(exam.id)}>Delete</button>
									</div>
								</article>
							))}
						</div>
					)}
				</section>
			</div>

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
