const Module = require('../models/Module');
const ModuleResource = require('../models/ModuleResource');

const ALLOWED_TYPES = require('../models/ModuleResource').RESOURCE_TYPES;

async function ensureModuleExists(moduleId) {
  const mod = await Module.findByPk(moduleId);
  return mod;
}

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
    const { moduleId, resourceType, title, content, linkUrl, sortOrder } = req.body;
    const mod = await ensureModuleExists(moduleId);
    if (!mod) {
      return res.status(404).json({ error: 'Module not found' });
    }
    const titleTrimmed = String(title ?? '').trim();
    if (!titleTrimmed) {
      return res.status(400).json({ error: 'Title is required' });
    }
    const type = resourceType || 'note';
    if (!ALLOWED_TYPES.includes(type)) {
      return res.status(400).json({ error: 'Invalid resourceType', allowed: ALLOWED_TYPES });
    }
    const row = await ModuleResource.create({
      moduleId,
      resourceType: type,
      title: titleTrimmed,
      content:
        content != null && String(content).trim() !== '' ? String(content) : null,
      linkUrl: linkUrl != null && String(linkUrl).trim() ? String(linkUrl).trim() : null,
      sortOrder: sortOrder != null ? parseInt(sortOrder, 10) || 0 : 0
    });
    res.status(201).json(row);
  } catch (error) {
    console.error('Error creating module resource:', error);
    res.status(500).json({ error: 'Failed to create resource', message: error.message });
  }
};

exports.update = async (req, res) => {
  try {
    const row = await ModuleResource.findByPk(req.params.id);
    if (!row) {
      return res.status(404).json({ error: 'Resource not found' });
    }
    const { resourceType, title, content, linkUrl, sortOrder } = req.body;
    const patch = {};
    if (resourceType !== undefined) {
      if (!ALLOWED_TYPES.includes(resourceType)) {
        return res.status(400).json({ error: 'Invalid resourceType', allowed: ALLOWED_TYPES });
      }
      patch.resourceType = resourceType;
    }
    if (title !== undefined) {
      const t = String(title).trim();
      if (!t) {
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
    await row.update(patch);
    res.status(200).json(row);
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
    await row.destroy();
    res.status(200).json({ message: 'Resource deleted' });
  } catch (error) {
    console.error('Error deleting module resource:', error);
    res.status(500).json({ error: 'Failed to delete resource', message: error.message });
  }
};
