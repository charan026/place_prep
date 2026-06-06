const express = require('express');
const router = express.Router();
const { createExperience, getExperiences, getExperienceById, getCompanies } = require('../controllers/experience.controller');
const auth = require('../middleware/auth');

router.post('/', auth, createExperience);
router.get('/', auth, getExperiences);
router.get('/companies', auth, getCompanies);
router.get('/:id', auth, getExperienceById);

module.exports = router;
