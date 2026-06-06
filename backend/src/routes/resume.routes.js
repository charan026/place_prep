const express = require('express');
const router = express.Router();
const { uploadResume, getResumes, analyzeResume, getAnalysis } = require('../controllers/resume.controller');
const auth = require('../middleware/auth');
const upload = require('../middleware/upload');

router.post('/upload', auth, upload.single('resume'), uploadResume);
router.get('/', auth, getResumes);
router.post('/:id/analyze', auth, analyzeResume);
router.get('/:id/analysis', auth, getAnalysis);

module.exports = router;
