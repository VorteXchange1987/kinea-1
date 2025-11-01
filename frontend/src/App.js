import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect, createContext, useContext } from 'react';
import axios from 'axios';
import { Toaster } from '@/components/ui/sonner';
import { toast } from 'sonner';
import ErrorBoundary from '@/components/ErrorBoundary';
import '@/App.css';

// Pages
import LandingPage from '@/pages/LandingPage';
import AboutPage from '@/pages/AboutPage';
import ContactPage from '@/pages/ContactPage';
import HomePage from '@/pages/HomePage';
import SeriesDetailPage from '@/pages/SeriesDetailPage';
import WatchPage from '@/pages/WatchPage';
import AdminPanel from '@/pages/AdminPanel';
import ModeratorPanel from '@/pages/ModeratorPanel';
import ProfilePage from '@/pages/ProfilePage';
import PublicProfilePage from '@/pages/PublicProfilePage';

const BACKEND_URL = "https://kinea-1.onrender.com";
const API = `${BACKEND_URL}/api`;

// Auth Context
const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem('kinea_token'));

  useEffect(() => {
    if (token) {
      fetchCurrentUser();
    } else {
      setLoading(false);
    }
  }, [token]);

  const fetchCurrentUser = async () => {
    try {
      const response = await axios.get(`${API}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUser(response.data);
    } catch (error) {
      console.error('Failed to fetch user:', error);
      logout();
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      const response = await axios.post(`${API}/auth/login`, {
        email,
        password,
        ip_address: await getClientIP()
      });
      const { token: newToken, user: userData } = response.data;
      localStorage.setItem('kinea_token', newToken);
      setToken(newToken);
      setUser(userData);
      toast.success('Giriş başarılı!');
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.detail || 'Giriş başarısız';
      toast.error(message);
      return { success: false, error: message };
    }
  };

  const register = async (username, email, password) => {
    try {
      const response = await axios.post(`${API}/auth/register`, {
        username,
        email,
        password,
        ip_address: await getClientIP()
      });
      const { token: newToken, user: userData } = response.data;
      localStorage.setItem('kinea_token', newToken);
      setToken(newToken);
      setUser(userData);
      toast.success('Kayıt başarılı!');
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.detail || 'Kayıt başarısız';
      toast.error(message);
      return { success: false, error: message };
    }
  };

  const logout = () => {
    localStorage.removeItem('kinea_token');
    setToken(null);
    setUser(null);
    toast.info('Çıkış yapıldı');
  };

  const getClientIP = async () => {
    try {
      const response = await axios.get('https://api.ipify.org?format=json');
      return response.data.ip;
    } catch (error) {
      return null;
    }
  };

  const authValue = {
    user,
    token,
    loading,
    login,
    register,
    logout,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN',
    isModerator: user?.role === 'MODERATOR' || user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN',
    refreshUser: fetchCurrentUser
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="neomorph p-8">
          <div className="text-white text-xl">Yükleniyor...</div>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <AuthContext.Provider value={authValue}>
        <div className="App">
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/about" element={<AboutPage />} />
              <Route path="/contact" element={<ContactPage />} />
              {/* Public routes - Guests can access */}
              <Route path="/home" element={<HomePage />} />
              <Route path="/series/:seriesId" element={<SeriesDetailPage />} />
              <Route path="/watch/:episodeId" element={<WatchPage />} />
              <Route path="/user/:userId" element={<PublicProfilePage />} />
              {/* Protected routes */}
              <Route path="/profile" element={user ? <ProfilePage /> : <Navigate to="/" />} />
              <Route 
                path="/admin" 
                element={authValue.isAdmin ? <AdminPanel /> : <Navigate to="/" />} 
              />
              <Route 
                path="/moderator" 
                element={authValue.isModerator ? <ModeratorPanel /> : <Navigate to="/" />} 
              />
            </Routes>
          </BrowserRouter>
          <Toaster position="top-center" richColors />
        </div>
      </AuthContext.Provider>
    </ErrorBoundary>
  );
}

export default App;