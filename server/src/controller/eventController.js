const Event = require('../models/Event');
const { validationResult } = require('express-validator');
const { Op } = require('sequelize');

// GET all events (optional ?timetableKey=default)
const getAllEvents = async (req, res) => {
  try {
    const timetableKey = req.query.timetableKey || 'default';
    const events = await Event.findAll({
      where: { timetableKey },
      order: [['start', 'ASC']]
    });
    res.json(events);
  } catch (error) {
    console.error('Error fetching events:', error);
    res.status(500).json({ error: 'Failed to fetch events' });
  }
};

// GET single event by ID
const getEventById = async (req, res) => {
  try {
    const event = await Event.findByPk(req.params.id);
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }
    res.json(event);
  } catch (error) {
    console.error('Error fetching event:', error);
    res.status(500).json({ error: 'Failed to fetch event' });
  }
};

// CREATE new event
const createEvent = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // Check for conflicts
    const { start, end } = req.body;
    
    const timetableKey = req.body.timetableKey || 'default';

    const conflictingEvent = await Event.findOne({
      where: {
        timetableKey,
        [Op.or]: [
          {
            start: { [Op.between]: [start, end] }
          },
          {
            end: { [Op.between]: [start, end] }
          }
        ]
      }
    });

    if (conflictingEvent) {
      return res.status(409).json({ 
        error: 'Time slot conflict with existing event',
        conflictingEvent 
      });
    }

    const { id: bodyId, ...data } = req.body;
    const event = await Event.create({
      id: (bodyId && bodyId !== 'null') ? bodyId : Date.now().toString(),
      ...data,
      timetableKey: data.timetableKey || 'default'
    });
    res.status(201).json(event);
  } catch (error) {
    console.error('Error creating event:', error);
    res.status(500).json({ error: 'Failed to create event' });
  }
};

// UPDATE event
const updateEvent = async (req, res) => {
  try {
    const event = await Event.findByPk(req.params.id);
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    const start = req.body.start !== undefined ? req.body.start : event.start;
    const end = req.body.end !== undefined ? req.body.end : event.end;

    const timetableKey = req.body.timetableKey !== undefined
      ? req.body.timetableKey
      : event.timetableKey;

    if (start != null && end != null) {
      const conflictingEvent = await Event.findOne({
        where: {
          id: { [Op.ne]: req.params.id },
          timetableKey: timetableKey || 'default',
          [Op.or]: [
            {
              start: { [Op.between]: [start, end] }
            },
            {
              end: { [Op.between]: [start, end] }
            }
          ]
        }
      });

      if (conflictingEvent) {
        return res.status(409).json({
          error: 'Time slot conflict with existing event',
          conflictingEvent
        });
      }
    }

    await event.update(req.body);
    res.json(event);
  } catch (error) {
    console.error('Error updating event:', error);
    res.status(500).json({ error: 'Failed to update event' });
  }
};

// DELETE event
const deleteEvent = async (req, res) => {
  try {
    const event = await Event.findByPk(req.params.id);
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    await event.destroy();
    res.json({ message: 'Event deleted successfully' });
  } catch (error) {
    console.error('Error deleting event:', error);
    res.status(500).json({ error: 'Failed to delete event' });
  }
};

// DELETE all events (for testing)
const deleteAllEvents = async (req, res) => {
  try {
    await Event.destroy({ where: {} });
    res.json({ message: 'All events deleted successfully' });
  } catch (error) {
    console.error('Error deleting all events:', error);
    res.status(500).json({ error: 'Failed to delete events' });
  }
};

// Export ALL functions
module.exports = {
  getAllEvents,
  getEventById,
  createEvent,
  updateEvent,
  deleteEvent,
  deleteAllEvents
};