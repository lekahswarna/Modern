/*
  # Summary Title Generator Schema

  1. New Tables
    - `summaries`
      - `id` (uuid, primary key) - Unique identifier for each summary
      - `content` (text) - The 1000-word summary content
      - `custom_instructions` (text, nullable) - User-specified instructions for title generation (e.g., exclude executive names)
      - `created_at` (timestamptz) - Timestamp when summary was created
      - `updated_at` (timestamptz) - Timestamp when summary was last updated

    - `titles`
      - `id` (uuid, primary key) - Unique identifier for each title
      - `summary_id` (uuid, foreign key) - Reference to parent summary
      - `title_text` (text) - The generated title (up to 25 words)
      - `title_number` (integer) - Title number (1-4)
      - `created_at` (timestamptz) - Timestamp when title was generated

  2. Security
    - Enable RLS on both tables
    - Add policies for public access (no auth required for this app)

  3. Important Notes
    - Summaries can have up to 4 titles generated
    - Custom instructions allow users to specify requirements like "exclude executive names"
    - Foreign key constraint ensures data integrity between summaries and titles
*/

-- Create summaries table
CREATE TABLE IF NOT EXISTS summaries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  content text NOT NULL,
  custom_instructions text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create titles table
CREATE TABLE IF NOT EXISTS titles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  summary_id uuid NOT NULL REFERENCES summaries(id) ON DELETE CASCADE,
  title_text text NOT NULL,
  title_number integer NOT NULL CHECK (title_number >= 1 AND title_number <= 4),
  created_at timestamptz DEFAULT now(),
  UNIQUE(summary_id, title_number)
);

-- Enable RLS
ALTER TABLE summaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE titles ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (no authentication required)
CREATE POLICY "Anyone can view summaries"
  ON summaries FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Anyone can insert summaries"
  ON summaries FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Anyone can update summaries"
  ON summaries FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Anyone can delete summaries"
  ON summaries FOR DELETE
  TO anon
  USING (true);

CREATE POLICY "Anyone can view titles"
  ON titles FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Anyone can insert titles"
  ON titles FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Anyone can update titles"
  ON titles FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Anyone can delete titles"
  ON titles FOR DELETE
  TO anon
  USING (true);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_titles_summary_id ON titles(summary_id);
