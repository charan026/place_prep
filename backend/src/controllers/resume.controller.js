const pool = require('../config/db');
const geminiService = require('../services/gemini.service');
const fs = require('fs');
const pdf = require('pdf-parse');

const uploadResume = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded. Please upload a PDF file.' });
    }

    // Extract text from PDF immediately on upload
    let resumeText = '';
    try {
      const dataBuffer = fs.readFileSync(req.file.path);
      const pdfData = await pdf(dataBuffer);
      resumeText = pdfData.text;
    } catch (parseError) {
      console.error('Failed to extract text from uploaded PDF:', parseError.message);
    }

    const result = await pool.query(
      `INSERT INTO resumes (user_id, filename, file_path, resume_text)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [req.user.id, req.file.originalname, req.file.path, resumeText || null]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    next(error);
  }
};

const getResumes = async (req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT r.*, ra.overall_score, ra.ats_score, ra.analyzed_at
       FROM resumes r
       LEFT JOIN resume_analyses ra ON r.id = ra.resume_id
       WHERE r.user_id = $1
       ORDER BY r.uploaded_at DESC`,
      [req.user.id]
    );

    res.json(result.rows);
  } catch (error) {
    next(error);
  }
};

const analyzeResume = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Get resume
    const resumeResult = await pool.query(
      'SELECT * FROM resumes WHERE id = $1 AND user_id = $2',
      [id, req.user.id]
    );

    if (resumeResult.rows.length === 0) {
      return res.status(404).json({ error: 'Resume not found.' });
    }

    const resume = resumeResult.rows[0];

    // Use extracted text from DB, or fallback to file reading
    let resumeText = resume.resume_text;

    if (!resumeText || resumeText.trim().length < 50) {
      if (fs.existsSync(resume.file_path)) {
        try {
          const dataBuffer = fs.readFileSync(resume.file_path);
          const pdfData = await pdf(dataBuffer);
          resumeText = pdfData.text;
          
          // Save extracted text to DB for future calls
          if (resumeText && resumeText.trim().length >= 50) {
            await pool.query('UPDATE resumes SET resume_text = $1 WHERE id = $2', [resumeText, id]);
          }
        } catch (parseError) {
          return res.status(400).json({ error: 'Could not extract text from the PDF file on disk.' });
        }
      } else {
        return res.status(400).json({ error: 'Resume text is not available and the PDF file is no longer on the server. Please re-upload your resume.' });
      }
    }

    if (!resumeText || resumeText.trim().length < 50) {
      return res.status(400).json({ error: 'Could not extract sufficient text from the PDF. Please upload a text-based PDF.' });
    }

    // Analyze with Gemini
    const { success, analysis, rawResponse, error } = await geminiService.analyzeResume(resumeText);

    if (!success) {
      return res.status(500).json({ error: `AI analysis failed: ${error}` });
    }

    // Store analysis
    const analysisResult = await pool.query(
      `INSERT INTO resume_analyses (resume_id, overall_score, ats_score, strengths, weaknesses, suggestions, raw_analysis)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [
        id,
        analysis.overall_score,
        analysis.ats_score,
        JSON.stringify(analysis.strengths),
        JSON.stringify(analysis.weaknesses),
        JSON.stringify(analysis.suggestions),
        rawResponse,
      ]
    );

    res.json(analysisResult.rows[0]);
  } catch (error) {
    next(error);
  }
};

const getAnalysis = async (req, res, next) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `SELECT ra.* FROM resume_analyses ra
       JOIN resumes r ON ra.resume_id = r.id
       WHERE r.id = $1 AND r.user_id = $2
       ORDER BY ra.analyzed_at DESC LIMIT 1`,
      [id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'No analysis found for this resume.' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    next(error);
  }
};

module.exports = { uploadResume, getResumes, analyzeResume, getAnalysis };
