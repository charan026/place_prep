const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, '../../data/placement_prep.db');

// Ensure data directory exists
const fs = require('fs');
const dataDir = path.dirname(dbPath);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const db = new Database(dbPath);

// Enable WAL mode for better concurrency
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

const parseRowJson = (row) => {
  if (!row) return row;
  const parsed = { ...row };
  for (const key in parsed) {
    const val = parsed[key];
    if (typeof val === 'string' && (val.startsWith('[') || val.startsWith('{'))) {
      try {
        parsed[key] = JSON.parse(val);
      } catch (e) {
        // Keep as string if parsing fails
      }
    }
  }
  return parsed;
};

const pool = {
  query: (text, params = []) => {
    // Convert PostgreSQL $1, $2 placeholders to SQLite named parameters :p1, :p2
    let sqliteText = text;
    sqliteText = sqliteText.replace(/\$(\d+)/g, ':p$1');

    // Convert PostgreSQL-specific syntax to SQLite equivalents
    sqliteText = sqliteText.replace(/SERIAL PRIMARY KEY/gi, 'INTEGER PRIMARY KEY AUTOINCREMENT');
    sqliteText = sqliteText.replace(/VARCHAR\(\d+\)/gi, 'TEXT');
    sqliteText = sqliteText.replace(/TIMESTAMP WITH TIME ZONE/gi, 'TEXT');
    sqliteText = sqliteText.replace(/TIMESTAMP/gi, 'TEXT');
    sqliteText = sqliteText.replace(/jsonb_array_length/gi, 'json_array_length'); // Must run before general JSONB replacement
    sqliteText = sqliteText.replace(/\bJSONB\b/gi, 'TEXT');
    sqliteText = sqliteText.replace(/TEXT\[\]/gi, 'TEXT');
    sqliteText = sqliteText.replace(/NOW\(\)/gi, "datetime('now')");
    sqliteText = sqliteText.replace(/ILIKE/gi, 'LIKE');
    sqliteText = sqliteText.replace(/SERIAL/gi, 'INTEGER');

    // Handle RETURNING clause - SQLite supports it in modern versions
    const isSelect = sqliteText.trim().toUpperCase().startsWith('SELECT');
    const isInsert = sqliteText.trim().toUpperCase().startsWith('INSERT');
    const isUpdate = sqliteText.trim().toUpperCase().startsWith('UPDATE');
    const isDelete = sqliteText.trim().toUpperCase().startsWith('DELETE');
    const hasReturning = /RETURNING/i.test(sqliteText);

    // Prepare named bindings object
    const bindObj = {};
    params.forEach((val, idx) => {
      let boundVal = val;
      if (val instanceof Date) {
        boundVal = val.toISOString();
      }
      bindObj[`p${idx + 1}`] = boundVal;
    });

    try {
      if (isSelect) {
        const rows = db.prepare(sqliteText).all(bindObj).map(parseRowJson);
        return { rows };
      } else if (hasReturning) {
        const rows = db.prepare(sqliteText).all(bindObj).map(parseRowJson);
        return { rows };
      } else if (isInsert || isUpdate || isDelete) {
        const result = db.prepare(sqliteText).run(bindObj);
        return { rows: [], rowCount: result.changes, lastInsertRowid: result.lastInsertRowid };
      } else {
        db.exec(sqliteText);
        return { rows: [] };
      }
    } catch (err) {
      throw err;
    }
  },
};

// Initialize database schema
function initializeDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      avatar_url TEXT,
      college TEXT,
      graduation_year INTEGER,
      target_role TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS dsa_questions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      difficulty TEXT NOT NULL CHECK (difficulty IN ('easy', 'medium', 'hard')),
      topic TEXT NOT NULL,
      platform TEXT,
      url TEXT,
      company_tags TEXT DEFAULT '[]',
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS user_dsa_progress (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      question_id INTEGER NOT NULL REFERENCES dsa_questions(id) ON DELETE CASCADE,
      status TEXT NOT NULL DEFAULT 'todo' CHECK (status IN ('solved', 'attempted', 'todo')),
      notes TEXT,
      solved_at TEXT,
      UNIQUE(user_id, question_id)
    );

    CREATE TABLE IF NOT EXISTS resumes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      filename TEXT NOT NULL,
      file_path TEXT NOT NULL,
      uploaded_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS resume_analyses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      resume_id INTEGER NOT NULL REFERENCES resumes(id) ON DELETE CASCADE,
      overall_score INTEGER CHECK (overall_score >= 0 AND overall_score <= 100),
      ats_score INTEGER CHECK (ats_score >= 0 AND ats_score <= 100),
      strengths TEXT DEFAULT '[]',
      weaknesses TEXT DEFAULT '[]',
      suggestions TEXT DEFAULT '[]',
      raw_analysis TEXT,
      analyzed_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS mock_interviews (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      role TEXT NOT NULL,
      difficulty TEXT DEFAULT 'medium' CHECK (difficulty IN ('easy', 'medium', 'hard')),
      questions TEXT DEFAULT '[]',
      status TEXT NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed')),
      overall_score INTEGER,
      overall_feedback TEXT,
      started_at TEXT DEFAULT (datetime('now')),
      completed_at TEXT
    );

    CREATE TABLE IF NOT EXISTS interview_answers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      interview_id INTEGER NOT NULL REFERENCES mock_interviews(id) ON DELETE CASCADE,
      question_index INTEGER NOT NULL,
      answer_text TEXT NOT NULL,
      ai_feedback TEXT,
      score INTEGER CHECK (score >= 0 AND score <= 10),
      answered_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS company_experiences (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      company_name TEXT NOT NULL,
      role TEXT NOT NULL,
      experience_type TEXT DEFAULT 'on-campus' CHECK (experience_type IN ('on-campus', 'off-campus', 'referral')),
      difficulty TEXT CHECK (difficulty IN ('easy', 'medium', 'hard')),
      rounds TEXT DEFAULT '[]',
      questions_asked TEXT DEFAULT '[]',
      tips TEXT,
      result TEXT CHECK (result IN ('selected', 'rejected', 'pending')),
      year INTEGER,
      created_at TEXT DEFAULT (datetime('now'))
    );
  `);

  // Seed DSA questions if table is empty
  const count = db.prepare('SELECT COUNT(*) as cnt FROM dsa_questions').get();
  if (count.cnt === 0) {
    console.log('  📦 Seeding DSA questions...');
    seedQuestions();
  }
}

function seedQuestions() {
  const insert = db.prepare(
    `INSERT INTO dsa_questions (title, difficulty, topic, platform, url, company_tags) VALUES (?, ?, ?, ?, ?, ?)`
  );

  const questions = [
    ['Two Sum', 'easy', 'Arrays', 'LeetCode', 'https://leetcode.com/problems/two-sum/', '["Google","Amazon","Microsoft"]'],
    ['Best Time to Buy and Sell Stock', 'easy', 'Arrays', 'LeetCode', 'https://leetcode.com/problems/best-time-to-buy-and-sell-stock/', '["Amazon","Facebook","Goldman Sachs"]'],
    ['Contains Duplicate', 'easy', 'Arrays', 'LeetCode', 'https://leetcode.com/problems/contains-duplicate/', '["Amazon","Apple"]'],
    ['Product of Array Except Self', 'medium', 'Arrays', 'LeetCode', 'https://leetcode.com/problems/product-of-array-except-self/', '["Amazon","Apple","Facebook"]'],
    ['Maximum Subarray', 'medium', 'Arrays', 'LeetCode', 'https://leetcode.com/problems/maximum-subarray/', '["Amazon","Microsoft","Google"]'],
    ['Container With Most Water', 'medium', 'Arrays', 'LeetCode', 'https://leetcode.com/problems/container-with-most-water/', '["Amazon","Google"]'],
    ['3Sum', 'medium', 'Arrays', 'LeetCode', 'https://leetcode.com/problems/3sum/', '["Amazon","Facebook","Google"]'],
    ['Trapping Rain Water', 'hard', 'Arrays', 'LeetCode', 'https://leetcode.com/problems/trapping-rain-water/', '["Amazon","Google","Goldman Sachs"]'],
    ['Valid Anagram', 'easy', 'Strings', 'LeetCode', 'https://leetcode.com/problems/valid-anagram/', '["Amazon","Microsoft"]'],
    ['Valid Parentheses', 'easy', 'Strings', 'LeetCode', 'https://leetcode.com/problems/valid-parentheses/', '["Amazon","Google","Facebook"]'],
    ['Longest Substring Without Repeating Characters', 'medium', 'Strings', 'LeetCode', 'https://leetcode.com/problems/longest-substring-without-repeating-characters/', '["Amazon","Google","Microsoft"]'],
    ['Group Anagrams', 'medium', 'Strings', 'LeetCode', 'https://leetcode.com/problems/group-anagrams/', '["Amazon","Facebook"]'],
    ['Minimum Window Substring', 'hard', 'Strings', 'LeetCode', 'https://leetcode.com/problems/minimum-window-substring/', '["Amazon","Google","Facebook"]'],
    ['Reverse Linked List', 'easy', 'Linked List', 'LeetCode', 'https://leetcode.com/problems/reverse-linked-list/', '["Amazon","Microsoft","Apple"]'],
    ['Merge Two Sorted Lists', 'easy', 'Linked List', 'LeetCode', 'https://leetcode.com/problems/merge-two-sorted-lists/', '["Amazon","Microsoft"]'],
    ['Linked List Cycle', 'easy', 'Linked List', 'LeetCode', 'https://leetcode.com/problems/linked-list-cycle/', '["Amazon","Microsoft"]'],
    ['Remove Nth Node From End of List', 'medium', 'Linked List', 'LeetCode', 'https://leetcode.com/problems/remove-nth-node-from-end-of-list/', '["Amazon","Facebook"]'],
    ['Merge K Sorted Lists', 'hard', 'Linked List', 'LeetCode', 'https://leetcode.com/problems/merge-k-sorted-lists/', '["Amazon","Google","Facebook"]'],
    ['Maximum Depth of Binary Tree', 'easy', 'Trees', 'LeetCode', 'https://leetcode.com/problems/maximum-depth-of-binary-tree/', '["Amazon","Microsoft"]'],
    ['Invert Binary Tree', 'easy', 'Trees', 'LeetCode', 'https://leetcode.com/problems/invert-binary-tree/', '["Google","Amazon"]'],
    ['Validate Binary Search Tree', 'medium', 'Trees', 'LeetCode', 'https://leetcode.com/problems/validate-binary-search-tree/', '["Amazon","Facebook","Microsoft"]'],
    ['Binary Tree Level Order Traversal', 'medium', 'Trees', 'LeetCode', 'https://leetcode.com/problems/binary-tree-level-order-traversal/', '["Amazon","Facebook"]'],
    ['Lowest Common Ancestor of a Binary Tree', 'medium', 'Trees', 'LeetCode', 'https://leetcode.com/problems/lowest-common-ancestor-of-a-binary-tree/', '["Amazon","Facebook","Google"]'],
    ['Serialize and Deserialize Binary Tree', 'hard', 'Trees', 'LeetCode', 'https://leetcode.com/problems/serialize-and-deserialize-binary-tree/', '["Amazon","Google","Facebook"]'],
    ['Climbing Stairs', 'easy', 'Dynamic Programming', 'LeetCode', 'https://leetcode.com/problems/climbing-stairs/', '["Amazon","Google"]'],
    ['House Robber', 'medium', 'Dynamic Programming', 'LeetCode', 'https://leetcode.com/problems/house-robber/', '["Amazon","Google"]'],
    ['Coin Change', 'medium', 'Dynamic Programming', 'LeetCode', 'https://leetcode.com/problems/coin-change/', '["Amazon","Google","Microsoft"]'],
    ['Longest Increasing Subsequence', 'medium', 'Dynamic Programming', 'LeetCode', 'https://leetcode.com/problems/longest-increasing-subsequence/', '["Amazon","Microsoft"]'],
    ['Word Break', 'medium', 'Dynamic Programming', 'LeetCode', 'https://leetcode.com/problems/word-break/', '["Amazon","Google","Facebook"]'],
    ['Edit Distance', 'medium', 'Dynamic Programming', 'LeetCode', 'https://leetcode.com/problems/edit-distance/', '["Amazon","Google"]'],
    ['Number of Islands', 'medium', 'Graphs', 'LeetCode', 'https://leetcode.com/problems/number-of-islands/', '["Amazon","Google","Facebook"]'],
    ['Clone Graph', 'medium', 'Graphs', 'LeetCode', 'https://leetcode.com/problems/clone-graph/', '["Amazon","Facebook"]'],
    ['Course Schedule', 'medium', 'Graphs', 'LeetCode', 'https://leetcode.com/problems/course-schedule/', '["Amazon","Facebook","Google"]'],
    ['Word Ladder', 'hard', 'Graphs', 'LeetCode', 'https://leetcode.com/problems/word-ladder/', '["Amazon","Facebook","Google"]'],
    ['Alien Dictionary', 'hard', 'Graphs', 'LeetCode', 'https://leetcode.com/problems/alien-dictionary/', '["Amazon","Google","Facebook"]'],
    ['Min Stack', 'medium', 'Stacks & Queues', 'LeetCode', 'https://leetcode.com/problems/min-stack/', '["Amazon","Google"]'],
    ['Implement Queue using Stacks', 'easy', 'Stacks & Queues', 'LeetCode', 'https://leetcode.com/problems/implement-queue-using-stacks/', '["Amazon","Microsoft"]'],
    ['Daily Temperatures', 'medium', 'Stacks & Queues', 'LeetCode', 'https://leetcode.com/problems/daily-temperatures/', '["Amazon","Google"]'],
    ['Largest Rectangle in Histogram', 'hard', 'Stacks & Queues', 'LeetCode', 'https://leetcode.com/problems/largest-rectangle-in-histogram/', '["Amazon","Google"]'],
  ];

  const insertMany = db.transaction((items) => {
    for (const item of items) {
      insert.run(...item);
    }
  });

  insertMany(questions);
  console.log(`  ✅ Seeded ${questions.length} DSA questions`);
}

// Run initialization
initializeDatabase();

module.exports = pool;
