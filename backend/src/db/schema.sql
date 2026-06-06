-- ============================================
-- Placement Prep Platform — Database Schema
-- ============================================

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    avatar_url TEXT,
    college VARCHAR(200),
    graduation_year INTEGER,
    target_role VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);

-- DSA Questions bank
CREATE TABLE IF NOT EXISTS dsa_questions (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    difficulty VARCHAR(20) NOT NULL CHECK (difficulty IN ('easy', 'medium', 'hard')),
    topic VARCHAR(100) NOT NULL,
    platform VARCHAR(50),
    url TEXT,
    company_tags TEXT[] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_dsa_questions_topic ON dsa_questions(topic);
CREATE INDEX idx_dsa_questions_difficulty ON dsa_questions(difficulty);

-- User DSA progress
CREATE TABLE IF NOT EXISTS user_dsa_progress (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    question_id INTEGER NOT NULL REFERENCES dsa_questions(id) ON DELETE CASCADE,
    status VARCHAR(20) NOT NULL DEFAULT 'todo' CHECK (status IN ('solved', 'attempted', 'todo')),
    notes TEXT,
    solved_at TIMESTAMP WITH TIME ZONE,
    UNIQUE(user_id, question_id)
);

CREATE INDEX idx_user_dsa_progress_user ON user_dsa_progress(user_id);

-- Resumes
CREATE TABLE IF NOT EXISTS resumes (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    filename VARCHAR(255) NOT NULL,
    file_path TEXT NOT NULL,
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_resumes_user ON resumes(user_id);

-- Resume AI analyses
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

CREATE INDEX idx_resume_analyses_resume ON resume_analyses(resume_id);

-- Mock interviews
CREATE TABLE IF NOT EXISTS mock_interviews (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(100) NOT NULL,
    difficulty VARCHAR(20) DEFAULT 'medium' CHECK (difficulty IN ('easy', 'medium', 'hard')),
    questions JSONB DEFAULT '[]',
    status VARCHAR(20) NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed')),
    overall_score INTEGER,
    overall_feedback TEXT,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_mock_interviews_user ON mock_interviews(user_id);

-- Interview answers & feedback
CREATE TABLE IF NOT EXISTS interview_answers (
    id SERIAL PRIMARY KEY,
    interview_id INTEGER NOT NULL REFERENCES mock_interviews(id) ON DELETE CASCADE,
    question_index INTEGER NOT NULL,
    answer_text TEXT NOT NULL,
    ai_feedback TEXT,
    score INTEGER CHECK (score >= 0 AND score <= 10),
    answered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_interview_answers_interview ON interview_answers(interview_id);

-- Company interview experiences
CREATE TABLE IF NOT EXISTS company_experiences (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    company_name VARCHAR(200) NOT NULL,
    role VARCHAR(100) NOT NULL,
    experience_type VARCHAR(50) DEFAULT 'on-campus' CHECK (experience_type IN ('on-campus', 'off-campus', 'referral')),
    difficulty VARCHAR(20) CHECK (difficulty IN ('easy', 'medium', 'hard')),
    rounds JSONB DEFAULT '[]',
    questions_asked JSONB DEFAULT '[]',
    tips TEXT,
    result VARCHAR(20) CHECK (result IN ('selected', 'rejected', 'pending')),
    year INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_company_experiences_company ON company_experiences(company_name);
CREATE INDEX idx_company_experiences_user ON company_experiences(user_id);
