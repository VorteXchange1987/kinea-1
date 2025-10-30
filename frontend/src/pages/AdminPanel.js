import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Navbar from '@/components/Navbar';
import { useAuth } from '@/App';
import { toast } from 'sonner';
import { Users, Film, MessageSquare, TrendingUp, Search, Ban, CheckCircle } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const AdminPanel = () => {
  const { token, user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [adContent, setAdContent] = useState('');
  const [showAdModal, setShowAdModal] = useState(false);

  useEffect(() => {
    if (!user || (user.role !== 'SUPER_ADMIN' && user.role !== 'ADMIN')) {
      navigate('/');
      return;
    }
    fetchStats();
    fetchAds();
  }, [user]);

  const fetchStats = async () => {
    try {
      const response = await axios.get(`${API}/stats`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStats(response.data);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  const fetchAds = async () => {
    try {
      const response = await axios.get(`${API}/ads`);
      setAdContent(response.data.content || '');
    } catch (error) {
      console.error('Failed to fetch ads:', error);
    }
  };

  const handleSearchUsers = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    try {
      const response = await axios.get(`${API}/users/search?q=${encodeURIComponent(searchQuery)}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSearchResults(response.data);
    } catch (error) {
      toast.error('Arama başarısız');
    }
  };

  const handleBanUser = async (userId, isBanned) => {
    try {
      const endpoint = isBanned ? 'unban' : 'ban';
      await axios.post(`${API}/users/${userId}/${endpoint}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success(isBanned ? 'Engel kaldırıldı' : 'Kullanıcı engellendi');
      handleSearchUsers(new Event('submit'));
    } catch (error) {
      const message = error.response?.data?.detail || 'Bir hata oluştu';
      toast.error(message);
    }
  };

  const handleUpdateRole = async (userId, newRole) => {
    try {
      await axios.put(
        `${API}/users/${userId}/role`,
        { role: newRole },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success('Rol güncellendi');
      handleSearchUsers(new Event('submit'));
    } catch (error) {
      const message = error.response?.data?.detail || 'Rol güncellenemedi';
      toast.error(message);
    }
  };

  const handleUpdateAds = async () => {
    try {
      await axios.put(
        `${API}/ads`,
        { content: adContent },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success('Reklam içeriği güncellendi');
      setShowAdModal(false);
    } catch (error) {
      toast.error('Reklam güncellenemedi');
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <Navbar />

      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 data-testid="admin-panel-title" className="text-3xl font-bold text-white">Admin Paneli</h1>
          <button
            data-testid="manage-ads-button"
            onClick={() => setShowAdModal(true)}
            className="neomorph-btn px-6 py-2 text-white font-medium"
          >
            Reklamları Yönet
          </button>
        </div>

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div data-testid="stat-users" className="neomorph-flat p-6">
              <div className="flex items-center gap-4">
                <Users className="w-10 h-10 text-white" />
                <div>
                  <p className="text-gray-400 text-sm">Toplam Kullanıcı</p>
                  <p className="text-white text-2xl font-bold">{stats.total_users}</p>
                </div>
              </div>
            </div>

            <div data-testid="stat-series" className="neomorph-flat p-6">
              <div className="flex items-center gap-4">
                <Film className="w-10 h-10 text-white" />
                <div>
                  <p className="text-gray-400 text-sm">Toplam Dizi</p>
                  <p className="text-white text-2xl font-bold">{stats.total_series}</p>
                </div>
              </div>
            </div>

            <div data-testid="stat-episodes" className="neomorph-flat p-6">
              <div className="flex items-center gap-4">
                <TrendingUp className="w-10 h-10 text-white" />
                <div>
                  <p className="text-gray-400 text-sm">Toplam Bölüm</p>
                  <p className="text-white text-2xl font-bold">{stats.total_episodes}</p>
                </div>
              </div>
            </div>

            <div data-testid="stat-comments" className="neomorph-flat p-6">
              <div className="flex items-center gap-4">
                <MessageSquare className="w-10 h-10 text-white" />
                <div>
                  <p className="text-gray-400 text-sm">Toplam Yorum</p>
                  <p className="text-white text-2xl font-bold">{stats.total_comments}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tabs */}
        <Tabs defaultValue="users" className="space-y-6">
          <TabsList className="neomorph-flat p-1">
            <TabsTrigger data-testid="users-tab" value="users" className="px-6 py-2 text-white data-[state=active]:neomorph-inset">
              Kullanıcılar
            </TabsTrigger>
            <TabsTrigger data-testid="content-tab" value="content" className="px-6 py-2 text-white data-[state=active]:neomorph-inset">
              İçerik Yönetimi
            </TabsTrigger>
          </TabsList>

          {/* Users Tab */}
          <TabsContent value="users">
            <div className="neomorph-flat p-6">
              <h2 className="text-xl font-bold text-white mb-4">Kullanıcı Ara</h2>
              <form onSubmit={handleSearchUsers} className="mb-6">
                <div className="flex gap-3">
                  <input
                    data-testid="user-search-input"
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Kullanıcı adı veya email..."
                    className="flex-1 neomorph-input px-4 py-2 text-white focus:outline-none"
                  />
                  <button
                    data-testid="search-users-button"
                    type="submit"
                    className="neomorph-btn px-6 py-2 text-white font-medium"
                  >
                    <Search className="w-5 h-5" />
                  </button>
                </div>
              </form>

              {/* Search Results */}
              {searchResults.length > 0 && (
                <div className="space-y-3">
                  {searchResults.map((resultUser) => (
                    <div
                      key={resultUser.id}
                      data-testid={`user-result-${resultUser.id}`}
                      className="neomorph-flat p-4 flex items-center justify-between"
                    >
                      <div>
                        <p className="text-white font-semibold">{resultUser.username}</p>
                        <p className="text-gray-400 text-sm">{resultUser.email}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`text-xs px-2 py-1 rounded ${
                            resultUser.role === 'SUPER_ADMIN' ? 'bg-gray-700' :
                            resultUser.role === 'MODERATOR' ? 'bg-gray-800' : 'bg-gray-900'
                          } text-white`}>
                            {resultUser.role}
                          </span>
                          {resultUser.is_banned && (
                            <span className="text-xs px-2 py-1 rounded bg-red-900 text-white">
                              Engelli
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex gap-2">
                        {!resultUser.is_super_admin && (
                          <>
                            <select
                              data-testid={`role-select-${resultUser.id}`}
                              value={resultUser.role}
                              onChange={(e) => handleUpdateRole(resultUser.id, e.target.value)}
                              className="neomorph-input px-3 py-1 text-white text-sm focus:outline-none"
                            >
                              <option value="USER">USER</option>
                              <option value="MODERATOR">MODERATOR</option>
                              <option value="ADMIN">ADMIN</option>
                            </select>

                            <button
                              data-testid={`ban-button-${resultUser.id}`}
                              onClick={() => handleBanUser(resultUser.id, resultUser.is_banned)}
                              className={`neomorph-btn p-2 ${
                                resultUser.is_banned ? 'text-green-400' : 'text-red-400'
                              }`}
                            >
                              {resultUser.is_banned ? (
                                <CheckCircle className="w-5 h-5" />
                              ) : (
                                <Ban className="w-5 h-5" />
                              )}
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          {/* Content Tab */}
          <TabsContent value="content">
            <div className="neomorph-flat p-6 text-center">
              <p className="text-gray-400 mb-4">İçerik yönetimi için moderator panelini kullanın</p>
              <button
                onClick={() => navigate('/moderator')}
                className="neomorph-btn px-6 py-2 text-white font-medium"
              >
                Moderator Paneline Git
              </button>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Ad Management Modal */}
      <Dialog open={showAdModal} onOpenChange={setShowAdModal}>
        <DialogContent data-testid="ad-modal" className="neomorph border-0 max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-white text-2xl font-bold">Reklam Yönetimi</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <p className="text-gray-400 text-sm">
              Reklam içeriğinizi buraya girin (HTML/iframe kodu)
            </p>
            <textarea
              data-testid="ad-content-input"
              value={adContent}
              onChange={(e) => setAdContent(e.target.value)}
              placeholder="<iframe src='...'></iframe> veya HTML kod"
              className="w-full neomorph-input px-4 py-3 text-white focus:outline-none min-h-[200px] font-mono text-sm"
            />
            <button
              data-testid="save-ad-button"
              onClick={handleUpdateAds}
              className="w-full neomorph-btn py-3 text-white font-semibold"
            >
              Kaydet
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminPanel;