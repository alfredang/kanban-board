import { Layout, Github, Columns3, GripVertical, Tags } from 'lucide-react';

interface WelcomePageProps {
  isSupabaseConfigured: boolean;
  onSignIn: (provider: 'github' | 'google') => void;
}

export function WelcomePage({ isSupabaseConfigured, onSignIn }: WelcomePageProps) {
  return (
    <div className="min-h-screen bg-gray-950 flex flex-col">
      {/* Subtle grid background */}
      <div className="fixed inset-0 bg-[linear-gradient(rgba(139,92,246,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(139,92,246,0.03)_1px,transparent_1px)] bg-[size:64px_64px]" />

      {/* Top glow */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-violet-500/10 rounded-full blur-[120px]" />

      <div className="relative flex-1 flex flex-col items-center justify-center px-6">
        {/* Logo */}
        <div className="mb-8 flex items-center justify-center w-16 h-16 rounded-2xl bg-violet-500/10 border border-violet-500/20">
          <Layout className="text-violet-400" size={32} />
        </div>

        {/* Heading */}
        <h1 className="text-4xl sm:text-5xl font-bold text-white text-center tracking-tight">
          Welcome to your
          <br />
          <span className="bg-gradient-to-r from-violet-400 to-indigo-400 bg-clip-text text-transparent">
            Kanban Board
          </span>
        </h1>

        <p className="mt-4 text-lg text-gray-400 text-center max-w-md">
          Organize tasks, track progress, and stay productive with your personal board.
        </p>

        {/* Sign in buttons */}
        {isSupabaseConfigured ? (
          <div className="mt-10 flex flex-col sm:flex-row gap-3">
            <button
              type="button"
              onClick={() => onSignIn('github')}
              className="inline-flex items-center justify-center gap-3 rounded-xl bg-white px-6 py-3 text-sm font-semibold text-gray-900 hover:bg-gray-100 transition-colors shadow-lg shadow-white/5"
            >
              <Github size={20} />
              Continue with GitHub
            </button>
            <button
              type="button"
              onClick={() => onSignIn('google')}
              className="inline-flex items-center justify-center gap-3 rounded-xl bg-gray-800 border border-gray-700 px-6 py-3 text-sm font-semibold text-gray-200 hover:bg-gray-750 hover:border-gray-600 transition-colors"
            >
              <svg viewBox="0 0 24 24" width="20" height="20" className="shrink-0">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              Continue with Google
            </button>
          </div>
        ) : (
          <div className="mt-10 rounded-xl bg-red-500/10 border border-red-500/20 px-6 py-4 text-sm text-red-400 text-center max-w-md">
            Set <code className="font-mono bg-red-500/10 px-1.5 py-0.5 rounded">VITE_SUPABASE_URL</code> and{' '}
            <code className="font-mono bg-red-500/10 px-1.5 py-0.5 rounded">VITE_SUPABASE_ANON_KEY</code> to enable login.
          </div>
        )}

        {/* Feature cards */}
        <div className="mt-16 grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl w-full">
          <FeatureCard
            icon={<Columns3 size={20} className="text-violet-400" />}
            title="Organize"
            description="Drag & drop tasks across To Do, In Progress, and Completed columns"
          />
          <FeatureCard
            icon={<GripVertical size={20} className="text-indigo-400" />}
            title="Prioritize"
            description="Set priority levels and reorder tasks to focus on what matters"
          />
          <FeatureCard
            icon={<Tags size={20} className="text-sky-400" />}
            title="Tag & Filter"
            description="Add custom tags to categorize and quickly find your tasks"
          />
        </div>
      </div>

      {/* Footer */}
      <footer className="relative py-6 text-center text-xs text-gray-600">
        Built with React, Supabase & Tailwind
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="rounded-xl bg-gray-900/50 border border-gray-800 p-5 hover:border-gray-700 transition-colors">
      <div className="mb-3">{icon}</div>
      <h3 className="text-sm font-semibold text-white mb-1">{title}</h3>
      <p className="text-xs text-gray-500 leading-relaxed">{description}</p>
    </div>
  );
}
