import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Badge, Button, Form, Modal, Spinner } from 'react-bootstrap';
import {
  FiBook,
  FiCpu,
  FiDownload,
  FiEdit3,
  FiExternalLink,
  FiFileText,
  FiLayers,
  FiPlus,
  FiTrash2
} from 'react-icons/fi';
import api from '../../services/api';
import './module-organizer.css';

const TYPE_CONFIG = {
  lecture: { label: 'Lecture', Icon: FiBook, bg: 'primary' },
  lab: { label: 'Lab', Icon: FiCpu, bg: 'info' },
  tutorial: { label: 'Tutorial', Icon: FiLayers, bg: 'warning', text: 'dark' },
  note: { label: 'Note', Icon: FiFileText, bg: 'secondary' }
};

const TYPE_ORDER = ['lecture', 'lab', 'tutorial', 'note'];

const emptyForm = () => ({
  resourceType: 'note',
  title: '',
  linkUrl: '',
  content: ''
});

function ModuleOrganizer() {
  const [modules, setModules] = useState([]);
  const [selectedModuleId, setSelectedModuleId] = useState('');
  const [resources, setResources] = useState([]);
  const [loadingModules, setLoadingModules] = useState(true);
  const [loadingResources, setLoadingResources] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm());
  const [saving, setSaving] = useState(false);
  const [documentFile, setDocumentFile] = useState(null);
  const [fileInputKey, setFileInputKey] = useState(0);
  const contentRef = useRef(null);

  const loadModules = useCallback(async () => {
    setLoadingModules(true);
    setError('');
    try {
      const list = await api.getModules();
      const arr = Array.isArray(list) ? list : [];
      arr.sort((a, b) =>
        String(a.moduleCode || '').localeCompare(String(b.moduleCode || ''), undefined, {
          sensitivity: 'base'
        })
      );
      setModules(arr);
      setSelectedModuleId((prev) => {
        if (arr.length === 0) return '';
        if (prev && arr.some((m) => m.id === prev)) return prev;
        return arr[0].id;
      });
    } catch (e) {
      setError('Could not load modules. Is the server running?');
    } finally {
      setLoadingModules(false);
    }
  }, []);

  const loadResources = useCallback(async (moduleId) => {
    if (!moduleId) {
      setResources([]);
      return;
    }
    setLoadingResources(true);
    setError('');
    try {
      const rows = await api.getModuleResources(moduleId);
      setResources(Array.isArray(rows) ? rows : []);
    } catch (e) {
      setError('Could not load materials for this module.');
      setResources([]);
    } finally {
      setLoadingResources(false);
    }
  }, []);

  useEffect(() => {
    loadModules();
  }, []);

  useEffect(() => {
    if (selectedModuleId) {
      loadResources(selectedModuleId);
    } else {
      setResources([]);
    }
  }, [selectedModuleId, loadResources]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(''), 3500);
    return () => clearTimeout(t);
  }, [toast]);

  const selectedModule = useMemo(
    () => modules.find((m) => m.id === selectedModuleId) || null,
    [modules, selectedModuleId]
  );

  const editingRow = useMemo(
    () => (editingId ? resources.find((r) => r.id === editingId) ?? null : null),
    [editingId, resources]
  );

  const filteredResources = useMemo(() => {
    if (filterType === 'all') return resources;
    return resources.filter((r) => r.resourceType === filterType);
  }, [resources, filterType]);

  const groupedByType = useMemo(() => {
    const map = new Map();
    TYPE_ORDER.forEach((t) => map.set(t, []));
    for (const r of filteredResources) {
      const list = map.get(r.resourceType) || [];
      list.push(r);
      map.set(r.resourceType, list);
    }
    return map;
  }, [filteredResources]);

  const openAdd = () => {
    setEditingId(null);
    setForm(emptyForm());
    setDocumentFile(null);
    setFileInputKey((k) => k + 1);
    setShowModal(true);
  };

  const openEdit = (row) => {
    setEditingId(row.id);
    setForm({
      resourceType: row.resourceType || 'note',
      title: row.title || '',
      linkUrl: row.linkUrl || '',
      content: row.content || ''
    });
    setDocumentFile(null);
    setFileInputKey((k) => k + 1);
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    const title = form.title.trim();
    if (!title) {
      setError('Title is required.');
      return;
    }
    if (!editingId && !documentFile) {
      setError('Please attach a document (PDF, Word, Excel, or image). It will be saved with this material.');
      return;
    }
    if (!selectedModuleId) return;

    const isNewMaterial = !editingId;
    setSaving(true);
    setError('');
    try {
      if (editingId) {
        if (documentFile) {
          const fd = new FormData();
          fd.append('resourceType', form.resourceType);
          fd.append('title', title);
          fd.append('linkUrl', form.linkUrl.trim());
          fd.append('content', form.content.trim());
          fd.append('document', documentFile);
          await api.updateModuleResourceForm(editingId, fd);
        } else {
          await api.updateModuleResource(editingId, {
            resourceType: form.resourceType,
            title,
            linkUrl: form.linkUrl.trim() || null,
            content: form.content.trim() || null
          });
        }
        setToast('Material updated');
      } else {
        const fd = new FormData();
        fd.append('moduleId', selectedModuleId);
        fd.append('resourceType', form.resourceType);
        fd.append('title', title);
        fd.append('linkUrl', form.linkUrl.trim());
        fd.append('content', form.content.trim());
        fd.append('document', documentFile);
        await api.createModuleResourceForm(fd);
        setToast('Material added');
      }

      setShowModal(false);
      setDocumentFile(null);
      setEditingId(null);
      if (isNewMaterial) {
        setFilterType('all');
      }
      await loadResources(selectedModuleId);
      if (isNewMaterial) {
        requestAnimationFrame(() => {
          contentRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.response?.data?.error ||
          err.message ||
          'Could not save material.'
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Remove this material from the organizer?')) return;
    try {
      await api.deleteModuleResource(id);
      setToast('Material removed');
      await loadResources(selectedModuleId);
    } catch (err) {
      setError('Could not delete material.');
    }
  };

  if (loadingModules) {
    return (
      <div className="module-organizer module-organizer--loading">
        <Spinner animation="border" role="status" variant="primary" />
        <span className="ms-2">Loading modules…</span>
      </div>
    );
  }

  if (modules.length === 0) {
    return (
      <div className="module-organizer module-organizer--empty">
        <h2>Module Organizer</h2>
        <p>
          Add modules in the <strong>GPA Tracker</strong> tab first. Then you can attach lectures, labs,
          tutorials, and notes here.
        </p>
      </div>
    );
  }

  return (
    <div className="module-organizer">
      <aside className="organizer-sidebar" aria-label="Modules">
        <div className="organizer-sidebar-head">
          <p className="organizer-kicker">Academic planner</p>
          <h2>Module Organizer</h2>
          <p className="organizer-tagline">
            Lectures, labs, tutorials, notes, links, and documents (PDF, Office, images) in one place.
          </p>
        </div>
        <nav className="organizer-module-list">
          {modules.map((m) => (
            <button
              key={m.id}
              type="button"
              className={`organizer-module-btn ${selectedModuleId === m.id ? 'active' : ''}`}
              onClick={() => setSelectedModuleId(m.id)}
            >
              <span className="organizer-module-code">{m.moduleCode}</span>
              <span className="organizer-module-name">{m.moduleName}</span>
            </button>
          ))}
        </nav>
      </aside>

      <main className="organizer-main">
        {error && (
          <div className="organizer-alert organizer-alert--error" role="alert">
            {error}
            <button type="button" className="organizer-alert-dismiss" onClick={() => setError('')}>
              Dismiss
            </button>
          </div>
        )}
        {toast && <div className="organizer-alert organizer-alert--ok">{toast}</div>}

        {selectedModule && (
          <header className="organizer-main-header">
            <div>
              <h1>
                {selectedModule.moduleCode}
                <span className="organizer-main-sub">{selectedModule.moduleName}</span>
              </h1>
              <p className="organizer-meta">
                Year {selectedModule.year ?? '—'} · Semester {selectedModule.semester ?? '—'} ·{' '}
                {selectedModule.credits ?? '—'} credits
              </p>
            </div>
            <Button variant="primary" className="organizer-add-btn" onClick={openAdd}>
              <FiPlus className="me-1" aria-hidden />
              Add material
            </Button>
          </header>
        )}

        <div className="organizer-filters" role="tablist" aria-label="Filter by type">
          <button
            type="button"
            className={`organizer-filter ${filterType === 'all' ? 'active' : ''}`}
            onClick={() => setFilterType('all')}
          >
            All ({resources.length})
          </button>
          {TYPE_ORDER.map((t) => {
            const cfg = TYPE_CONFIG[t];
            const count = resources.filter((r) => r.resourceType === t).length;
            return (
              <button
                key={t}
                type="button"
                className={`organizer-filter ${filterType === t ? 'active' : ''}`}
                onClick={() => setFilterType(t)}
              >
                <cfg.Icon className="organizer-filter-icon" aria-hidden />
                {cfg.label} ({count})
              </button>
            );
          })}
        </div>

        <div className="organizer-content" ref={contentRef}>
          {loadingResources ? (
            <div className="organizer-loading-inline">
              <Spinner animation="border" size="sm" /> Loading materials…
            </div>
          ) : filteredResources.length === 0 ? (
            <div className="organizer-empty-state">
              <p>No materials yet for this filter.</p>
              <Button variant="outline-primary" size="sm" onClick={openAdd}>
                Add your first item
              </Button>
            </div>
          ) : filterType === 'all' ? (
            TYPE_ORDER.map((t) => {
              const list = groupedByType.get(t) || [];
              if (!list.length) return null;
              const cfg = TYPE_CONFIG[t];
              return (
                <section key={t} className="organizer-section">
                  <h3 className="organizer-section-title">
                    <cfg.Icon className="me-2" aria-hidden />
                    {cfg.label}s
                  </h3>
                  <ul className="organizer-card-list">
                    {list.map((r) => (
                      <ResourceCard
                        key={r.id}
                        row={r}
                        onEdit={() => openEdit(r)}
                        onDelete={() => handleDelete(r.id)}
                      />
                    ))}
                  </ul>
                </section>
              );
            })
          ) : (
            <ul className="organizer-card-list">
              {filteredResources.map((r) => (
                <ResourceCard
                  key={r.id}
                  row={r}
                  onEdit={() => openEdit(r)}
                  onDelete={() => handleDelete(r.id)}
                />
              ))}
            </ul>
          )}
        </div>
      </main>

      <Modal show={showModal} onHide={() => !saving && setShowModal(false)} centered size="lg">
        <Modal.Header closeButton={!saving}>
          <Modal.Title>{editingId ? 'Edit material' : 'Add material'}</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSave}>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label>Type</Form.Label>
              <Form.Select
                value={form.resourceType}
                onChange={(e) => setForm((f) => ({ ...f, resourceType: e.target.value }))}
              >
                {TYPE_ORDER.map((t) => (
                  <option key={t} value={t}>
                    {TYPE_CONFIG[t].label}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Title</Form.Label>
              <Form.Control
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                placeholder="e.g. Week 3 slides, Lab 2 handout"
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>
                Document {!editingId && <span className="text-danger">*</span>}
              </Form.Label>
              <Form.Control
                key={fileInputKey}
                type="file"
                accept=".pdf,.doc,.docx,.xls,.xlsx,image/png,image/jpeg,image/gif,image/webp"
                required={!editingId}
                onChange={(e) => setDocumentFile(e.target.files?.[0] || null)}
                disabled={saving}
              />
              <Form.Text className="text-muted">
                {!editingId
                  ? 'Required — PDF, Word (.doc/.docx), Excel (.xls/.xlsx), or images, up to 25 MB. Saved to the database and shown below.'
                  : 'Leave empty to keep the current file, or choose a new file to replace it.'}
              </Form.Text>
              {documentFile && (
                <div className="organizer-file-picked">Selected: {documentFile.name}</div>
              )}
              {editingId && editingRow?.storedFileName && !documentFile && (
                <div className="organizer-file-existing text-muted small mt-2">
                  Current file: <strong>{editingRow.originalFileName || 'attachment'}</strong>
                </div>
              )}
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Link (optional)</Form.Label>
              <Form.Control
                type="url"
                value={form.linkUrl}
                onChange={(e) => setForm((f) => ({ ...f, linkUrl: e.target.value }))}
                placeholder="https://…"
              />
              <Form.Text className="text-muted">Opens in a new tab — lecture recordings, Drive, LMS, etc.</Form.Text>
            </Form.Group>
            <Form.Group className="mb-0">
              <Form.Label>Notes (optional)</Form.Label>
              <Form.Control
                as="textarea"
                rows={5}
                value={form.content}
                onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
                placeholder="Your summary, checklist, or reminders…"
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" type="button" disabled={saving} onClick={() => setShowModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" disabled={saving}>
              {saving ? 'Saving…' : editingId ? 'Save changes' : 'Add'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </div>
  );
}

function ResourceCard({ row, onEdit, onDelete }) {
  const cfg = TYPE_CONFIG[row.resourceType] || TYPE_CONFIG.note;
  const Icon = cfg.Icon;
  const [expanded, setExpanded] = useState(false);
  const hasBody = Boolean(row.content && row.content.trim());
  const hasLink = Boolean(row.linkUrl && row.linkUrl.trim());
  const hasFile = Boolean(row.storedFileName);
  const downloadHref = hasFile ? api.getModuleResourceDownloadUrl(row.id) : '';
  const isImageFile =
    hasFile && row.mimeType && String(row.mimeType).toLowerCase().startsWith('image/');

  return (
    <li className="organizer-card">
      <div className="organizer-card-top">
        <Badge bg={cfg.bg} text={cfg.text} className="organizer-type-badge">
          <Icon className="me-1" aria-hidden />
          {cfg.label}
        </Badge>
        <div className="organizer-card-actions">
          {hasFile && (
            <Button
              variant="outline-secondary"
              size="sm"
              href={downloadHref}
              target="_blank"
              rel="noopener noreferrer"
              as="a"
              className="me-1"
            >
              <FiDownload className="align-text-bottom" aria-hidden />{' '}
              {row.originalFileName ? 'Download' : 'File'}
            </Button>
          )}
          {hasLink && (
            <Button
              variant="outline-secondary"
              size="sm"
              href={row.linkUrl}
              target="_blank"
              rel="noopener noreferrer"
              as="a"
              className="me-1"
            >
              <FiExternalLink className="align-text-bottom" aria-hidden /> Open
            </Button>
          )}
          <Button variant="outline-primary" size="sm" className="me-1" onClick={onEdit}>
            <FiEdit3 aria-hidden /> Edit
          </Button>
          <Button variant="outline-danger" size="sm" onClick={onDelete}>
            <FiTrash2 aria-hidden />
          </Button>
        </div>
      </div>
      <div className="organizer-card-title">{row.title}</div>
      {isImageFile && (
        <a
          href={downloadHref}
          target="_blank"
          rel="noopener noreferrer"
          className="organizer-doc-thumb-wrap"
        >
          <img src={downloadHref} alt="" className="organizer-doc-preview" />
        </a>
      )}
      {hasFile && !isImageFile && row.originalFileName && (
        <div className="organizer-file-label text-muted small">{row.originalFileName}</div>
      )}
      {hasBody && (
        <>
          <button
            type="button"
            className="organizer-toggle-notes"
            onClick={() => setExpanded((x) => !x)}
            aria-expanded={expanded}
          >
            {expanded ? 'Hide notes' : 'Show notes'}
          </button>
          {expanded && <pre className="organizer-notes">{row.content}</pre>}
        </>
      )}
    </li>
  );
}

export default ModuleOrganizer;
