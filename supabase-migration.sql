-- Kanban Board: Supabase Migration
-- Run this in the Supabase SQL Editor (Dashboard > SQL Editor > New Query)

-- 1. Create tables
CREATE TABLE columns (
  id VARCHAR(50) PRIMARY KEY,
  title VARCHAR(100) NOT NULL,
  position INTEGER NOT NULL
);

CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL DEFAULT auth.uid(),
  title VARCHAR(255) NOT NULL,
  description TEXT DEFAULT '',
  priority VARCHAR(10) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  column_id VARCHAR(50) NOT NULL REFERENCES columns(id) ON DELETE CASCADE,
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE tags (
  id SERIAL PRIMARY KEY,
  name VARCHAR(50) UNIQUE NOT NULL
);

CREATE TABLE task_tags (
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
  tag_id INTEGER REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (task_id, tag_id)
);

-- 2. Indexes
CREATE INDEX idx_tasks_user_column_position ON tasks(user_id, column_id, position);
CREATE INDEX idx_tags_name ON tags(name);

-- 3. Enable Row Level Security
ALTER TABLE columns ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_tags ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies

-- columns: all authenticated users can read
CREATE POLICY "Authenticated users can read columns"
  ON columns FOR SELECT
  TO authenticated
  USING (true);

-- tasks: full CRUD scoped to owner
CREATE POLICY "Users can read own tasks"
  ON tasks FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can create own tasks"
  ON tasks FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own tasks"
  ON tasks FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own tasks"
  ON tasks FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- tags: all authenticated users can read and insert
CREATE POLICY "Authenticated users can read tags"
  ON tags FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create tags"
  ON tags FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- task_tags: CRUD gated by task ownership
CREATE POLICY "Users can read own task_tags"
  ON task_tags FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM tasks WHERE tasks.id = task_tags.task_id AND tasks.user_id = auth.uid()
  ));

CREATE POLICY "Users can create own task_tags"
  ON task_tags FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM tasks WHERE tasks.id = task_tags.task_id AND tasks.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete own task_tags"
  ON task_tags FOR DELETE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM tasks WHERE tasks.id = task_tags.task_id AND tasks.user_id = auth.uid()
  ));

-- 5. Seed default columns
INSERT INTO columns (id, title, position) VALUES
  ('column-1', 'To Do', 0),
  ('column-2', 'In Progress', 1),
  ('column-3', 'Completed', 2)
ON CONFLICT (id) DO NOTHING;

-- 6. Helper functions

-- Atomic move task with position reordering
CREATE OR REPLACE FUNCTION move_task(
  p_task_id UUID,
  p_source_column_id VARCHAR(50),
  p_dest_column_id VARCHAR(50),
  p_dest_index INTEGER
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_current_position INTEGER;
  v_user_id UUID := auth.uid();
BEGIN
  -- Get current position
  SELECT position INTO v_current_position
  FROM tasks
  WHERE id = p_task_id AND user_id = v_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Task not found or not owned by user';
  END IF;

  IF p_source_column_id = p_dest_column_id THEN
    -- Same column: shift positions between old and new
    IF p_dest_index > v_current_position THEN
      UPDATE tasks
      SET position = position - 1
      WHERE column_id = p_source_column_id
        AND user_id = v_user_id
        AND position > v_current_position
        AND position <= p_dest_index;
    ELSIF p_dest_index < v_current_position THEN
      UPDATE tasks
      SET position = position + 1
      WHERE column_id = p_source_column_id
        AND user_id = v_user_id
        AND position >= p_dest_index
        AND position < v_current_position;
    END IF;

    UPDATE tasks
    SET position = p_dest_index, updated_at = now()
    WHERE id = p_task_id AND user_id = v_user_id;
  ELSE
    -- Different column: close gap in source, open gap in dest
    UPDATE tasks
    SET position = position - 1
    WHERE column_id = p_source_column_id
      AND user_id = v_user_id
      AND position > v_current_position;

    UPDATE tasks
    SET position = position + 1
    WHERE column_id = p_dest_column_id
      AND user_id = v_user_id
      AND position >= p_dest_index;

    UPDATE tasks
    SET column_id = p_dest_column_id,
        position = p_dest_index,
        updated_at = now()
    WHERE id = p_task_id AND user_id = v_user_id;
  END IF;
END;
$$;

-- Compact positions after deletion to fix gaps
CREATE OR REPLACE FUNCTION compact_positions(
  p_column_id VARCHAR(50),
  p_user_id UUID DEFAULT auth.uid()
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  WITH numbered AS (
    SELECT id, ROW_NUMBER() OVER (ORDER BY position) - 1 AS new_pos
    FROM tasks
    WHERE column_id = p_column_id AND user_id = p_user_id
  )
  UPDATE tasks
  SET position = numbered.new_pos
  FROM numbered
  WHERE tasks.id = numbered.id;
END;
$$;
