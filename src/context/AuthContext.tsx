import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
interface AuthContextType {
  user: { email: string } | null;
  loading: boolean;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}
const API_URL = import.meta.env.VITE_API_URL;

const AuthContext = createContext<AuthContextType | undefined>(undefined);


export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<{ email: string } | null>(null);
  const [loading, setLoading] = useState(true);

const checkAuth = async () => {
  try {
    const res = await fetch(`${API_URL}/api/auth/me`, {
      credentials: 'include', // <--- ضروري جداً لإرسال الـ Cookie مع الطلب
    });

    if (res.ok) {
      const data = await res.json();
      setUser(data);
    } else {
      // إذا كانت النتيجة 401 أو أي رمز آخر غير 200، نعتبر المستخدم غير مسجل
      setUser(null);
    }
  } catch (error) {
    // شبكة مقطوعة أو السيرفر متوقف
    setUser(null);
  } finally {
    setLoading(false);
  }
};

  const logout = async () => {
    try {
      await fetch(`${API_URL}/api/auth/logout`, {
        method: 'POST',
        credentials: 'include', // <--- يضمن مسح الـ Cookie من المتصفح
      });
    } finally {
      setUser(null); // مسح الحالة المحلية
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, logout, checkAuth }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
