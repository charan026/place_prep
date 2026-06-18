const pool = require('../config/db');

const getProfile = async (req, res, next) => {
  try {
    const result = await pool.query(
      'SELECT id, name, email, avatar_url, college, graduation_year, target_role, created_at FROM users WHERE id = $1',
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found.' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    next(error);
  }
};

const updateProfile = async (req, res, next) => {
  try {
    const { name, college, graduation_year, target_role, avatar_url } = req.body;

    const result = await pool.query(
      `UPDATE users SET
        name = COALESCE($1, name),
        college = COALESCE($2, college),
        graduation_year = COALESCE($3, graduation_year),
        target_role = COALESCE($4, target_role),
        avatar_url = COALESCE($5, avatar_url)
      WHERE id = $6
      RETURNING id, name, email, avatar_url, college, graduation_year, target_role, created_at`,
      [name, college, graduation_year, target_role, avatar_url, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found.' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    next(error);
  }
};

const getDailyGoal = async (req, res, next) => {
  try {
    const result = await pool.query(
      'SELECT daily_goal FROM user_settings WHERE user_id = $1',
      [req.user.id]
    );
    res.json({ daily_goal: result.rows.length > 0 ? result.rows[0].daily_goal : 3 });
  } catch (error) {
    next(error);
  }
};

const setDailyGoal = async (req, res, next) => {
  try {
    const { daily_goal } = req.body;
    const goal = parseInt(daily_goal);
    if (!goal || goal < 1 || goal > 50) {
      return res.status(400).json({ error: 'daily_goal must be between 1 and 50.' });
    }

    await pool.query(
      `INSERT INTO user_settings (user_id, daily_goal) VALUES ($1, $2)
       ON CONFLICT (user_id) DO UPDATE SET daily_goal = $2, updated_at = NOW()`,
      [req.user.id, goal]
    );

    res.json({ daily_goal: goal });
  } catch (error) {
    next(error);
  }
};

module.exports = { getProfile, updateProfile, getDailyGoal, setDailyGoal };
