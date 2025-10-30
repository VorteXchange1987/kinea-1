import { useState } from 'react';
import axios from 'axios';
import Navbar from '@/components/Navbar';
import { useAuth } from '@/App';
import { toast } from 'sonner';
import { Camera, Shield } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const ProfilePage = () => {
  const { user, token, refreshUser } = useAuth();
  const [photoUrl, setPhotoUrl] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

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

  if (!user) return null;

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <Navbar />

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <h1 data-testid="profile-title" className="text-3xl font-bold text-white mb-8">Profilim</h1>

          {/* Profile Card */}
          <div className="neomorph-flat p-8 space-y-6">
            {/* Avatar Section */}
            <div className="flex flex-col items-center">
              <Avatar className="w-32 h-32 mb-4">
                <AvatarImage src={user.profile_photo_url} />
                <AvatarFallback className="bg-gray-800 text-white text-4xl">
                  {user.username.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>

              <div className="flex items-center gap-2 mb-2">
                <h2 className="text-2xl font-bold text-white">{user.username}</h2>
                {user.role === 'SUPER_ADMIN' && (
                  <span className="admin-badge">
                    <Shield className="w-3 h-3" />
                    Admin
                  </span>
                )}
                {user.role === 'MODERATOR' && (
                  <span className="moderator-badge">KINEA Yardımcısı</span>
                )}
              </div>

              <p className="text-gray-400">{user.email}</p>
            </div>

            {/* Update Photo Form */}
            <div className="pt-6 border-t border-gray-800">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Camera className="w-5 h-5" />
                Profil Fotoğrafını Güncelle
              </h3>

              <form onSubmit={handleUpdatePhoto} className="space-y-4">
                <div>
                  <label className="block text-gray-400 mb-2 text-sm">
                    Fotoğraf URL'si
                  </label>
                  <input
                    data-testid="photo-url-input"
                    type="url"
                    value={photoUrl}
                    onChange={(e) => setPhotoUrl(e.target.value)}
                    placeholder="https://ornek.com/foto.jpg"
                    className="w-full neomorph-input px-4 py-2 text-white focus:outline-none"
                    disabled={isUpdating}
                  />
                  <p className="text-gray-500 text-xs mt-1">
                    Örnek: Imgur, Cloudinary veya herhangi bir görsel URL'si
                  </p>
                </div>

                <button
                  data-testid="update-photo-button"
                  type="submit"
                  disabled={isUpdating || !photoUrl.trim()}
                  className="w-full neomorph-btn py-3 text-white font-semibold disabled:opacity-50"
                >
                  {isUpdating ? 'Güncelleniyor...' : 'Fotoğrafı Güncelle'}
                </button>
              </form>
            </div>

            {/* Account Info */}
            <div className="pt-6 border-t border-gray-800 space-y-3">
              <h3 className="text-lg font-semibold text-white mb-4">Hesap Bilgileri</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="neomorph-flat p-4">
                  <p className="text-gray-400 text-sm mb-1">Rol</p>
                  <p className="text-white font-medium">
                    {user.role === 'SUPER_ADMIN' ? 'Admin' :
                     user.role === 'MODERATOR' ? 'Moderator' : 'Kullanıcı'}
                  </p>
                </div>

                <div className="neomorph-flat p-4">
                  <p className="text-gray-400 text-sm mb-1">Kayıt Tarihi</p>
                  <p className="text-white font-medium">
                    {new Date(user.created_at).toLocaleDateString('tr-TR')}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;