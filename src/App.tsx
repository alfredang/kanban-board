import { useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { Layout, LogOut } from 'lucide-react';
import { Board } from './components/Board';
import { WelcomePage } from './components/WelcomePage';
import { isSupabaseConfigured, supabase } from './lib/supabase';

function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(Boolean(supabase));

  useEffect(() => {
    if (!supabase) {
      return;
    }

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setIsAuthLoading(false);
    });

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setIsAuthLoading(false);
    });

    return () => subscription.subscription.unsubscribe();
  }, []);

  const signInWithProvider = async (provider: 'github' | 'google') => {
    if (!supabase) return;
    await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: window.location.origin },
    });
  };

  const signOut = async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
  };

  const isAuthenticated = Boolean(session);

  if (!isAuthenticated && !isAuthLoading) {
    return (
      <WelcomePage
        isSupabaseConfigured={isSupabaseConfigured}
        onSignIn={signInWithProvider}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-950">
      <header className="bg-gray-900 border-b border-gray-800">
        <div className="px-6 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Layout className="text-violet-400" size={28} />
            <h1 className="text-xl font-bold text-white">Kanban Board</h1>
          </div>

          {isAuthLoading ? (
            <span className="text-sm text-gray-400">Checking session...</span>
          ) : session ? (
            <div className="flex items-center gap-3">
              {session.user.user_metadata?.avatar_url && (
                <img
                  src={session.user.user_metadata.avatar_url}
                  alt=""
                  className="w-7 h-7 rounded-full ring-2 ring-gray-700"
                />
              )}
              <span className="text-sm text-gray-300">{session.user.email}</span>
              <button
                type="button"
                onClick={signOut}
                className="inline-flex items-center gap-2 rounded-lg border border-gray-700 px-3 py-1.5 text-sm text-gray-300 hover:bg-gray-800 hover:text-white transition-colors"
              >
                <LogOut size={14} />
                Sign out
              </button>
            </div>
          ) : null}
        </div>
      </header>

      <main>
        <Board isAuthenticated={isAuthenticated} />
      </main>
    </div>
  );
}

export default App;
