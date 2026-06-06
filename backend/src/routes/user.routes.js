const express = require('express');
const router = express.Router();
const { getProfile, updateProfile } = require('../controllers/user.controller');
const auth = require('../middleware/auth');

router.get('/profile', auth, getProfile);
router.put('/profile', auth, updateProfile);

module.exports = router;
