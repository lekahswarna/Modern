/*
  # Update Title Limit to 3

  1. Changes
    - Update titles table constraint to allow 1-3 titles instead of 1-4
    - This supports the new requirement of generating 3 titles per summary

  2. Important Notes
    - Drops existing constraint and creates new one
    - Existing data with title_number 4 would need to be handled separately if present
*/

-- Drop the old constraint
ALTER TABLE titles DROP CONSTRAINT IF EXISTS titles_title_number_check;

-- Add new constraint for 1-3 titles
ALTER TABLE titles ADD CONSTRAINT titles_title_number_check
  CHECK (title_number >= 1 AND title_number <= 3);
