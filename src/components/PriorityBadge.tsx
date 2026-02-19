interface PriorityBadgeProps {
  priority: 'low' | 'medium' | 'high';
}

const priorityConfig = {
  low: { label: 'Low', className: 'bg-emerald-500/15 text-emerald-400' },
  medium: { label: 'Medium', className: 'bg-amber-500/15 text-amber-400' },
  high: { label: 'High', className: 'bg-red-500/15 text-red-400' },
};

export function PriorityBadge({ priority }: PriorityBadgeProps) {
  const config = priorityConfig[priority];

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${config.className}`}>
      {config.label}
    </span>
  );
}
