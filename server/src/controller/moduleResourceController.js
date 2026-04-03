const fs = require('fs');
const path = require('path');
const Module = require('../models/Module');
const ModuleResource = require('../models/ModuleResource');
const { uploadDir } = require('../middleware/uploadModuleResource');

const ALLOWED_TYPES = require('../models/ModuleResource').RESOURCE_TYPES;

function removeStoredFile(storedFileName) {
  if (!storedFileName) return;
  const base = path.basename(storedFileName);
  const full = path.join(uploadDir, base);
  const resolvedDir = path.resolve(uploadDir);
  const resolvedFile = path.resolve(full);
  if (!resolvedFile.startsWith(resolvedDir)) return;
  if (fs.existsSync(resolvedFile)) {
    try {
      fs.unlinkSync(resolvedFile);
    } catch (e) {
      console.error('Failed to delete file:', e.message);
    }
  }
}

async function ensureModuleExists(moduleId) {
  const mod = await Module.findByPk(moduleId);
  return mod;
}

exports.download = async (req, res) => {
  try {
    const row = await ModuleResource.findByPk(req.params.id);
    if (!row || !row.storedFileName) {
      return res.status(404).json({ error: 'File not found' });
    }
    const base = path.basename(row.storedFileName);
    const full = path.join(uploadDir, base);
    const resolvedDir = path.resolve(uploadDir);
    const resolvedFile = path.resolve(full);
    if (!resolvedFile.startsWith(resolvedDir) || !fs.existsSync(resolvedFile)) {
      return res.status(404).json({ error: 'File missing on disk' });
    }
    const name = row.originalFileName || base;
    const disposition =
      row.mimeType && row.mimeType.startsWith('image/') ? 'inline' : 'attachment';
    res.setHeader('Content-Type', row.mimeType || 'application/octet-stream');
    res.setHeader(
      'Content-Disposition',
      `${disposition}; filename*=UTF-8''${encodeURIComponent(name)}`
    );
    return res.sendFile(resolvedFile);
  } catch (error) {
    console.error('Error downloading resource file:', error);
    res.status(500).json({ error: 'Failed to download file', message: error.message });
  }
};

exports.listByModule = async (req, res) => {
  try {
    const { moduleId } = req.query;
    if (!moduleId) {
      return res.status(400).json({ error: 'moduleId query parameter is required' });
    }
    const mod = await ensureModuleExists(moduleId);
    if (!mod) {
      return res.status(404).json({ error: 'Module not found' });
    }
    const rows = await ModuleResource.findAll({
      where: { moduleId },
      order: [
        ['sortOrder', 'ASC'],
        ['createdAt', 'DESC']
      ]
    });
    res.status(200).json(rows);
  } catch (error) {
    console.error('Error listing module resources:', error);
    res.status(500).json({ error: 'Failed to list resources', message: error.message });
  }
};

exports.create = async (req, res) => {
  try {
    const body = req.body || {};
    const { moduleId, resourceType, title, content, linkUrl, sortOrder } = body;
    const mod = await ensureModuleExists(moduleId);
    if (!mod) {
      if (req.file) removeStoredFile(req.file.filename);
      return res.status(404).json({ error: 'Module not found' });
    }
    const titleTrimmed = String(title ?? '').trim();
    if (!titleTrimmed) {
      if (req.file) removeStoredFile(req.file.filename);
      return res.status(400).json({ error: 'Title is required' });
    }
    const type = resourceType || 'note';
    if (!ALLOWED_TYPES.includes(type)) {
      if (req.file) removeStoredFile(req.file.filename);
      return res.status(400).json({ error: 'Invalid resourceType', allowed: ALLOWED_TYPES });
    }

    if (!req.file) {
      return res.status(400).json({
        error:
          'A document file is required. Upload a PDF, Word, Excel, or image using the form field named "document".'
      });
    }

    const filePayload = {
      storedFileName: req.file.filename,
      originalFileName: req.file.originalname || req.file.filename,
      mimeType: req.file.mimetype || null
    };

    let row;
    try {
      row = await ModuleResource.create({
        moduleId,
        resourceType: type,
        title: titleTrimmed,
        content:
          content != null && String(content).trim() !== '' ? String(content) : null,
        linkUrl: linkUrl != null && String(linkUrl).trim() ? String(linkUrl).trim() : null,
        sortOrder: sortOrder != null ? parseInt(sortOrder, 10) || 0 : 0,
        ...filePayload
      });
    } catch (err) {
      if (req.file) removeStoredFile(req.file.filename);
      throw err;
    }
    res.status(201).json(row);
  } catch (error) {
    console.error('Error creating module resource:', error);
    const sqlMsg = error.parent?.message || error.original?.message;
    res.status(500).json({
      error: 'Failed to create resource',
      message: sqlMsg || error.message
    });
  }
};

exports.update = async (req, res) => {
  try {
    const row = await ModuleResource.findByPk(req.params.id);
    if (!row) {
      if (req.file) removeStoredFile(req.file.filename);
      return res.status(404).json({ error: 'Resource not found' });
    }
    const body = req.body || {};
    const { resourceType, title, content, linkUrl, sortOrder } = body;
    const patch = {};
    if (resourceType !== undefined) {
      if (!ALLOWED_TYPES.includes(resourceType)) {
        if (req.file) removeStoredFile(req.file.filename);
        return res.status(400).json({ error: 'Invalid resourceType', allowed: ALLOWED_TYPES });
      }
      patch.resourceType = resourceType;
    }
    if (title !== undefined) {
      const t = String(title).trim();
      if (!t) {
        if (req.file) removeStoredFile(req.file.filename);
        return res.status(400).json({ error: 'Title cannot be empty' });
      }
      patch.title = t;
    }
    if (content !== undefined) patch.content = content == null || content === '' ? null : String(content);
    if (linkUrl !== undefined) {
      patch.linkUrl =
        linkUrl == null || String(linkUrl).trim() === '' ? null : String(linkUrl).trim();
    }
    if (sortOrder !== undefined) patch.sortOrder = parseInt(sortOrder, 10) || 0;

    if (req.file) {
      removeStoredFile(row.storedFileName);
      patch.storedFileName = req.file.filename;
      patch.originalFileName = req.file.originalname || req.file.filename;
      patch.mimeType = req.file.mimetype || null;
    }

    try {
      await row.update(patch);
    } catch (err) {
      if (req.file) removeStoredFile(req.file.filename);
      throw err;
    }
    const fresh = await ModuleResource.findByPk(row.id);
    res.status(200).json(fresh);
  } catch (error) {
    console.error('Error updating module resource:', error);
    res.status(500).json({ error: 'Failed to update resource', message: error.message });
  }
};

exports.destroy = async (req, res) => {
  try {
    const row = await ModuleResource.findByPk(req.params.id);
    if (!row) {
      return res.status(404).json({ error: 'Resource not found' });
    }
    removeStoredFile(row.storedFileName);
    await row.destroy();
    res.status(200).json({ message: 'Resource deleted' });
  } catch (error) {
    console.error('Error deleting module resource:', error);
    res.status(500).json({ error: 'Failed to delete resource', message: error.message });
  }
};
