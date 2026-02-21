const Event = require('../models/Event');
const { validationResult } = require('express-validator');
const { Op } = require('sequelize');

// GET all events
const getAllEvents = async (req, res) => {
  try {
    const events = await Event.findAll({
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
    
    const conflictingEvent = await Event.findOne({
      where: {
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
      ...data
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

    // Check for conflicts (excluding this event)
    const { start, end } = req.body;
    
    const conflictingEvent = await Event.findOne({
      where: {
        id: { [Op.ne]: req.params.id },
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