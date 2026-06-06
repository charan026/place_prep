const pool = require('../config/db');

const getOverview = async (req, res, next) => {
  try {
    const userId = req.user.id;

    // DSA stats
    const dsaStats = await pool.query(
      `SELECT
         SUM(CASE WHEN status = 'solved' THEN 1 ELSE 0 END) as questions_solved,
         SUM(CASE WHEN status = 'attempted' THEN 1 ELSE 0 END) as questions_attempted
       FROM user_dsa_progress WHERE user_id = $1`,
      [userId]
    );

    const totalQuestions = await pool.query('SELECT COUNT(*) as total FROM dsa_questions');

    // Resume stats
    const resumeStats = await pool.query(
      `SELECT COUNT(r.id) as total_resumes,
              MAX(ra.overall_score) as best_resume_score
       FROM resumes r
       LEFT JOIN resume_analyses ra ON r.id = ra.resume_id
       WHERE r.user_id = $1`,
      [userId]
    );

    // Interview stats
    const interviewStats = await pool.query(
      `SELECT
         COUNT(*) as total_interviews,
         SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_interviews,
         ROUND(AVG(overall_score)) as avg_score
       FROM mock_interviews WHERE user_id = $1`,
      [userId]
    );

    // Streak calculation (consecutive days with solved questions - calculated in JS to be database-agnostic)
    const activityDates = await pool.query(
      `SELECT DISTINCT DATE(solved_at) as activity_date
       FROM user_dsa_progress
       WHERE user_id = $1 AND status = 'solved' AND solved_at IS NOT NULL
       ORDER BY activity_date DESC`,
      [userId]
    );

    let currentStreak = 0;
    if (activityDates.rows && activityDates.rows.length > 0) {
      const dates = activityDates.rows.map(r => r.activity_date);
      const todayStr = new Date().toISOString().split('T')[0];
      
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];

      if (dates[0] === todayStr || dates[0] === yesterdayStr) {
        currentStreak = 1;
        let lastDate = new Date(dates[0]);
        for (let i = 1; i < dates.length; i++) {
          const currentDate = new Date(dates[i]);
          const diffTime = Math.abs(lastDate - currentDate);
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          if (diffDays === 1) {
            currentStreak++;
            lastDate = currentDate;
          } else if (diffDays > 1) {
            break;
          }
        }
      }
    }

    res.json({
      questions_solved: parseInt(dsaStats.rows[0]?.questions_solved || 0),
      questions_attempted: parseInt(dsaStats.rows[0]?.questions_attempted || 0),
      total_questions: parseInt(totalQuestions.rows[0]?.total || 0),
      total_resumes: parseInt(resumeStats.rows[0]?.total_resumes || 0),
      best_resume_score: parseInt(resumeStats.rows[0]?.best_resume_score || 0),
      total_interviews: parseInt(interviewStats.rows[0]?.total_interviews || 0),
      completed_interviews: parseInt(interviewStats.rows[0]?.completed_interviews || 0),
      avg_interview_score: parseInt(interviewStats.rows[0]?.avg_score || 0),
      current_streak: currentStreak,
    });
  } catch (error) {
    next(error);
  }
};

const getDSAProgress = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const topicWise = await pool.query(
      `SELECT
         q.topic,
         q.difficulty,
         SUM(CASE WHEN p.status = 'solved' THEN 1 ELSE 0 END) as solved,
         COUNT(*) as total
       FROM dsa_questions q
       LEFT JOIN user_dsa_progress p ON q.id = p.question_id AND p.user_id = $1
       GROUP BY q.topic, q.difficulty
       ORDER BY q.topic, q.difficulty`,
      [userId]
    );

    res.json(topicWise.rows);
  } catch (error) {
    next(error);
  }
};

const getActivity = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { days } = req.query;
    const lookback = parseInt(days) || 365;

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - lookback);
    const cutoffStr = cutoffDate.toISOString();

    const result = await pool.query(
      `SELECT DATE(solved_at) as date, COUNT(*) as count
       FROM user_dsa_progress
       WHERE user_id = $1
         AND status = 'solved'
         AND solved_at IS NOT NULL
         AND solved_at >= $2
       GROUP BY DATE(solved_at)
       ORDER BY date`,
      [userId, cutoffStr]
    );

    res.json(result.rows);
  } catch (error) {
    next(error);
  }
};

const getInterviewAnalytics = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const result = await pool.query(
      `SELECT
         id,
         role,
         difficulty,
         overall_score,
         DATE(started_at) as date
       FROM mock_interviews
       WHERE user_id = $1 AND status = 'completed' AND overall_score IS NOT NULL
       ORDER BY started_at`,
      [userId]
    );

    res.json(result.rows);
  } catch (error) {
    next(error);
  }
};

module.exports = { getOverview, getDSAProgress, getActivity, getInterviewAnalytics };
