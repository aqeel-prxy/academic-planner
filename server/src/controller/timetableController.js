const Event = require('../models/Event');

const listTimetables = async (req, res) => {
  try {
    const rows = await Event.findAll({
      attributes: ['timetableKey'],
      group: ['timetableKey']
    });

    const keys = new Set(['default']);
    rows.forEach((r) => {
      const k = r.timetableKey || r.get?.('timetableKey');
      if (k) keys.add(k);
    });

    const list = Array.from(keys).map((key) => ({
      key,
      name: key === 'default' ? 'My Week' : key.replace(/-/g, ' ')
    }));

    list.sort((a, b) => {
      if (a.key === 'default') return -1;
      if (b.key === 'default') return 1;
      return a.name.localeCompare(b.name);
    });

    res.json(list);
  } catch (error) {
    console.error('Error listing timetables:', error);
    res.status(500).json({ error: 'Failed to load timetables' });
  }
};

const coursesForTimetable = async (req, res) => {
  try {
    const { timetableKey } = req.params;
    const events = await Event.findAll({
      where: { timetableKey: timetableKey || 'default' },
      attributes: ['courseCode']
    });
    const codes = [...new Set(events.map((e) => e.courseCode).filter(Boolean))];
    res.json(codes.sort((a, b) => a.localeCompare(b)));
  } catch (error) {
    console.error('Error loading timetable courses:', error);
    res.status(500).json({ error: 'Failed to load courses' });
  }
};

module.exports = { listTimetables, coursesForTimetable };
