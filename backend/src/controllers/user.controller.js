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

module.exports = { getProfile, updateProfile };
