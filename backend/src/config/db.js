/**
 * Dual-mode database layer:
 *   - Production: PostgreSQL via `pg` (when DATABASE_URL or DB_HOST is set)
 *   - Development: SQLite via `better-sqlite3` (local, zero-config)
 *
 * Both expose the same pool.query(text, params) → { rows } API
 * so every controller works without changes.
 */

const USE_PG =
  !!process.env.DATABASE_URL ||
  (process.env.DB_HOST && process.env.DB_HOST !== 'localhost') ||
  process.env.NODE_ENV === 'production';

/* ────────────────────────────────────────────
   PostgreSQL path (production / Render / Neon)
   ──────────────────────────────────────────── */
if (USE_PG) {
  const { Pool } = require('pg');

  const pool = process.env.DATABASE_URL
    ? new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false },
      })
    : new Pool({
        host: process.env.DB_HOST,
        port: parseInt(process.env.DB_PORT) || 5432,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        ssl: { rejectUnauthorized: false },
      });

  // Auto-initialize schema on first run
  async function initPg() {
    try {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS users (
          id SERIAL PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          email VARCHAR(255) UNIQUE NOT NULL,
          password_hash TEXT NOT NULL,
          avatar_url TEXT,
          college TEXT,
          graduation_year INTEGER,
          target_role TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS dsa_questions (
          id SERIAL PRIMARY KEY,
          title VARCHAR(255) NOT NULL,
          difficulty VARCHAR(10) NOT NULL CHECK (difficulty IN ('easy','medium','hard')),
          topic VARCHAR(100) NOT NULL,
          platform VARCHAR(100),
          url TEXT,
          company_tags JSONB DEFAULT '[]',
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS user_dsa_progress (
          id SERIAL PRIMARY KEY,
          user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          question_id INTEGER NOT NULL REFERENCES dsa_questions(id) ON DELETE CASCADE,
          status VARCHAR(20) NOT NULL DEFAULT 'todo' CHECK (status IN ('solved','attempted','todo')),
          notes TEXT,
          solved_at TIMESTAMP WITH TIME ZONE,
          UNIQUE(user_id, question_id)
        );

        CREATE TABLE IF NOT EXISTS resumes (
          id SERIAL PRIMARY KEY,
          user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          filename VARCHAR(255) NOT NULL,
          file_path TEXT NOT NULL,
          uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS resume_analyses (
          id SERIAL PRIMARY KEY,
          resume_id INTEGER NOT NULL REFERENCES resumes(id) ON DELETE CASCADE,
          overall_score INTEGER CHECK (overall_score >= 0 AND overall_score <= 100),
          ats_score INTEGER CHECK (ats_score >= 0 AND ats_score <= 100),
          strengths JSONB DEFAULT '[]',
          weaknesses JSONB DEFAULT '[]',
          suggestions JSONB DEFAULT '[]',
          raw_analysis TEXT,
          analyzed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS mock_interviews (
          id SERIAL PRIMARY KEY,
          user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          role VARCHAR(255) NOT NULL,
          difficulty VARCHAR(10) DEFAULT 'medium' CHECK (difficulty IN ('easy','medium','hard')),
          questions JSONB DEFAULT '[]',
          status VARCHAR(20) NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress','completed')),
          overall_score INTEGER,
          overall_feedback TEXT,
          started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          completed_at TIMESTAMP WITH TIME ZONE
        );

        CREATE TABLE IF NOT EXISTS interview_answers (
          id SERIAL PRIMARY KEY,
          interview_id INTEGER NOT NULL REFERENCES mock_interviews(id) ON DELETE CASCADE,
          question_index INTEGER NOT NULL,
          answer_text TEXT NOT NULL,
          ai_feedback TEXT,
          score INTEGER CHECK (score >= 0 AND score <= 10),
          answered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS company_experiences (
          id SERIAL PRIMARY KEY,
          user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          company_name VARCHAR(255) NOT NULL,
          role VARCHAR(255) NOT NULL,
          experience_type VARCHAR(20) DEFAULT 'on-campus' CHECK (experience_type IN ('on-campus','off-campus','referral')),
          difficulty VARCHAR(10) CHECK (difficulty IN ('easy','medium','hard')),
          rounds JSONB DEFAULT '[]',
          questions_asked JSONB DEFAULT '[]',
          tips TEXT,
          result VARCHAR(20) CHECK (result IN ('selected','rejected','pending')),
          year INTEGER,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS bookmarks (
          id SERIAL PRIMARY KEY,
          user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          question_id INTEGER NOT NULL REFERENCES dsa_questions(id) ON DELETE CASCADE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          UNIQUE(user_id, question_id)
        );

        CREATE TABLE IF NOT EXISTS user_settings (
          id SERIAL PRIMARY KEY,
          user_id INTEGER UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          daily_goal INTEGER DEFAULT 3,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `);

      // Seed DSA questions if empty
      const { rows } = await pool.query('SELECT COUNT(*) as cnt FROM dsa_questions');
      if (parseInt(rows[0].cnt) === 0) {
        console.log('  📦 Seeding DSA questions...');
        await seedPgQuestions(pool);
      }

      console.log('  ✅ PostgreSQL schema initialized');
    } catch (err) {
      console.error('  ❌ PostgreSQL init error:', err.message);
    }
  }

  async function seedPgQuestions(pool) {
    const questions = getQuestionData();
    for (const q of questions) {
      await pool.query(
        `INSERT INTO dsa_questions (title, difficulty, topic, platform, url, company_tags)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        q
      );
    }
    console.log(`  ✅ Seeded ${questions.length} DSA questions`);
  }

  initPg();

  console.log('  🐘 Using PostgreSQL database');
  module.exports = pool;

} else {
  /* ─────────────────────────────────────
     SQLite path (local development)
     ───────────────────────────────────── */
  const Database = require('better-sqlite3');
  const path = require('path');
  const fs = require('fs');

  const dbPath = path.join(__dirname, '../../data/placement_prep.db');
  const dataDir = path.dirname(dbPath);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  const db = new Database(dbPath);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  const parseRowJson = (row) => {
    if (!row) return row;
    const parsed = { ...row };
    for (const key in parsed) {
      const val = parsed[key];
      if (typeof val === 'string' && (val.startsWith('[') || val.startsWith('{'))) {
        try { parsed[key] = JSON.parse(val); } catch (e) { /* keep string */ }
      }
    }
    return parsed;
  };

  const pool = {
    query: (text, params = []) => {
      let sqliteText = text;
      sqliteText = sqliteText.replace(/\$(\d+)/g, ':p$1');

      sqliteText = sqliteText.replace(/SERIAL PRIMARY KEY/gi, 'INTEGER PRIMARY KEY AUTOINCREMENT');
      sqliteText = sqliteText.replace(/VARCHAR\(\d+\)/gi, 'TEXT');
      sqliteText = sqliteText.replace(/TIMESTAMP WITH TIME ZONE/gi, 'TEXT');
      sqliteText = sqliteText.replace(/TIMESTAMP/gi, 'TEXT');
      sqliteText = sqliteText.replace(/jsonb_array_length/gi, 'json_array_length');
      sqliteText = sqliteText.replace(/\bJSONB\b/gi, 'TEXT');
      sqliteText = sqliteText.replace(/STRING_AGG\s*\(([^,]+),\s*'([^']*)'\)/gi, 'group_concat($1, \'$2\')');
      sqliteText = sqliteText.replace(/TEXT\[\]/gi, 'TEXT');
      sqliteText = sqliteText.replace(/NOW\(\)/gi, "datetime('now')");
      sqliteText = sqliteText.replace(/ILIKE/gi, 'LIKE');
      sqliteText = sqliteText.replace(/SERIAL/gi, 'INTEGER');

      const isSelect = sqliteText.trim().toUpperCase().startsWith('SELECT');
      const isInsert = sqliteText.trim().toUpperCase().startsWith('INSERT');
      const isUpdate = sqliteText.trim().toUpperCase().startsWith('UPDATE');
      const isDelete = sqliteText.trim().toUpperCase().startsWith('DELETE');
      const hasReturning = /RETURNING/i.test(sqliteText);

      const bindObj = {};
      params.forEach((val, idx) => {
        let boundVal = val;
        if (val instanceof Date) boundVal = val.toISOString();
        bindObj[`p${idx + 1}`] = boundVal;
      });

      try {
        if (isSelect) {
          return { rows: db.prepare(sqliteText).all(bindObj).map(parseRowJson) };
        } else if (hasReturning) {
          return { rows: db.prepare(sqliteText).all(bindObj).map(parseRowJson) };
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

  // Initialize SQLite schema
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL, avatar_url TEXT, college TEXT, graduation_year INTEGER,
      target_role TEXT, created_at TEXT DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS dsa_questions (
      id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT NOT NULL,
      difficulty TEXT NOT NULL CHECK (difficulty IN ('easy','medium','hard')),
      topic TEXT NOT NULL, platform TEXT, url TEXT, company_tags TEXT DEFAULT '[]',
      created_at TEXT DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS user_dsa_progress (
      id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      question_id INTEGER NOT NULL REFERENCES dsa_questions(id) ON DELETE CASCADE,
      status TEXT NOT NULL DEFAULT 'todo' CHECK (status IN ('solved','attempted','todo')),
      notes TEXT, solved_at TEXT, UNIQUE(user_id, question_id)
    );
    CREATE TABLE IF NOT EXISTS resumes (
      id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      filename TEXT NOT NULL, file_path TEXT NOT NULL, uploaded_at TEXT DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS resume_analyses (
      id INTEGER PRIMARY KEY AUTOINCREMENT, resume_id INTEGER NOT NULL REFERENCES resumes(id) ON DELETE CASCADE,
      overall_score INTEGER, ats_score INTEGER, strengths TEXT DEFAULT '[]', weaknesses TEXT DEFAULT '[]',
      suggestions TEXT DEFAULT '[]', raw_analysis TEXT, analyzed_at TEXT DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS mock_interviews (
      id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      role TEXT NOT NULL, difficulty TEXT DEFAULT 'medium', questions TEXT DEFAULT '[]',
      status TEXT NOT NULL DEFAULT 'in_progress', overall_score INTEGER, overall_feedback TEXT,
      started_at TEXT DEFAULT (datetime('now')), completed_at TEXT
    );
    CREATE TABLE IF NOT EXISTS interview_answers (
      id INTEGER PRIMARY KEY AUTOINCREMENT, interview_id INTEGER NOT NULL REFERENCES mock_interviews(id) ON DELETE CASCADE,
      question_index INTEGER NOT NULL, answer_text TEXT NOT NULL, ai_feedback TEXT,
      score INTEGER, answered_at TEXT DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS company_experiences (
      id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      company_name TEXT NOT NULL, role TEXT NOT NULL,
      experience_type TEXT DEFAULT 'on-campus', difficulty TEXT,
      rounds TEXT DEFAULT '[]', questions_asked TEXT DEFAULT '[]', tips TEXT,
      result TEXT, year INTEGER, created_at TEXT DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS bookmarks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      question_id INTEGER NOT NULL REFERENCES dsa_questions(id) ON DELETE CASCADE,
      created_at TEXT DEFAULT (datetime('now')),
      UNIQUE(user_id, question_id)
    );
    CREATE TABLE IF NOT EXISTS user_settings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      daily_goal INTEGER DEFAULT 3,
      updated_at TEXT DEFAULT (datetime('now'))
    );
  `);

  const count = db.prepare('SELECT COUNT(*) as cnt FROM dsa_questions').get();
  if (count.cnt === 0) {
    console.log('  📦 Seeding DSA questions...');
    const insert = db.prepare(
      `INSERT INTO dsa_questions (title, difficulty, topic, platform, url, company_tags) VALUES (?, ?, ?, ?, ?, ?)`
    );
    const insertMany = db.transaction((items) => { for (const item of items) insert.run(...item); });
    insertMany(getQuestionData());
    console.log(`  ✅ Seeded DSA questions`);
  }

  console.log('  📂 Using SQLite database (local)');
  module.exports = pool;
}

/* ── Shared seed data ───────────────────── */
function getQuestionData() {
  return [
    // ── Arrays (8) ──
    ['Two Sum', 'easy', 'Arrays', 'LeetCode', 'https://leetcode.com/problems/two-sum/', '["Google","Amazon","Microsoft"]'],
    ['Best Time to Buy and Sell Stock', 'easy', 'Arrays', 'LeetCode', 'https://leetcode.com/problems/best-time-to-buy-and-sell-stock/', '["Amazon","Facebook","Goldman Sachs"]'],
    ['Contains Duplicate', 'easy', 'Arrays', 'LeetCode', 'https://leetcode.com/problems/contains-duplicate/', '["Amazon","Apple"]'],
    ['Product of Array Except Self', 'medium', 'Arrays', 'LeetCode', 'https://leetcode.com/problems/product-of-array-except-self/', '["Amazon","Apple","Facebook"]'],
    ['Maximum Subarray', 'medium', 'Arrays', 'LeetCode', 'https://leetcode.com/problems/maximum-subarray/', '["Amazon","Microsoft","Google"]'],
    ['Container With Most Water', 'medium', 'Arrays', 'LeetCode', 'https://leetcode.com/problems/container-with-most-water/', '["Amazon","Google"]'],
    ['3Sum', 'medium', 'Arrays', 'LeetCode', 'https://leetcode.com/problems/3sum/', '["Amazon","Facebook","Google"]'],
    ['Trapping Rain Water', 'hard', 'Arrays', 'LeetCode', 'https://leetcode.com/problems/trapping-rain-water/', '["Amazon","Google","Goldman Sachs"]'],
    ['Rotate Array', 'medium', 'Arrays', 'LeetCode', 'https://leetcode.com/problems/rotate-array/', '["Microsoft","Amazon"]'],
    ['First Missing Positive', 'hard', 'Arrays', 'LeetCode', 'https://leetcode.com/problems/first-missing-positive/', '["Amazon","Google","Microsoft"]'],

    // ── Strings (7) ──
    ['Valid Anagram', 'easy', 'Strings', 'LeetCode', 'https://leetcode.com/problems/valid-anagram/', '["Amazon","Microsoft"]'],
    ['Valid Parentheses', 'easy', 'Strings', 'LeetCode', 'https://leetcode.com/problems/valid-parentheses/', '["Amazon","Google","Facebook"]'],
    ['Longest Substring Without Repeating Characters', 'medium', 'Strings', 'LeetCode', 'https://leetcode.com/problems/longest-substring-without-repeating-characters/', '["Amazon","Google","Microsoft"]'],
    ['Group Anagrams', 'medium', 'Strings', 'LeetCode', 'https://leetcode.com/problems/group-anagrams/', '["Amazon","Facebook"]'],
    ['Longest Palindromic Substring', 'medium', 'Strings', 'LeetCode', 'https://leetcode.com/problems/longest-palindromic-substring/', '["Amazon","Microsoft","Google"]'],
    ['String to Integer (atoi)', 'medium', 'Strings', 'LeetCode', 'https://leetcode.com/problems/string-to-integer-atoi/', '["Amazon","Microsoft","Facebook"]'],
    ['Minimum Window Substring', 'hard', 'Strings', 'LeetCode', 'https://leetcode.com/problems/minimum-window-substring/', '["Amazon","Google","Facebook"]'],

    // ── Linked List (6) ──
    ['Reverse Linked List', 'easy', 'Linked List', 'LeetCode', 'https://leetcode.com/problems/reverse-linked-list/', '["Amazon","Microsoft","Apple"]'],
    ['Merge Two Sorted Lists', 'easy', 'Linked List', 'LeetCode', 'https://leetcode.com/problems/merge-two-sorted-lists/', '["Amazon","Microsoft"]'],
    ['Linked List Cycle', 'easy', 'Linked List', 'LeetCode', 'https://leetcode.com/problems/linked-list-cycle/', '["Amazon","Microsoft"]'],
    ['Remove Nth Node From End of List', 'medium', 'Linked List', 'LeetCode', 'https://leetcode.com/problems/remove-nth-node-from-end-of-list/', '["Amazon","Facebook"]'],
    ['Reorder List', 'medium', 'Linked List', 'LeetCode', 'https://leetcode.com/problems/reorder-list/', '["Amazon","Facebook","Microsoft"]'],
    ['Merge K Sorted Lists', 'hard', 'Linked List', 'LeetCode', 'https://leetcode.com/problems/merge-k-sorted-lists/', '["Amazon","Google","Facebook"]'],

    // ── Trees (8) ──
    ['Maximum Depth of Binary Tree', 'easy', 'Trees', 'LeetCode', 'https://leetcode.com/problems/maximum-depth-of-binary-tree/', '["Amazon","Microsoft"]'],
    ['Invert Binary Tree', 'easy', 'Trees', 'LeetCode', 'https://leetcode.com/problems/invert-binary-tree/', '["Google","Amazon"]'],
    ['Same Tree', 'easy', 'Trees', 'LeetCode', 'https://leetcode.com/problems/same-tree/', '["Amazon","Bloomberg"]'],
    ['Validate Binary Search Tree', 'medium', 'Trees', 'LeetCode', 'https://leetcode.com/problems/validate-binary-search-tree/', '["Amazon","Facebook","Microsoft"]'],
    ['Binary Tree Level Order Traversal', 'medium', 'Trees', 'LeetCode', 'https://leetcode.com/problems/binary-tree-level-order-traversal/', '["Amazon","Facebook"]'],
    ['Lowest Common Ancestor of a Binary Tree', 'medium', 'Trees', 'LeetCode', 'https://leetcode.com/problems/lowest-common-ancestor-of-a-binary-tree/', '["Amazon","Facebook","Google"]'],
    ['Binary Tree Right Side View', 'medium', 'Trees', 'LeetCode', 'https://leetcode.com/problems/binary-tree-right-side-view/', '["Amazon","Facebook"]'],
    ['Serialize and Deserialize Binary Tree', 'hard', 'Trees', 'LeetCode', 'https://leetcode.com/problems/serialize-and-deserialize-binary-tree/', '["Amazon","Google","Facebook"]'],

    // ── Dynamic Programming (8) ──
    ['Climbing Stairs', 'easy', 'Dynamic Programming', 'LeetCode', 'https://leetcode.com/problems/climbing-stairs/', '["Amazon","Google"]'],
    ['House Robber', 'medium', 'Dynamic Programming', 'LeetCode', 'https://leetcode.com/problems/house-robber/', '["Amazon","Google"]'],
    ['Coin Change', 'medium', 'Dynamic Programming', 'LeetCode', 'https://leetcode.com/problems/coin-change/', '["Amazon","Google","Microsoft"]'],
    ['Longest Increasing Subsequence', 'medium', 'Dynamic Programming', 'LeetCode', 'https://leetcode.com/problems/longest-increasing-subsequence/', '["Amazon","Microsoft"]'],
    ['Word Break', 'medium', 'Dynamic Programming', 'LeetCode', 'https://leetcode.com/problems/word-break/', '["Amazon","Google","Facebook"]'],
    ['Unique Paths', 'medium', 'Dynamic Programming', 'LeetCode', 'https://leetcode.com/problems/unique-paths/', '["Google","Amazon","Microsoft"]'],
    ['Decode Ways', 'medium', 'Dynamic Programming', 'LeetCode', 'https://leetcode.com/problems/decode-ways/', '["Amazon","Facebook","Uber"]'],
    ['Edit Distance', 'medium', 'Dynamic Programming', 'LeetCode', 'https://leetcode.com/problems/edit-distance/', '["Amazon","Google"]'],

    // ── Graphs (7) ──
    ['Number of Islands', 'medium', 'Graphs', 'LeetCode', 'https://leetcode.com/problems/number-of-islands/', '["Amazon","Google","Facebook"]'],
    ['Clone Graph', 'medium', 'Graphs', 'LeetCode', 'https://leetcode.com/problems/clone-graph/', '["Amazon","Facebook"]'],
    ['Course Schedule', 'medium', 'Graphs', 'LeetCode', 'https://leetcode.com/problems/course-schedule/', '["Amazon","Facebook","Google"]'],
    ['Pacific Atlantic Water Flow', 'medium', 'Graphs', 'LeetCode', 'https://leetcode.com/problems/pacific-atlantic-water-flow/', '["Google","Amazon"]'],
    ['Graph Valid Tree', 'medium', 'Graphs', 'LeetCode', 'https://leetcode.com/problems/graph-valid-tree/', '["Google","Amazon","Facebook"]'],
    ['Word Ladder', 'hard', 'Graphs', 'LeetCode', 'https://leetcode.com/problems/word-ladder/', '["Amazon","Facebook","Google"]'],
    ['Alien Dictionary', 'hard', 'Graphs', 'LeetCode', 'https://leetcode.com/problems/alien-dictionary/', '["Amazon","Google","Facebook"]'],

    // ── Stacks & Queues (4) ──
    ['Min Stack', 'medium', 'Stacks & Queues', 'LeetCode', 'https://leetcode.com/problems/min-stack/', '["Amazon","Google"]'],
    ['Implement Queue using Stacks', 'easy', 'Stacks & Queues', 'LeetCode', 'https://leetcode.com/problems/implement-queue-using-stacks/', '["Amazon","Microsoft"]'],
    ['Daily Temperatures', 'medium', 'Stacks & Queues', 'LeetCode', 'https://leetcode.com/problems/daily-temperatures/', '["Amazon","Google"]'],
    ['Largest Rectangle in Histogram', 'hard', 'Stacks & Queues', 'LeetCode', 'https://leetcode.com/problems/largest-rectangle-in-histogram/', '["Amazon","Google"]'],

    // ── Binary Search (6) ──
    ['Binary Search', 'easy', 'Binary Search', 'LeetCode', 'https://leetcode.com/problems/binary-search/', '["Google","Amazon"]'],
    ['Search in Rotated Sorted Array', 'medium', 'Binary Search', 'LeetCode', 'https://leetcode.com/problems/search-in-rotated-sorted-array/', '["Amazon","Google","Facebook"]'],
    ['Find Minimum in Rotated Sorted Array', 'medium', 'Binary Search', 'LeetCode', 'https://leetcode.com/problems/find-minimum-in-rotated-sorted-array/', '["Amazon","Microsoft","Google"]'],
    ['Search a 2D Matrix', 'medium', 'Binary Search', 'LeetCode', 'https://leetcode.com/problems/search-a-2d-matrix/', '["Amazon","Microsoft"]'],
    ['Koko Eating Bananas', 'medium', 'Binary Search', 'LeetCode', 'https://leetcode.com/problems/koko-eating-bananas/', '["Google","Facebook"]'],
    ['Median of Two Sorted Arrays', 'hard', 'Binary Search', 'LeetCode', 'https://leetcode.com/problems/median-of-two-sorted-arrays/', '["Amazon","Google","Goldman Sachs"]'],

    // ── Heap / Priority Queue (5) ──
    ['Kth Largest Element in an Array', 'medium', 'Heap', 'LeetCode', 'https://leetcode.com/problems/kth-largest-element-in-an-array/', '["Amazon","Facebook","Google"]'],
    ['Top K Frequent Elements', 'medium', 'Heap', 'LeetCode', 'https://leetcode.com/problems/top-k-frequent-elements/', '["Amazon","Google","Facebook"]'],
    ['Find K Closest Points to Origin', 'medium', 'Heap', 'LeetCode', 'https://leetcode.com/problems/k-closest-points-to-origin/', '["Amazon","Facebook"]'],
    ['Task Scheduler', 'medium', 'Heap', 'LeetCode', 'https://leetcode.com/problems/task-scheduler/', '["Facebook","Amazon","Microsoft"]'],
    ['Find Median from Data Stream', 'hard', 'Heap', 'LeetCode', 'https://leetcode.com/problems/find-median-from-data-stream/', '["Amazon","Google","Microsoft"]'],

    // ── Sliding Window (5) ──
    ['Best Time to Buy and Sell Stock', 'easy', 'Sliding Window', 'LeetCode', 'https://leetcode.com/problems/best-time-to-buy-and-sell-stock/', '["Amazon","Facebook","Goldman Sachs"]'],
    ['Longest Repeating Character Replacement', 'medium', 'Sliding Window', 'LeetCode', 'https://leetcode.com/problems/longest-repeating-character-replacement/', '["Google","Amazon"]'],
    ['Permutation in String', 'medium', 'Sliding Window', 'LeetCode', 'https://leetcode.com/problems/permutation-in-string/', '["Microsoft","Amazon"]'],
    ['Minimum Size Subarray Sum', 'medium', 'Sliding Window', 'LeetCode', 'https://leetcode.com/problems/minimum-size-subarray-sum/', '["Amazon","Facebook","Google"]'],
    ['Sliding Window Maximum', 'hard', 'Sliding Window', 'LeetCode', 'https://leetcode.com/problems/sliding-window-maximum/', '["Amazon","Google","Microsoft"]'],

    // ── Two Pointers (5) ──
    ['Valid Palindrome', 'easy', 'Two Pointers', 'LeetCode', 'https://leetcode.com/problems/valid-palindrome/', '["Facebook","Amazon","Microsoft"]'],
    ['Two Sum II - Input Array Is Sorted', 'medium', 'Two Pointers', 'LeetCode', 'https://leetcode.com/problems/two-sum-ii-input-array-is-sorted/', '["Amazon","Google"]'],
    ['3Sum', 'medium', 'Two Pointers', 'LeetCode', 'https://leetcode.com/problems/3sum/', '["Amazon","Facebook","Google"]'],
    ['Container With Most Water', 'medium', 'Two Pointers', 'LeetCode', 'https://leetcode.com/problems/container-with-most-water/', '["Amazon","Google"]'],
    ['Trapping Rain Water', 'hard', 'Two Pointers', 'LeetCode', 'https://leetcode.com/problems/trapping-rain-water/', '["Amazon","Google","Goldman Sachs"]'],

    // ── Backtracking (5) ──
    ['Subsets', 'medium', 'Backtracking', 'LeetCode', 'https://leetcode.com/problems/subsets/', '["Amazon","Facebook","Google"]'],
    ['Combination Sum', 'medium', 'Backtracking', 'LeetCode', 'https://leetcode.com/problems/combination-sum/', '["Amazon","Facebook"]'],
    ['Permutations', 'medium', 'Backtracking', 'LeetCode', 'https://leetcode.com/problems/permutations/', '["Amazon","Microsoft","Facebook"]'],
    ['Word Search', 'medium', 'Backtracking', 'LeetCode', 'https://leetcode.com/problems/word-search/', '["Amazon","Microsoft"]'],
    ['N-Queens', 'hard', 'Backtracking', 'LeetCode', 'https://leetcode.com/problems/n-queens/', '["Amazon","Google","Facebook"]'],

    // ── Tries (4) ──
    ['Implement Trie (Prefix Tree)', 'medium', 'Tries', 'LeetCode', 'https://leetcode.com/problems/implement-trie-prefix-tree/', '["Amazon","Google","Microsoft"]'],
    ['Design Add and Search Words Data Structure', 'medium', 'Tries', 'LeetCode', 'https://leetcode.com/problems/design-add-and-search-words-data-structure/', '["Facebook","Amazon"]'],
    ['Word Search II', 'hard', 'Tries', 'LeetCode', 'https://leetcode.com/problems/word-search-ii/', '["Amazon","Google","Microsoft"]'],
    ['Longest Word in Dictionary', 'medium', 'Tries', 'LeetCode', 'https://leetcode.com/problems/longest-word-in-dictionary/', '["Google","Amazon"]'],

    // ── Greedy (5) ──
    ['Maximum Subarray', 'medium', 'Greedy', 'LeetCode', 'https://leetcode.com/problems/maximum-subarray/', '["Amazon","Microsoft","Google"]'],
    ['Jump Game', 'medium', 'Greedy', 'LeetCode', 'https://leetcode.com/problems/jump-game/', '["Amazon","Microsoft"]'],
    ['Jump Game II', 'medium', 'Greedy', 'LeetCode', 'https://leetcode.com/problems/jump-game-ii/', '["Amazon","Google"]'],
    ['Gas Station', 'medium', 'Greedy', 'LeetCode', 'https://leetcode.com/problems/gas-station/', '["Amazon","Google","Bloomberg"]'],
    ['Hand of Straights', 'medium', 'Greedy', 'LeetCode', 'https://leetcode.com/problems/hand-of-straights/', '["Google","Amazon"]'],

    // ── Bit Manipulation (4) ──
    ['Number of 1 Bits', 'easy', 'Bit Manipulation', 'LeetCode', 'https://leetcode.com/problems/number-of-1-bits/', '["Apple","Microsoft"]'],
    ['Counting Bits', 'easy', 'Bit Manipulation', 'LeetCode', 'https://leetcode.com/problems/counting-bits/', '["Amazon","Google"]'],
    ['Reverse Bits', 'easy', 'Bit Manipulation', 'LeetCode', 'https://leetcode.com/problems/reverse-bits/', '["Apple","Amazon"]'],
    ['Single Number', 'easy', 'Bit Manipulation', 'LeetCode', 'https://leetcode.com/problems/single-number/', '["Amazon","Google","Facebook"]'],

    // ── Math & Geometry (4) ──
    ['Rotate Image', 'medium', 'Math & Geometry', 'LeetCode', 'https://leetcode.com/problems/rotate-image/', '["Amazon","Microsoft","Apple"]'],
    ['Spiral Matrix', 'medium', 'Math & Geometry', 'LeetCode', 'https://leetcode.com/problems/spiral-matrix/', '["Amazon","Microsoft","Google"]'],
    ['Set Matrix Zeroes', 'medium', 'Math & Geometry', 'LeetCode', 'https://leetcode.com/problems/set-matrix-zeroes/', '["Amazon","Facebook","Microsoft"]'],
    ['Pow(x, n)', 'medium', 'Math & Geometry', 'LeetCode', 'https://leetcode.com/problems/powx-n/', '["Amazon","Google","Facebook"]'],

    // ── Intervals (4) ──
    ['Merge Intervals', 'medium', 'Intervals', 'LeetCode', 'https://leetcode.com/problems/merge-intervals/', '["Amazon","Google","Facebook"]'],
    ['Insert Interval', 'medium', 'Intervals', 'LeetCode', 'https://leetcode.com/problems/insert-interval/', '["Google","Amazon","Facebook"]'],
    ['Non-overlapping Intervals', 'medium', 'Intervals', 'LeetCode', 'https://leetcode.com/problems/non-overlapping-intervals/', '["Amazon","Google"]'],
    ['Meeting Rooms II', 'medium', 'Intervals', 'LeetCode', 'https://leetcode.com/problems/meeting-rooms-ii/', '["Amazon","Google","Facebook"]'],
  ];
}
