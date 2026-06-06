const pool = require('../config/db');

const createExperience = async (req, res, next) => {
  try {
    const { company_name, role, experience_type, difficulty, rounds, questions_asked, tips, result, year } = req.body;

    if (!company_name || !role) {
      return res.status(400).json({ error: 'company_name and role are required.' });
    }

    const queryResult = await pool.query(
      `INSERT INTO company_experiences (user_id, company_name, role, experience_type, difficulty, rounds, questions_asked, tips, result, year)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
      [
        req.user.id,
        company_name,
        role,
        experience_type || 'on-campus',
        difficulty || null,
        JSON.stringify(rounds || []),
        JSON.stringify(questions_asked || []),
        tips || null,
        result || null,
        year || new Date().getFullYear(),
      ]
    );

    res.status(201).json(queryResult.rows[0]);
  } catch (error) {
    next(error);
  }
};

const getExperiences = async (req, res, next) => {
  try {
    const { company, role, year, result } = req.query;

    let query = `SELECT ce.*, u.name as author_name, u.college as author_college
                 FROM company_experiences ce
                 JOIN users u ON ce.user_id = u.id
                 WHERE 1=1`;
    const params = [];

    if (company) {
      params.push(`%${company}%`);
      query += ` AND ce.company_name ILIKE $${params.length}`;
    }

    if (role) {
      params.push(`%${role}%`);
      query += ` AND ce.role ILIKE $${params.length}`;
    }

    if (year) {
      params.push(parseInt(year));
      query += ` AND ce.year = $${params.length}`;
    }

    if (result) {
      params.push(result);
      query += ` AND ce.result = $${params.length}`;
    }

    query += ' ORDER BY ce.created_at DESC';

    const queryResult = await pool.query(query, params);
    res.json(queryResult.rows);
  } catch (error) {
    next(error);
  }
};

const getExperienceById = async (req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT ce.*, u.name as author_name, u.college as author_college
       FROM company_experiences ce
       JOIN users u ON ce.user_id = u.id
       WHERE ce.id = $1`,
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Experience not found.' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    next(error);
  }
};

const getCompanies = async (req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT company_name, COUNT(*) as experience_count,
              group_concat(role) as roles
       FROM company_experiences
       GROUP BY company_name
       ORDER BY experience_count DESC`
    );

    const formattedRows = result.rows.map(row => {
      let rolesArray = [];
      if (Array.isArray(row.roles)) {
        rolesArray = row.roles;
      } else if (typeof row.roles === 'string') {
        rolesArray = Array.from(new Set(row.roles.split(',').map(r => r.trim())));
      }
      return {
        ...row,
        roles: rolesArray
      };
    });

    res.json(formattedRows);
  } catch (error) {
    next(error);
  }
};

module.exports = { createExperience, getExperiences, getExperienceById, getCompanies };
