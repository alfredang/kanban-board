interface TagBadgeProps {
  tag: string;
}

const tagColors = [
  'bg-violet-500/15 text-violet-400',
  'bg-sky-500/15 text-sky-400',
  'bg-pink-500/15 text-pink-400',
  'bg-indigo-500/15 text-indigo-400',
  'bg-teal-500/15 text-teal-400',
];

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash);
}

export function TagBadge({ tag }: TagBadgeProps) {
  const colorIndex = hashString(tag) % tagColors.length;
  const colorClass = tagColors[colorIndex];

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${colorClass}`}>
      {tag}
    </span>
  );
}
