const { Op } = require('sequelize');
const Attendance = require('../models/Attendance');

const list = async (req, res) => {
  try {
    const timetableKey = req.query.timetableKey || 'default';
    const rows = await Attendance.findAll({
      where: { timetableKey },
      order: [['moduleName', 'ASC']]
    });
    res.json(rows.map((r) => (r.get ? r.get({ plain: true }) : r)));
  } catch (error) {
    console.error('Error listing attendance:', error);
    res.status(500).json({ error: 'Failed to load attendance' });
  }
};

const upsert = async (req, res) => {
  try {
    const { timetableKey = 'default', moduleName, requiredLectures = 0, attendedLectures = 0 } = req.body;
    if (!moduleName || typeof moduleName !== 'string' || !moduleName.trim()) {
      return res.status(400).json({ error: 'moduleName is required' });
    }

    const name = moduleName.trim();
    const [row, created] = await Attendance.findOrCreate({
      where: { timetableKey, moduleName: name },
      defaults: {
        requiredLectures: Number(requiredLectures) || 0,
        attendedLectures: Number(attendedLectures) || 0
      }
    });

    if (!created) {
      await row.update({
        requiredLectures: Number(requiredLectures) || 0,
        attendedLectures: Number(attendedLectures) || 0
      });
    }

    res.status(created ? 201 : 200).json(row.get({ plain: true }));
  } catch (error) {
    console.error('Error upserting attendance:', error);
    res.status(500).json({ error: 'Failed to save attendance' });
  }
};

const update = async (req, res) => {
  try {
    const row = await Attendance.findByPk(req.params.id);
    if (!row) {
      return res.status(404).json({ error: 'Record not found' });
    }

    const patch = {};
    if (req.body.moduleName !== undefined) patch.moduleName = String(req.body.moduleName).trim();
    if (req.body.requiredLectures !== undefined) patch.requiredLectures = Number(req.body.requiredLectures) || 0;
    if (req.body.attendedLectures !== undefined) patch.attendedLectures = Number(req.body.attendedLectures) || 0;

    await row.update(patch);
    res.json(row.get({ plain: true }));
  } catch (error) {
    console.error('Error updating attendance:', error);
    res.status(500).json({ error: 'Failed to update attendance' });
  }
};

const remove = async (req, res) => {
  try {
    const row = await Attendance.findByPk(req.params.id);
    if (!row) {
      return res.status(404).json({ error: 'Record not found' });
    }
    await row.destroy();
    res.json({ message: 'Deleted' });
  } catch (error) {
    console.error('Error deleting attendance:', error);
    res.status(500).json({ error: 'Failed to delete attendance' });
  }
};

module.exports = { list, upsert, update, remove };
