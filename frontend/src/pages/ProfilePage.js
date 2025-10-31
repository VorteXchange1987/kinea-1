import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Navbar from '@/components/Navbar';
import { useAuth } from '@/App';
import { toast } from 'sonner';
import { Camera, Shield, Heart, Award, User, Lock, Mail, Settings } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const ProfilePage = () => {
  const navigate = useNavigate();
  const { user, token, refreshUser } = useAuth();
  const [photoUrl, setPhotoUrl] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  
  // Account settings states
  const [newUsername, setNewUsername] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // Favorites and badges
  const [favorites, setFavorites] = useState([]);
  const [badges, setBadges] = useState([]);
  const [loadingFavorites, setLoadingFavorites] = useState(true);
  const [loadingBadges, setLoadingBadges] = useState(true);

  useEffect(() => {
    if (user) {
      fetchFavorites();
      fetchBadges();
    }
  }, [user]);

  const fetchFavorites = async () => {
    try {
      const response = await axios.get(`${API}/favorites`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setFavorites(response.data);
    } catch (error) {
      console.error('Failed to fetch favorites:', error);
    } finally {
      setLoadingFavorites(false);
    }
  };

  const fetchBadges = async () => {
    try {
      const response = await axios.get(`${API}/users/me/badges`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setBadges(response.data.badges);
    } catch (error) {
      console.error('Failed to fetch badges:', error);
    } finally {
      setLoadingBadges(false);
    }
  };

  const handleUpdatePhoto = async (e) => {
    e.preventDefault();
    if (!photoUrl.trim()) {
      toast.error('Lütfen geçerli bir URL girin');
      return;
    }

    setIsUpdating(true);
    try {
      await axios.put(
        `${API}/users/me/profile-photo`,
        { profile_photo_url: photoUrl },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success('Profil fotoğrafı güncellendi');
      await refreshUser();
      setPhotoUrl('');
    } catch (error) {
      toast.error('Fotoğraf güncellenemedi');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleUpdateUsername = async (e) => {
    e.preventDefault();
    if (!newUsername.trim()) {
      toast.error('Kullanıcı adı boş olamaz');
      return;
    }

    try {
      await axios.put(
        `${API}/users/me/username`,
        { username: newUsername },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success('Kullanıcı adı güncellendi');
      await refreshUser();
      setNewUsername('');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Kullanıcı adı güncellenemedi');
    }
  };

  const handleUpdateEmail = async (e) => {
    e.preventDefault();
    if (!newEmail.trim()) {
      toast.error('Email boş olamaz');
      return;
    }

    try {
      await axios.put(
        `${API}/users/me/email`,
        { email: newEmail },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success('Email güncellendi');
      await refreshUser();
      setNewEmail('');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Email güncellenemedi');
    }
  };

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error('Tüm alanları doldurun');
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error('Yeni şifreler eşleşmiyor');
      return;
    }

    if (newPassword.length < 6) {
      toast.error('Şifre en az 6 karakter olmalıdır');
      return;
    }

    try {
      await axios.put(
        `${API}/users/me/password`,
        { current_password: currentPassword, new_password: newPassword },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success('Şifre güncellendi');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Şifre güncellenemedi');
    }
  };

  const removeFavorite = async (seriesId) => {
    try {
      await axios.post(
        `${API}/favorites/${seriesId}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setFavorites(favorites.filter(s => s.id !== seriesId));
      toast.success('Favorilerden çıkarıldı');
    } catch (error) {
      toast.error('İşlem başarısız');
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <Navbar />

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-5xl mx-auto">
          <h1 data-testid="profile-title" className="text-3xl font-bold text-white mb-8">Profilim</h1>

          {/* Profile Header */}
          <div className="neomorph-flat p-8 mb-6">
            <div className="flex flex-col md:flex-row items-center gap-6">
              <Avatar className="w-32 h-32">
                <AvatarImage src={user.profile_photo_url} />
                <AvatarFallback className="bg-gray-800 text-white text-4xl">
                  {user.username.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1 text-center md:text-left">
                <div className="flex items-center justify-center md:justify-start gap-2 mb-2">
                  <h2 className="text-3xl font-bold text-white">{user.username}</h2>
                  {(user.role === 'SUPER_ADMIN' || user.role === 'ADMIN') && (
                    <span className="px-3 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-yellow-500 to-orange-500 text-white flex items-center gap-1">
                      <Shield className="w-3 h-3" />
                      Kurucu
                    </span>
                  )}
                  {user.role === 'MODERATOR' && (
                    <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-600 text-white">
                      Moderatör
                    </span>
                  )}
                </div>
                <p className="text-gray-400 mb-2">{user.email}</p>
                <p className="text-sm text-gray-500">
                  Üyelik: {new Date(user.created_at).toLocaleDateString('tr-TR', { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </p>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <Tabs defaultValue="settings" className="w-full">
            <TabsList className="grid w-full grid-cols-3 neomorph-flat mb-6">
              <TabsTrigger value="settings" className="text-white data-[state=active]:bg-gray-800">
                <Settings className="w-4 h-4 mr-2" />
                Hesap Ayarları
              </TabsTrigger>
              <TabsTrigger value="favorites" className="text-white data-[state=active]:bg-gray-800">
                <Heart className="w-4 h-4 mr-2" />
                Favorilerim
              </TabsTrigger>
              <TabsTrigger value="badges" className="text-white data-[state=active]:bg-gray-800">
                <Award className="w-4 h-4 mr-2" />
                Unvanlarım
              </TabsTrigger>
            </TabsList>

            {/* Settings Tab */}
            <TabsContent value="settings">
              <div className="space-y-6">
                {/* Profile Photo */}
                <div className="neomorph-flat p-6">
                  <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <Camera className="w-5 h-5" />
                    Profil Fotoğrafı
                  </h3>
                  <form onSubmit={handleUpdatePhoto} className="space-y-4">
                    <input
                      data-testid="photo-url-input"
                      type="url"
                      value={photoUrl}
                      onChange={(e) => setPhotoUrl(e.target.value)}
                      placeholder="https://ornek.com/foto.jpg"
                      className="w-full neomorph-input px-4 py-2 text-white focus:outline-none"
                      disabled={isUpdating}
                    />
                    <button
                      type="submit"
                      disabled={isUpdating || !photoUrl.trim()}
                      className="neomorph-btn px-6 py-2 text-white font-medium disabled:opacity-50"
                    >
                      {isUpdating ? 'Güncelleniyor...' : 'Fotoğrafı Güncelle'}
                    </button>
                  </form>
                </div>

                {/* Username */}
                <div className="neomorph-flat p-6">
                  <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <User className="w-5 h-5" />
                    Kullanıcı Adı
                  </h3>
                  <form onSubmit={handleUpdateUsername} className="space-y-4">
                    <div>
                      <p className="text-sm text-gray-400 mb-2">Mevcut: {user.username}</p>
                      <input
                        data-testid="username-input"
                        type="text"
                        value={newUsername}
                        onChange={(e) => setNewUsername(e.target.value)}
                        placeholder="Yeni kullanıcı adı"
                        className="w-full neomorph-input px-4 py-2 text-white focus:outline-none"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={!newUsername.trim()}
                      className="neomorph-btn px-6 py-2 text-white font-medium disabled:opacity-50"
                    >
                      Kullanıcı Adını Güncelle
                    </button>
                  </form>
                </div>

                {/* Email */}
                <div className="neomorph-flat p-6">
                  <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <Mail className="w-5 h-5" />
                    Email Adresi
                  </h3>
                  <form onSubmit={handleUpdateEmail} className="space-y-4">
                    <div>
                      <p className="text-sm text-gray-400 mb-2">Mevcut: {user.email}</p>
                      <input
                        data-testid="email-input"
                        type="email"
                        value={newEmail}
                        onChange={(e) => setNewEmail(e.target.value)}
                        placeholder="yeni@gmail.com"
                        className="w-full neomorph-input px-4 py-2 text-white focus:outline-none"
                      />
                      <p className="text-xs text-gray-500 mt-1">Sadece Gmail adresleri kabul edilir</p>
                    </div>
                    <button
                      type="submit"
                      disabled={!newEmail.trim()}
                      className="neomorph-btn px-6 py-2 text-white font-medium disabled:opacity-50"
                    >
                      Email'i Güncelle
                    </button>
                  </form>
                </div>

                {/* Password */}
                <div className="neomorph-flat p-6">
                  <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <Lock className="w-5 h-5" />
                    Şifre Değiştir
                  </h3>
                  <form onSubmit={handleUpdatePassword} className="space-y-4">
                    <input
                      data-testid="current-password-input"
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="Mevcut şifre"
                      className="w-full neomorph-input px-4 py-2 text-white focus:outline-none"
                    />
                    <input
                      data-testid="new-password-input"
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Yeni şifre"
                      className="w-full neomorph-input px-4 py-2 text-white focus:outline-none"
                    />
                    <input
                      data-testid="confirm-password-input"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Yeni şifre (tekrar)"
                      className="w-full neomorph-input px-4 py-2 text-white focus:outline-none"
                    />
                    <button
                      type="submit"
                      disabled={!currentPassword || !newPassword || !confirmPassword}
                      className="neomorph-btn px-6 py-2 text-white font-medium disabled:opacity-50"
                    >
                      Şifreyi Güncelle
                    </button>
                  </form>
                </div>
              </div>
            </TabsContent>

            {/* Favorites Tab */}
            <TabsContent value="favorites">
              <div className="neomorph-flat p-6">
                <h3 className="text-xl font-semibold text-white mb-6">Favori Dizilerim</h3>
                
                {loadingFavorites ? (
                  <p className="text-gray-400 text-center py-8">Yükleniyor...</p>
                ) : favorites.length === 0 ? (
                  <p className="text-gray-400 text-center py-8">Henüz favori diziniz yok</p>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {favorites.map((series) => (
                      <div
                        key={series.id}
                        data-testid={`favorite-series-${series.id}`}
                        className="neomorph-flat p-3 group relative cursor-pointer"
                        onClick={() => navigate(`/series/${series.id}`)}
                      >
                        <div className="aspect-[2/3] mb-2 rounded-lg overflow-hidden bg-gray-900">
                          <img
                            src={series.poster_url}
                            alt={series.title}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.target.src = 'https://via.placeholder.com/300x450/121212/ffffff?text=' + encodeURIComponent(series.title);
                            }}
                          />
                        </div>
                        <h4 className="text-white text-sm font-medium truncate">{series.title}</h4>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            removeFavorite(series.id);
                          }}
                          className="absolute top-5 right-5 neomorph-btn p-2 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Heart className="w-4 h-4 fill-white text-white" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>

            {/* Badges Tab */}
            <TabsContent value="badges">
              <div className="neomorph-flat p-6">
                <h3 className="text-xl font-semibold text-white mb-6">Kazandığım Unvanlar</h3>
                
                {loadingBadges ? (
                  <p className="text-gray-400 text-center py-8">Yükleniyor...</p>
                ) : badges.length === 0 ? (
                  <p className="text-gray-400 text-center py-8">Henüz unvanınız yok</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {badges.map((badge, index) => (
                      <div
                        key={index}
                        data-testid={`badge-${badge.type}`}
                        className={`neomorph-flat p-6 ${
                          badge.premium 
                            ? 'bg-gradient-to-br from-yellow-900/20 to-orange-900/20 border-2 border-yellow-500/50' 
                            : ''
                        }`}
                      >
                        <div className="flex items-center gap-4">
                          <div className={`text-5xl ${badge.premium ? 'animate-pulse' : ''}`}>
                            {badge.icon}
                          </div>
                          <div className="flex-1">
                            <h4 className={`text-lg font-bold mb-1 ${
                              badge.premium 
                                ? 'text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500' 
                                : 'text-white'
                            }`}>
                              {badge.name}
                            </h4>
                            <p className="text-sm text-gray-400 capitalize">{badge.type === 'duration' ? 'Süre Bazlı' : badge.type === 'likes' ? 'Beğeni Bazlı' : badge.type === 'comments' ? 'Yorum Bazlı' : 'Özel Unvan'}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
