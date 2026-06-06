const express = require('express');
const router = express.Router();
const { getOverview, getDSAProgress, getActivity, getInterviewAnalytics } = require('../controllers/analytics.controller');
const auth = require('../middleware/auth');

router.get('/overview', auth, getOverview);
router.get('/dsa-progress', auth, getDSAProgress);
router.get('/activity', auth, getActivity);
router.get('/interviews', auth, getInterviewAnalytics);

module.exports = router;
