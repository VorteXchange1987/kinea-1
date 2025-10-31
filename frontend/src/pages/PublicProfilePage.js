import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import Navbar from '@/components/Navbar';
import { Shield, Award, Calendar, MessageCircle, ThumbsUp } from 'lucide-react';
import { toast } from 'sonner';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const PublicProfilePage = () => {
  const { userId } = useParams();
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPublicProfile();
  }, [userId]);

  const fetchPublicProfile = async () => {
    try {
      const response = await axios.get(`${API}/users/${userId}/public-profile`);
      setProfileData(response.data);
    } catch (error) {
      console.error('Failed to fetch public profile:', error);
      toast.error('Profil yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a]">
        <Navbar />
        <div className="container mx-auto px-4 py-20 text-center">
          <div className="neomorph inline-block p-8">
            <p className="text-white text-xl">Yükleniyor...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!profileData) {
    return (
      <div className="min-h-screen bg-[#0a0a0a]">
        <Navbar />
        <div className="container mx-auto px-4 py-20 text-center">
          <div className="neomorph inline-block p-8">
            <p className="text-white text-xl">Kullanıcı bulunamadı</p>
          </div>
        </div>
      </div>
    );
  }

  const { user, badges, stats } = profileData;

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <Navbar />

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
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
                  <h1 data-testid="public-profile-username" className="text-3xl font-bold text-white">
                    {user.username}
                  </h1>
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

                <div className="flex items-center justify-center md:justify-start gap-2 text-gray-400 mt-2">
                  <Calendar className="w-4 h-4" />
                  <span className="text-sm">
                    Üye oldu: {new Date(user.created_at).toLocaleDateString('tr-TR', { 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="neomorph-flat p-6">
              <div className="flex items-center gap-4">
                <div className="neomorph-btn p-4">
                  <MessageCircle className="w-8 h-8 text-blue-400" />
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Toplam Yorum</p>
                  <p data-testid="total-comments" className="text-white text-3xl font-bold">
                    {stats.total_comments}
                  </p>
                </div>
              </div>
            </div>

            <div className="neomorph-flat p-6">
              <div className="flex items-center gap-4">
                <div className="neomorph-btn p-4">
                  <ThumbsUp className="w-8 h-8 text-green-400" />
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Aldığı Beğeni</p>
                  <p data-testid="total-likes" className="text-white text-3xl font-bold">
                    {stats.total_likes}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Badges */}
          <div className="neomorph-flat p-6">
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
              <Award className="w-6 h-6" />
              Unvanları
            </h2>

            {badges.length === 0 ? (
              <p className="text-gray-400 text-center py-8">Bu kullanıcı henüz unvan kazanmadı</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {badges.map((badge, index) => (
                  <div
                    key={index}
                    data-testid={`public-badge-${badge.type}`}
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
                        <h3 className={`text-lg font-bold mb-1 ${
                          badge.premium 
                            ? 'text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500' 
                            : 'text-white'
                        }`}>
                          {badge.name}
                        </h3>
                        <p className="text-sm text-gray-400 capitalize">
                          {badge.type === 'duration' ? 'Süre Bazlı' : 
                           badge.type === 'likes' ? 'Beğeni Bazlı' : 
                           badge.type === 'comments' ? 'Yorum Bazlı' : 
                           'Özel Unvan'}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PublicProfilePage;
