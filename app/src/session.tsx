import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { api, setAuthToken, type Lang, type User } from './api';

type Status = 'loading' | 'ready' | 'error';

interface Session {
  status: Status;
  user: User | null;
  demoUsers: User[];
  lang: Lang;
  setLang: (lang: Lang) => void;
  switchUser: (userId: string) => Promise<void>;
  retry: () => void;
}

const SessionContext = createContext<Session | null>(null);

// ponytail: demo sign-in stands in for real auth (OTP/social login + token in SecureStore).
export function SessionProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<Status>('loading');
  const [user, setUser] = useState<User | null>(null);
  const [demoUsers, setDemoUsers] = useState<User[]>([]);
  const [lang, setLang] = useState<Lang>('en');

  const switchUser = useCallback(async (userId: string) => {
    const { token, user: next } = await api.demoLogin(userId);
    setAuthToken(token);
    setUser(next);
  }, []);

  const start = useCallback(async () => {
    setStatus('loading');
    try {
      const { users } = await api.demoUsers();
      setDemoUsers(users);
      if (users[0]) await switchUser(users[0].id);
      setStatus('ready');
    } catch {
      setStatus('error');
    }
  }, [switchUser]);

  useEffect(() => {
    start();
  }, [start]);

  return (
    <SessionContext.Provider value={{ status, user, demoUsers, lang, setLang, switchUser, retry: start }}>
      {children}
    </SessionContext.Provider>
  );
}

export function useSession() {
  const session = useContext(SessionContext);
  if (!session) throw new Error('useSession must be used inside SessionProvider');
  return session;
}
