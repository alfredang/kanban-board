import { useState, useEffect, useCallback } from 'react';
import type { BoardState, Task } from '../types';
import { getInitialBoardState } from '../utils/storage';
import { supabase } from '../lib/supabase';

export function useBoard(isAuthenticated: boolean) {
  const [boardState, setBoardState] = useState<BoardState>(getInitialBoardState());
  const [isLoading, setIsLoading] = useState(isAuthenticated);
  const [error, setError] = useState<string | null>(null);

  const fetchBoard = useCallback(async () => {
    if (!supabase || !isAuthenticated) return;

    try {
      setIsLoading(true);

      const [columnsRes, tasksRes] = await Promise.all([
        supabase.from('columns').select('*').order('position'),
        supabase.from('tasks').select('*, task_tags(tags(name))').order('position'),
      ]);

      if (columnsRes.error) throw columnsRes.error;
      if (tasksRes.error) throw tasksRes.error;

      const tasks: Record<string, Task> = {};
      const columns: Record<string, { id: string; title: string; taskIds: string[] }> = {};
      const columnOrder: string[] = [];

      for (const col of columnsRes.data) {
        columns[col.id] = { id: col.id, title: col.title, taskIds: [] };
        columnOrder.push(col.id);
      }

      for (const row of tasksRes.data) {
        const tags = (row.task_tags as { tags: { name: string } | null }[])
          ?.map((tt) => tt.tags?.name)
          .filter((name): name is string => Boolean(name)) ?? [];

        tasks[row.id] = {
          id: row.id,
          title: row.title,
          description: row.description ?? '',
          priority: row.priority ?? 'medium',
          columnId: row.column_id,
          tags,
          createdAt: row.created_at ?? '',
          updatedAt: row.updated_at ?? '',
        };

        if (columns[row.column_id]) {
          columns[row.column_id].taskIds.push(row.id);
        }
      }

      setBoardState({ tasks, columns, columnOrder });
      setError(null);
    } catch (err) {
      console.error('Error fetching board:', err);
      const message = err instanceof Error ? err.message : 'Failed to load board data';
      setError(message);
      setBoardState(getInitialBoardState());
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated) {
      setBoardState(getInitialBoardState());
      setIsLoading(false);
      setError(null);
      return;
    }

    fetchBoard();
  }, [isAuthenticated, fetchBoard]);

  const syncTags = useCallback(async (taskId: string, tags: string[]) => {
    if (!supabase) return;

    // Remove existing tag links
    await supabase.from('task_tags').delete().eq('task_id', taskId);

    if (tags.length === 0) return;

    // Upsert tags and link them
    for (const name of tags) {
      // Insert tag if it doesn't exist
      const { data: existing } = await supabase
        .from('tags')
        .select('id')
        .eq('name', name)
        .single();

      let tagId: number;
      if (existing) {
        tagId = existing.id;
      } else {
        const { data: created, error } = await supabase
          .from('tags')
          .insert({ name })
          .select('id')
          .single();
        if (error || !created) continue;
        tagId = created.id;
      }

      await supabase.from('task_tags').insert({ task_id: taskId, tag_id: tagId });
    }
  }, []);

  const addTask = useCallback(async (
    columnId: string,
    taskData: Omit<Task, 'id' | 'columnId' | 'createdAt' | 'updatedAt'>
  ) => {
    if (!supabase || !isAuthenticated) {
      throw new Error('Please sign in first');
    }

    try {
      // Get next position
      const { data: posData } = await supabase
        .from('tasks')
        .select('position')
        .eq('column_id', columnId)
        .order('position', { ascending: false })
        .limit(1)
        .single();

      const position = posData ? posData.position + 1 : 0;

      const { data: newTask, error } = await supabase
        .from('tasks')
        .insert({
          title: taskData.title,
          description: taskData.description || '',
          priority: taskData.priority || 'medium',
          column_id: columnId,
          position,
        })
        .select()
        .single();

      if (error || !newTask) throw error ?? new Error('Failed to create task');

      // Sync tags
      if (taskData.tags.length > 0) {
        await syncTags(newTask.id, taskData.tags);
      }

      setBoardState((prev) => ({
        ...prev,
        tasks: {
          ...prev.tasks,
          [newTask.id]: {
            id: newTask.id,
            title: newTask.title,
            description: newTask.description ?? '',
            priority: newTask.priority ?? 'medium',
            columnId: newTask.column_id,
            tags: taskData.tags,
            createdAt: newTask.created_at ?? '',
            updatedAt: newTask.updated_at ?? '',
          },
        },
        columns: {
          ...prev.columns,
          [columnId]: {
            ...prev.columns[columnId],
            taskIds: [...prev.columns[columnId].taskIds, newTask.id],
          },
        },
      }));

      return newTask.id;
    } catch (err) {
      console.error('Error creating task:', err);
      setError('Failed to create task');
      throw err;
    }
  }, [isAuthenticated, syncTags]);

  const updateTask = useCallback(async (taskId: string, updates: Partial<Omit<Task, 'id' | 'createdAt'>>) => {
    if (!supabase || !isAuthenticated) {
      throw new Error('Please sign in first');
    }

    try {
      const dbUpdates: Record<string, unknown> = { updated_at: new Date().toISOString() };
      if (updates.title !== undefined) dbUpdates.title = updates.title;
      if (updates.description !== undefined) dbUpdates.description = updates.description;
      if (updates.priority !== undefined) dbUpdates.priority = updates.priority;
      if (updates.columnId !== undefined) dbUpdates.column_id = updates.columnId;

      const { data: updatedTask, error } = await supabase
        .from('tasks')
        .update(dbUpdates)
        .eq('id', taskId)
        .select()
        .single();

      if (error || !updatedTask) throw error ?? new Error('Failed to update task');

      // Sync tags if provided
      let tags = boardState.tasks[taskId]?.tags ?? [];
      if (updates.tags !== undefined) {
        await syncTags(taskId, updates.tags);
        tags = updates.tags;
      }

      setBoardState((prev) => ({
        ...prev,
        tasks: {
          ...prev.tasks,
          [taskId]: {
            id: updatedTask.id,
            title: updatedTask.title,
            description: updatedTask.description ?? '',
            priority: updatedTask.priority ?? 'medium',
            columnId: updatedTask.column_id,
            tags,
            createdAt: updatedTask.created_at ?? '',
            updatedAt: updatedTask.updated_at ?? '',
          },
        },
      }));
    } catch (err) {
      console.error('Error updating task:', err);
      setError('Failed to update task');
      throw err;
    }
  }, [isAuthenticated, boardState.tasks, syncTags]);

  const deleteTask = useCallback(async (taskId: string) => {
    if (!supabase || !isAuthenticated) {
      throw new Error('Please sign in first');
    }

    try {
      const task = boardState.tasks[taskId];
      if (!task) return;

      const { error } = await supabase.from('tasks').delete().eq('id', taskId);
      if (error) throw error;

      // Compact positions to fix gaps
      await supabase.rpc('compact_positions', { p_column_id: task.columnId });

      setBoardState((prev) => {
        const remainingTasks = { ...prev.tasks };
        delete remainingTasks[taskId];
        const column = prev.columns[task.columnId];

        return {
          ...prev,
          tasks: remainingTasks,
          columns: {
            ...prev.columns,
            [task.columnId]: {
              ...column,
              taskIds: column.taskIds.filter((id) => id !== taskId),
            },
          },
        };
      });
    } catch (err) {
      console.error('Error deleting task:', err);
      setError('Failed to delete task');
      throw err;
    }
  }, [isAuthenticated, boardState.tasks]);

  const moveTask = useCallback(async (
    taskId: string,
    sourceColumnId: string,
    destinationColumnId: string,
    destinationIndex: number
  ) => {
    if (!supabase || !isAuthenticated) return;

    // Optimistically update UI
    setBoardState((prev) => {
      const sourceColumn = prev.columns[sourceColumnId];
      const destColumn = prev.columns[destinationColumnId];

      const sourceTaskIds = [...sourceColumn.taskIds];
      const destTaskIds = sourceColumnId === destinationColumnId
        ? sourceTaskIds
        : [...destColumn.taskIds];

      const sourceIndex = sourceTaskIds.indexOf(taskId);
      if (sourceIndex === -1) return prev;

      sourceTaskIds.splice(sourceIndex, 1);

      if (sourceColumnId === destinationColumnId) {
        sourceTaskIds.splice(destinationIndex, 0, taskId);
      } else {
        destTaskIds.splice(destinationIndex, 0, taskId);
      }

      return {
        ...prev,
        tasks: {
          ...prev.tasks,
          [taskId]: {
            ...prev.tasks[taskId],
            columnId: destinationColumnId,
            updatedAt: new Date().toISOString(),
          },
        },
        columns: {
          ...prev.columns,
          [sourceColumnId]: { ...sourceColumn, taskIds: sourceTaskIds },
          ...(sourceColumnId !== destinationColumnId && {
            [destinationColumnId]: { ...destColumn, taskIds: destTaskIds },
          }),
        },
      };
    });

    // Sync with Supabase via atomic RPC
    try {
      const { error } = await supabase.rpc('move_task', {
        p_task_id: taskId,
        p_source_column_id: sourceColumnId,
        p_dest_column_id: destinationColumnId,
        p_dest_index: destinationIndex,
      });

      if (error) throw error;
    } catch (err) {
      console.error('Error moving task:', err);
      // Refetch board on error to sync state
      fetchBoard();
    }
  }, [isAuthenticated, fetchBoard]);

  return {
    boardState,
    isLoading,
    error,
    addTask,
    updateTask,
    deleteTask,
    moveTask,
    refetch: fetchBoard,
  };
}
