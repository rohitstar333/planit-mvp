const express = require('express');
const router = express.Router();
const Trip = require('../models/Trip');
const auth = require('../middleware/auth');

// Create trip
router.post('/', auth, async (req, res) => {
  const { name, startDate, endDate, budget } = req.body;
  const trip = new Trip({
    name,
    startDate,
    endDate,
    budget,
    creator: req.user,
    participants: [req.user],
    activities: []
  });
  await trip.save();
  res.json(trip);
});

// Get user's trips
router.get('/', auth, async (req, res) => {
  const trips = await Trip.find({ participants: req.user });
  res.json(trips);
});

// Add activity to a trip
router.post('/:tripId/activity', auth, async (req, res) => {
  const { title, date, time, category, estimatedCost, notes } = req.body;
  const trip = await Trip.findById(req.params.tripId);
  if (!trip) return res.status(404).json({ msg: 'Trip not found' });
  trip.activities.push({ title, date, time, category, estimatedCost, notes, votes: [] });
  await trip.save();
  res.json(trip.activities);
});

// Get activities for a trip
router.get('/:tripId/activity', auth, async (req, res) => {
  const trip = await Trip.findById(req.params.tripId);
  if (!trip) return res.status(404).json({ msg: 'Trip not found' });
  res.json(trip.activities);
});

// Vote/unvote for an activity
router.post('/:tripId/activity/:activityIndex/vote', auth, async (req, res) => {
  const trip = await Trip.findById(req.params.tripId);
  if (!trip) return res.status(404).json({ msg: 'Trip not found' });
  const activity = trip.activities[req.params.activityIndex];
  if (!activity) return res.status(404).json({ msg: 'Activity not found' });

  const userId = req.user.toString();
  const votes = activity.votes.map(v => v.toString());
  
  if (votes.includes(userId)) {
    // Remove user's vote
    activity.votes = activity.votes.filter(v => v.toString() !== userId);
  } else {
    // Add user's vote
    activity.votes.push(req.user);
  }

  await trip.save();
  // Return the updated activity so frontend can update immediately
  res.json(activity);
});

// Join a trip by code (trip ID)
router.post('/join', auth, async (req, res) => {
  const { code } = req.body; // code = tripId
  const trip = await Trip.findById(code);
  if (!trip) return res.status(404).json({ msg: 'Trip not found' });
  if (!trip.participants.includes(req.user)) {
    trip.participants.push(req.user);
    await trip.save();
  }
  res.json({ msg: 'Joined trip!', trip });
});

module.exports = router;
