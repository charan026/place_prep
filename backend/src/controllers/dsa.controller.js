const pool = require('../config/db');

const getQuestions = async (req, res, next) => {
  try {
    const { topic, difficulty, search } = req.query;

    let query = 'SELECT * FROM dsa_questions WHERE 1=1';
    const params = [];

    if (topic) {
      params.push(topic);
      query += ` AND topic = $${params.length}`;
    }

    if (difficulty) {
      params.push(difficulty);
      query += ` AND difficulty = $${params.length}`;
    }

    if (search) {
      params.push(`%${search}%`);
      query += ` AND title ILIKE $${params.length}`;
    }

    query += ' ORDER BY topic, difficulty, title';

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    next(error);
  }
};

const getQuestionById = async (req, res, next) => {
  try {
    const result = await pool.query('SELECT * FROM dsa_questions WHERE id = $1', [req.params.id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Question not found.' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    next(error);
  }
};

const updateProgress = async (req, res, next) => {
  try {
    const { question_id, status, notes } = req.body;

    if (!question_id || !status) {
      return res.status(400).json({ error: 'question_id and status are required.' });
    }

    const solvedAt = status === 'solved' ? new Date().toISOString() : null;

    const result = await pool.query(
      `INSERT INTO user_dsa_progress (user_id, question_id, status, notes, solved_at)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (user_id, question_id)
       DO UPDATE SET status = $3, notes = COALESCE($4, notes), solved_at = COALESCE($5, solved_at)
       RETURNING *`,
      [req.user.id, question_id, status, notes || null, solvedAt]
    );

    res.json(result.rows[0]);
  } catch (error) {
    next(error);
  }
};

const getProgress = async (req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT p.*, q.title, q.difficulty, q.topic, q.platform, q.url, q.company_tags
       FROM user_dsa_progress p
       JOIN dsa_questions q ON p.question_id = q.id
       WHERE p.user_id = $1
       ORDER BY p.solved_at DESC NULLS LAST`,
      [req.user.id]
    );

    res.json(result.rows);
  } catch (error) {
    next(error);
  }
};

const getProgressStats = async (req, res, next) => {
  try {
    // Topic-wise stats
    const topicStats = await pool.query(
      `SELECT
         q.topic,
         SUM(CASE WHEN p.status = 'solved' THEN 1 ELSE 0 END) as solved,
         SUM(CASE WHEN p.status = 'attempted' THEN 1 ELSE 0 END) as attempted,
         SUM(CASE WHEN p.status = 'todo' THEN 1 ELSE 0 END) as todo,
         (SELECT COUNT(*) FROM dsa_questions WHERE topic = q.topic) as total
       FROM dsa_questions q
       LEFT JOIN user_dsa_progress p ON q.id = p.question_id AND p.user_id = $1
       GROUP BY q.topic
       ORDER BY q.topic`,
      [req.user.id]
    );

    // Difficulty-wise stats
    const difficultyStats = await pool.query(
      `SELECT
         q.difficulty,
         SUM(CASE WHEN p.status = 'solved' THEN 1 ELSE 0 END) as solved,
         (SELECT COUNT(*) FROM dsa_questions WHERE difficulty = q.difficulty) as total
       FROM dsa_questions q
       LEFT JOIN user_dsa_progress p ON q.id = p.question_id AND p.user_id = $1
       GROUP BY q.difficulty`,
      [req.user.id]
    );

    // Overall counts
    const overall = await pool.query(
      `SELECT
         SUM(CASE WHEN status = 'solved' THEN 1 ELSE 0 END) as solved,
         SUM(CASE WHEN status = 'attempted' THEN 1 ELSE 0 END) as attempted,
         SUM(CASE WHEN status = 'todo' THEN 1 ELSE 0 END) as todo
       FROM user_dsa_progress WHERE user_id = $1`,
      [req.user.id]
    );

    const totalQuestions = await pool.query('SELECT COUNT(*) as total FROM dsa_questions');

    res.json({
      topic_stats: topicStats.rows,
      difficulty_stats: difficultyStats.rows,
      overall: {
        solved: parseInt(overall.rows[0]?.solved || 0),
        attempted: parseInt(overall.rows[0]?.attempted || 0),
        todo: parseInt(overall.rows[0]?.todo || 0),
        total: parseInt(totalQuestions.rows[0]?.total || 0),
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getQuestions, getQuestionById, updateProgress, getProgress, getProgressStats };
