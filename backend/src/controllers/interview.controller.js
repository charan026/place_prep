const pool = require('../config/db');
const geminiService = require('../services/gemini.service');

const startInterview = async (req, res, next) => {
  try {
    const { role, difficulty } = req.body;

    if (!role) {
      return res.status(400).json({ error: 'Role is required to start a mock interview.' });
    }

    // Generate questions via Gemini AI
    const { success, questions, error } = await geminiService.generateInterviewQuestions(role, difficulty || 'medium');

    if (!success) {
      return res.status(500).json({ error: `Failed to generate questions: ${error}` });
    }

    // Store interview session
    const result = await pool.query(
      `INSERT INTO mock_interviews (user_id, role, difficulty, questions, status)
       VALUES ($1, $2, $3, $4, 'in_progress') RETURNING *`,
      [req.user.id, role, difficulty || 'medium', JSON.stringify(questions)]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    next(error);
  }
};

const getInterview = async (req, res, next) => {
  try {
    const { id } = req.params;

    const interview = await pool.query(
      'SELECT * FROM mock_interviews WHERE id = $1 AND user_id = $2',
      [id, req.user.id]
    );

    if (interview.rows.length === 0) {
      return res.status(404).json({ error: 'Interview not found.' });
    }

    // Get answers for this interview
    const answers = await pool.query(
      'SELECT * FROM interview_answers WHERE interview_id = $1 ORDER BY question_index',
      [id]
    );

    res.json({
      ...interview.rows[0],
      answers: answers.rows,
    });
  } catch (error) {
    next(error);
  }
};

const submitAnswer = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { question_index, answer_text } = req.body;

    if (question_index === undefined || !answer_text) {
      return res.status(400).json({ error: 'question_index and answer_text are required.' });
    }

    // Get interview
    const interview = await pool.query(
      'SELECT * FROM mock_interviews WHERE id = $1 AND user_id = $2',
      [id, req.user.id]
    );

    if (interview.rows.length === 0) {
      return res.status(404).json({ error: 'Interview not found.' });
    }

    const interviewData = interview.rows[0];

    if (interviewData.status === 'completed') {
      return res.status(400).json({ error: 'This interview is already completed.' });
    }

    const questions = interviewData.questions;
    if (question_index < 0 || question_index >= questions.length) {
      return res.status(400).json({ error: 'Invalid question index.' });
    }

    const question = questions[question_index].question;

    // Get AI feedback
    const { success, evaluation } = await geminiService.evaluateAnswer(
      question,
      answer_text,
      interviewData.role
    );

    // Store answer
    const result = await pool.query(
      `INSERT INTO interview_answers (interview_id, question_index, answer_text, ai_feedback, score)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [
        id,
        question_index,
        answer_text,
        success ? JSON.stringify(evaluation) : 'Feedback unavailable',
        success ? evaluation.score : null,
      ]
    );

    res.json(result.rows[0]);
  } catch (error) {
    next(error);
  }
};

const completeInterview = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Get interview with answers
    const interview = await pool.query(
      'SELECT * FROM mock_interviews WHERE id = $1 AND user_id = $2',
      [id, req.user.id]
    );

    if (interview.rows.length === 0) {
      return res.status(404).json({ error: 'Interview not found.' });
    }

    const answers = await pool.query(
      'SELECT * FROM interview_answers WHERE interview_id = $1 ORDER BY question_index',
      [id]
    );

    const interviewData = interview.rows[0];
    const questions = interviewData.questions;

    // Build Q&A pairs for overall feedback
    const questionsAndAnswers = answers.rows.map((a) => ({
      question: questions[a.question_index]?.question || 'Unknown question',
      answer: a.answer_text,
      score: a.score || 0,
    }));

    // Get overall AI feedback
    const { success, feedback } = await geminiService.generateOverallFeedback(
      interviewData.role,
      questionsAndAnswers
    );

    // Update interview as completed
    const result = await pool.query(
      `UPDATE mock_interviews SET
        status = 'completed',
        overall_score = $1,
        overall_feedback = $2,
        completed_at = NOW()
       WHERE id = $3 RETURNING *`,
      [
        success ? feedback.overall_score : null,
        success ? JSON.stringify(feedback) : null,
        id,
      ]
    );

    res.json({
      ...result.rows[0],
      answers: answers.rows,
      overall_feedback: success ? feedback : null,
    });
  } catch (error) {
    next(error);
  }
};

const getHistory = async (req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT id, role, difficulty, status, overall_score, started_at, completed_at,
              jsonb_array_length(questions) as question_count
       FROM mock_interviews
       WHERE user_id = $1
       ORDER BY started_at DESC`,
      [req.user.id]
    );

    res.json(result.rows);
  } catch (error) {
    next(error);
  }
};

module.exports = { startInterview, getInterview, submitAnswer, completeInterview, getHistory };
