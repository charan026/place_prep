const express = require('express');
const router = express.Router();
const { getProfile, updateProfile, getDailyGoal, setDailyGoal } = require('../controllers/user.controller');
const auth = require('../middleware/auth');

router.get('/profile', auth, getProfile);
router.put('/profile', auth, updateProfile);
router.get('/daily-goal', auth, getDailyGoal);
router.put('/daily-goal', auth, setDailyGoal);

module.exports = router;
