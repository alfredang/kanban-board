import { useState, useEffect, useCallback } from 'react';
import type { BoardState, Task } from '../types';
import { getInitialBoardState } from '../utils/storage';

const API_BASE = '/api';

export function useBoard() {
  const [boardState, setBoardState] = useState<BoardState>(getInitialBoardState());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch board data on mount
  useEffect(() => {
    fetchBoard();
  }, []);

  const fetchBoard = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`${API_BASE}/board`);
      if (!response.ok) {
        throw new Error('Failed to fetch board');
      }
      const data = await response.json();
      setBoardState(data);
      setError(null);
    } catch (err) {
      console.error('Error fetching board:', err);
      setError('Failed to load board data');
      // Fall back to local storage if API fails
      const saved = localStorage.getItem('kanban-board-state');
      if (saved) {
        setBoardState(JSON.parse(saved));
      }
    } finally {
      setIsLoading(false);
    }
  };

  const addTask = useCallback(async (
    columnId: string,
    taskData: Omit<Task, 'id' | 'columnId' | 'createdAt' | 'updatedAt'>
  ) => {
    try {
      const response = await fetch(`${API_BASE}/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...taskData, columnId }),
      });

      if (!response.ok) {
        throw new Error('Failed to create task');
      }

      const newTask = await response.json();

      setBoardState((prev) => ({
        ...prev,
        tasks: { ...prev.tasks, [newTask.id]: newTask },
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
  }, []);

  const updateTask = useCallback(async (taskId: string, updates: Partial<Omit<Task, 'id' | 'createdAt'>>) => {
    try {
      const response = await fetch(`${API_BASE}/tasks/${taskId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        throw new Error('Failed to update task');
      }

      const updatedTask = await response.json();

      setBoardState((prev) => ({
        ...prev,
        tasks: {
          ...prev.tasks,
          [taskId]: updatedTask,
        },
      }));
    } catch (err) {
      console.error('Error updating task:', err);
      setError('Failed to update task');
      throw err;
    }
  }, []);

  const deleteTask = useCallback(async (taskId: string) => {
    try {
      const task = boardState.tasks[taskId];
      if (!task) return;

      const response = await fetch(`${API_BASE}/tasks/${taskId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete task');
      }

      setBoardState((prev) => {
        const { [taskId]: deletedTask, ...remainingTasks } = prev.tasks;
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
  }, [boardState.tasks]);

  const moveTask = useCallback(async (
    taskId: string,
    sourceColumnId: string,
    destinationColumnId: string,
    destinationIndex: number
  ) => {
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

    // Sync with server
    try {
      const response = await fetch(`${API_BASE}/tasks/move`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          taskId,
          sourceColumnId,
          destinationColumnId,
          destinationIndex,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to move task');
      }
    } catch (err) {
      console.error('Error moving task:', err);
      // Refetch board on error to sync state
      fetchBoard();
    }
  }, []);

  const initializeDatabase = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE}/init`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to initialize database');
      }

      await fetchBoard();
      return true;
    } catch (err) {
      console.error('Error initializing database:', err);
      setError('Failed to initialize database');
      return false;
    }
  }, []);

  return {
    boardState,
    isLoading,
    error,
    addTask,
    updateTask,
    deleteTask,
    moveTask,
    initializeDatabase,
    refetch: fetchBoard,
  };
}
