import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Plus } from 'lucide-react';
import type { Column as ColumnType, Task } from '../types';
import { TaskCard } from './TaskCard';

interface ColumnProps {
  column: ColumnType;
  tasks: Task[];
  onAddTask: (columnId: string) => void;
  onEditTask: (task: Task) => void;
  onDeleteTask: (taskId: string) => void;
}

const columnStyles: Record<string, { border: string; badge: string }> = {
  'column-1': { border: 'border-t-violet-500', badge: 'bg-violet-500/15 text-violet-400' },
  'column-2': { border: 'border-t-amber-500', badge: 'bg-amber-500/15 text-amber-400' },
  'column-3': { border: 'border-t-emerald-500', badge: 'bg-emerald-500/15 text-emerald-400' },
};

export function Column({ column, tasks, onAddTask, onEditTask, onDeleteTask }: ColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: column.id,
  });

  const style = columnStyles[column.id] || { border: 'border-t-gray-500', badge: 'bg-gray-500/15 text-gray-400' };

  return (
    <div
      className={`flex flex-col bg-gray-900/50 rounded-xl border border-gray-800 border-t-4 ${style.border} min-w-[280px] max-w-[320px] flex-1`}
    >
      <div className="flex items-center justify-between p-3 border-b border-gray-800">
        <div className="flex items-center gap-2">
          <h2 className="font-semibold text-gray-200 text-sm">{column.title}</h2>
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${style.badge}`}>
            {tasks.length}
          </span>
        </div>
        <button
          onClick={() => onAddTask(column.id)}
          className="p-1 text-gray-500 hover:text-gray-300 hover:bg-gray-800 rounded-lg transition-colors"
        >
          <Plus size={18} />
        </button>
      </div>

      <div
        ref={setNodeRef}
        className={`flex-1 p-2 overflow-y-auto min-h-[200px] transition-colors ${
          isOver ? 'bg-gray-800/50' : ''
        }`}
      >
        <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
          {tasks.length === 0 ? (
            <div className="flex items-center justify-center h-20 text-gray-600 text-sm">
              No tasks yet
            </div>
          ) : (
            tasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onEdit={onEditTask}
                onDelete={onDeleteTask}
              />
            ))
          )}
        </SortableContext>
      </div>
    </div>
  );
}
