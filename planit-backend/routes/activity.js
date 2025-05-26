const express = require('express');
const router = express.Router();
const  verifyToken  = require('../middleware/auth');
const Trip = require('../models/Trip');
const Activity = require('../models/Activity');

// Add an activity to a trip
router.post('/:tripId', verifyToken, async (req, res) => {
  const { tripId } = req.params;
  const { title, date, category, cost, notes } = req.body;

  try {
    const trip = await Trip.findById(tripId);
    if (!trip || !trip.participants.includes(req.userId)) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const activity = new Activity({
      trip: tripId,
      title,
      date,
      category,
      cost,
      notes,
      votes: []
    });

    await activity.save();
    res.status(201).json(activity);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get all activities for a trip
router.get('/:tripId', verifyToken, async (req, res) => {
  const { tripId } = req.params;

  try {
    const trip = await Trip.findById(tripId);
    if (!trip || !trip.participants.includes(req.userId)) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const activities = await Activity.find({ trip: tripId }).sort({ date: 1 });
    res.json(activities);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Toggle vote
router.patch('/:activityId/vote', verifyToken, async (req, res) => {
  const { activityId } = req.params;

  try {
    const activity = await Activity.findById(activityId);
    if (!activity) return res.status(404).json({ message: 'Not found' });

    const index = activity.votes.indexOf(req.userId);
    if (index === -1) {
      activity.votes.push(req.userId);
    } else {
      activity.votes.splice(index, 1);
    }

    await activity.save();
    res.json(activity);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
