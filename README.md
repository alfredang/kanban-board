# Kanban To-Do List App

A modern Kanban board application for managing tasks with drag-and-drop functionality.

**Live Demo:** [https://kanban-todo-ten-psi.vercel.app](https://kanban-todo-ten-psi.vercel.app)

## Features

- **Kanban Board** - Visual task management with three columns:
  - To Do
  - In Progress
  - Completed

- **Drag & Drop** - Move tasks between columns or reorder within a column

- **Task Management**
  - Create new tasks with title, description, priority, and tags
  - Edit existing tasks
  - Delete tasks

- **Priority Levels** - Color-coded priorities:
  - Low (green)
  - Medium (yellow)
  - High (red)

- **Tags** - Add multiple tags to categorize tasks

- **Persistent Storage** - Data is stored in PostgreSQL (Neon) database, accessible from any device

## Tech Stack

- **Frontend:** React 18 + TypeScript
- **Build Tool:** Vite
- **Styling:** Tailwind CSS
- **Drag & Drop:** @dnd-kit
- **Database:** PostgreSQL (Neon)
- **Hosting:** Vercel

## How It Works

1. **View Tasks** - The board displays all tasks organized in three columns
2. **Add Task** - Click the `+` button on any column to create a new task
3. **Edit Task** - Hover over a task and click the pencil icon to edit
4. **Delete Task** - Hover over a task and click the trash icon to delete
5. **Move Task** - Drag a task by its handle (grip icon) and drop it in another column or position

## Project Structure

```
├── api/                    # Vercel serverless functions
│   ├── board.ts           # GET board data
│   ├── init.ts            # Initialize database
│   ├── tasks.ts           # POST create task
│   └── tasks/
│       ├── [id].ts        # PUT/DELETE individual task
│       └── move.ts        # PUT move task
├── src/
│   ├── components/        # React components
│   │   ├── Board.tsx      # Main Kanban board
│   │   ├── Column.tsx     # Column container
│   │   ├── TaskCard.tsx   # Draggable task card
│   │   ├── TaskModal.tsx  # Create/edit modal
│   │   ├── PriorityBadge.tsx
│   │   └── TagBadge.tsx
│   ├── hooks/
│   │   ├── useBoard.ts    # Board state management
│   │   └── useLocalStorage.ts
│   ├── types/             # TypeScript interfaces
│   └── utils/             # Utility functions
```

## Local Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

## Environment Variables

For database connectivity, set the following in Vercel:

- `POSTGRES_URL` - PostgreSQL connection string (from Neon)

## License

MIT
