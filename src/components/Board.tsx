import { useState } from 'react';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import type { DragEndEvent, DragOverEvent, DragStartEvent } from '@dnd-kit/core';
import type { Task } from '../types';
import { useBoard } from '../hooks/useBoard';
import { Column } from './Column';
import { TaskCard } from './TaskCard';
import { TaskModal } from './TaskModal';

interface BoardProps {
  isAuthenticated: boolean;
}

export function Board({ isAuthenticated }: BoardProps) {
  const { boardState, isLoading, error, addTask, updateTask, deleteTask, moveTask } = useBoard(isAuthenticated);
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [targetColumnId, setTargetColumnId] = useState<string>('column-1');

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const task = boardState.tasks[active.id as string];
    if (task) {
      setActiveTask(task);
    }
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    const activeTask = boardState.tasks[activeId];
    if (!activeTask) return;

    const overTask = boardState.tasks[overId];
    const overColumn = boardState.columns[overId];

    if (overColumn) {
      if (activeTask.columnId !== overId) {
        moveTask(activeId, activeTask.columnId, overId, boardState.columns[overId].taskIds.length);
      }
    } else if (overTask && activeTask.columnId !== overTask.columnId) {
      const overColumnId = overTask.columnId;
      const overTaskIndex = boardState.columns[overColumnId].taskIds.indexOf(overId);
      moveTask(activeId, activeTask.columnId, overColumnId, overTaskIndex);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTask(null);

    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    if (activeId === overId) return;

    const activeTask = boardState.tasks[activeId];
    if (!activeTask) return;

    const overTask = boardState.tasks[overId];
    if (overTask && activeTask.columnId === overTask.columnId) {
      const columnId = activeTask.columnId;
      const overIndex = boardState.columns[columnId].taskIds.indexOf(overId);
      moveTask(activeId, columnId, columnId, overIndex);
    }
  };

  const handleAddTask = (columnId: string) => {
    setTargetColumnId(columnId);
    setEditingTask(null);
    setIsModalOpen(true);
  };

  const handleEditTask = (task: Task) => {
    setTargetColumnId(task.columnId);
    setEditingTask(task);
    setIsModalOpen(true);
  };

  const handleSaveTask = (taskData: Omit<Task, 'id' | 'columnId' | 'createdAt' | 'updatedAt'>) => {
    if (editingTask) {
      updateTask(editingTask.id, taskData);
    } else {
      addTask(targetColumnId, taskData);
    }
  };

  const handleDeleteTask = (taskId: string) => {
    if (confirm('Are you sure you want to delete this task?')) {
      deleteTask(taskId);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-80px)]">
        <div className="text-gray-400">Loading board...</div>
      </div>
    );
  }

  return (
    <>
      {error && (
        <div className="bg-amber-500/10 border-l-4 border-amber-500 p-4 mx-6 mt-4">
          <p className="text-amber-400 text-sm">{error} - Using local data</p>
        </div>
      )}

      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-4 p-6 overflow-x-auto min-h-[calc(100vh-80px)]">
          {boardState.columnOrder.map((columnId) => {
            const column = boardState.columns[columnId];
            const tasks = column.taskIds.map((taskId) => boardState.tasks[taskId]).filter(Boolean);

            return (
              <Column
                key={column.id}
                column={column}
                tasks={tasks}
                onAddTask={handleAddTask}
                onEditTask={handleEditTask}
                onDeleteTask={handleDeleteTask}
              />
            );
          })}
        </div>

        <DragOverlay>
          {activeTask ? (
            <div className="rotate-3">
              <TaskCard
                task={activeTask}
                onEdit={() => {}}
                onDelete={() => {}}
              />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      <TaskModal
        key={`${editingTask?.id ?? 'new'}-${isModalOpen ? 'open' : 'closed'}`}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveTask}
        task={editingTask}
        columnId={targetColumnId}
      />
    </>
  );
}
