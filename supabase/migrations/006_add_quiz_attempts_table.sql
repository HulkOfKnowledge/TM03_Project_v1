-- =====================================================
-- QUIZ ATTEMPTS TABLE MIGRATION
-- =====================================================
-- Creates table for storing user quiz attempts and results

-- =====================================================
-- TABLE: quiz_attempts
-- =====================================================
CREATE TABLE IF NOT EXISTS quiz_attempts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  lesson_id TEXT NOT NULL,
  score INTEGER NOT NULL CHECK (score >= 0 AND score <= 100),
  correct_answers INTEGER NOT NULL CHECK (correct_answers >= 0),
  total_questions INTEGER NOT NULL CHECK (total_questions > 0),
  answers JSONB NOT NULL DEFAULT '{}',
  time_spent INTEGER NOT NULL DEFAULT 0, -- in seconds
  completed_at TIMESTAMPTZ NOT NULL,
  attempt_number INTEGER NOT NULL CHECK (attempt_number > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Ensure attempt numbers are unique per user/lesson combination
  UNIQUE(user_id, lesson_id, attempt_number)
);

-- RLS Policies for quiz_attempts
ALTER TABLE quiz_attempts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own quiz attempts"
  ON quiz_attempts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own quiz attempts"
  ON quiz_attempts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Note: No UPDATE or DELETE policies - quiz attempts are immutable once created

-- Indexes for efficient querying
CREATE INDEX idx_quiz_attempts_user_id ON quiz_attempts(user_id);
CREATE INDEX idx_quiz_attempts_lesson_id ON quiz_attempts(lesson_id);
CREATE INDEX idx_quiz_attempts_user_lesson ON quiz_attempts(user_id, lesson_id, completed_at DESC);
CREATE INDEX idx_quiz_attempts_completed_at ON quiz_attempts(completed_at DESC);

-- Trigger for updated_at timestamp
CREATE TRIGGER update_quiz_attempts_updated_at
  BEFORE UPDATE ON quiz_attempts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- FUNCTION: Get Next Attempt Number
-- =====================================================
-- Helper function to automatically get the next attempt number for a user/lesson
CREATE OR REPLACE FUNCTION get_next_attempt_number(p_user_id UUID, p_lesson_id TEXT)
RETURNS INTEGER AS $$
DECLARE
  next_attempt INTEGER;
BEGIN
  SELECT COALESCE(MAX(attempt_number), 0) + 1
  INTO next_attempt
  FROM quiz_attempts
  WHERE user_id = p_user_id AND lesson_id = p_lesson_id;
  
  RETURN next_attempt;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- FUNCTION: Get Best Quiz Score for Lesson
-- =====================================================
-- Helper function to get user's best score for a specific lesson
CREATE OR REPLACE FUNCTION get_best_quiz_score(p_user_id UUID, p_lesson_id TEXT)
RETURNS INTEGER AS $$
DECLARE
  best_score INTEGER;
BEGIN
  SELECT COALESCE(MAX(score), 0)
  INTO best_score
  FROM quiz_attempts
  WHERE user_id = p_user_id AND lesson_id = p_lesson_id;
  
  RETURN best_score;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- COMMENT DOCUMENTATION
-- =====================================================
COMMENT ON TABLE quiz_attempts IS 'Stores quiz attempts and results for all lessons';
COMMENT ON COLUMN quiz_attempts.score IS 'Quiz score as percentage (0-100)';
COMMENT ON COLUMN quiz_attempts.answers IS 'JSON object mapping question IDs to selected answer indices';
COMMENT ON COLUMN quiz_attempts.time_spent IS 'Total time spent on quiz in seconds';
COMMENT ON COLUMN quiz_attempts.attempt_number IS 'Sequential attempt number for user/lesson combination';
