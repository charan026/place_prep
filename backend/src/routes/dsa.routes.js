const express = require('express');
const router = express.Router();
const { getQuestions, getQuestionById, updateProgress, getProgress, getProgressStats, toggleBookmark, getBookmarks } = require('../controllers/dsa.controller');
const auth = require('../middleware/auth');

router.get('/questions', auth, getQuestions);
router.get('/questions/:id', auth, getQuestionById);
router.post('/progress', auth, updateProgress);
router.get('/progress', auth, getProgress);
router.get('/progress/stats', auth, getProgressStats);
router.post('/bookmarks/toggle', auth, toggleBookmark);
router.get('/bookmarks', auth, getBookmarks);

module.exports = router;
