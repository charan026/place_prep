const express = require('express');
const router = express.Router();
const { startInterview, getInterview, submitAnswer, completeInterview, getHistory } = require('../controllers/interview.controller');
const auth = require('../middleware/auth');

router.post('/start', auth, startInterview);
router.get('/history', auth, getHistory);
router.get('/:id', auth, getInterview);
router.post('/:id/answer', auth, submitAnswer);
router.post('/:id/complete', auth, completeInterview);

module.exports = router;
