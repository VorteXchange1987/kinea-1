import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Navbar from '@/components/Navbar';
import { useAuth } from '@/App';
import { toast } from 'sonner';
import { Plus, Trash2, Edit2 } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const ModeratorPanel = () => {
  const { token, user } = useAuth();
  const navigate = useNavigate();
  const [series, setSeries] = useState([]);
  const [selectedSeries, setSelectedSeries] = useState(null);
  const [seasons, setSeasons] = useState([]);
  const [selectedSeason, setSelectedSeason] = useState(null);
  const [episodes, setEpisodes] = useState([]);
  const [showSeriesModal, setShowSeriesModal] = useState(false);
  const [showSeasonModal, setShowSeasonModal] = useState(false);
  const [showEpisodeModal, setShowEpisodeModal] = useState(false);

  const [seriesForm, setSeriesForm] = useState({ title: '', description: '', poster_url: '', genre: '' });
  const [seasonForm, setSeasonForm] = useState({ season_number: 1, title: '' });
  const [episodeForm, setEpisodeForm] = useState({
    episode_number: 1,
    title: '',
    video_embed_url: '',
    thumbnail_url: '',
    description: ''
  });

  useEffect(() => {
    if (!user || !['SUPER_ADMIN', 'ADMIN', 'MODERATOR'].includes(user.role)) {
      navigate('/');
      return;
    }
    fetchSeries();
  }, [user]);

  const fetchSeries = async () => {
    try {
      const response = await axios.get(`${API}/series`);
      setSeries(response.data);
    } catch (error) {
      console.error('Failed to fetch series:', error);
    }
  };

  const fetchSeasons = async (seriesId) => {
    try {
      const response = await axios.get(`${API}/series/${seriesId}/seasons`);
      setSeasons(response.data);
    } catch (error) {
      console.error('Failed to fetch seasons:', error);
    }
  };

  const fetchEpisodes = async (seasonId) => {
    try {
      const response = await axios.get(`${API}/seasons/${seasonId}/episodes`);
      setEpisodes(response.data);
    } catch (error) {
      console.error('Failed to fetch episodes:', error);
    }
  };

  const handleCreateSeries = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API}/series`, seriesForm, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Dizi eklendi');
      setShowSeriesModal(false);
      setSeriesForm({ title: '', description: '', poster_url: '', genre: '' });
      fetchSeries();
    } catch (error) {
      toast.error('Dizi eklenemedi');
    }
  };

  const handleCreateSeason = async (e) => {
    e.preventDefault();
    if (!selectedSeries) {
      toast.error('Lütfen bir dizi seçin');
      return;
    }
    try {
      await axios.post(
        `${API}/seasons`,
        { ...seasonForm, series_id: selectedSeries.id },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success('Sezon eklendi');
      setShowSeasonModal(false);
      setSeasonForm({ season_number: 1, title: '' });
      fetchSeasons(selectedSeries.id);
    } catch (error) {
      toast.error('Sezon eklenemedi');
    }
  };

  const handleCreateEpisode = async (e) => {
    e.preventDefault();
    if (!selectedSeason) {
      toast.error('Lütfen bir sezon seçin');
      return;
    }
    try {
      await axios.post(
        `${API}/episodes`,
        { ...episodeForm, season_id: selectedSeason.id },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success('Bölüm eklendi');
      setShowEpisodeModal(false);
      setEpisodeForm({
        episode_number: 1,
        title: '',
        video_embed_url: '',
        thumbnail_url: '',
        description: ''
      });
      fetchEpisodes(selectedSeason.id);
    } catch (error) {
      toast.error('Bölüm eklenemedi');
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <Navbar />

      <div className="container mx-auto px-4 py-8">
        <h1 data-testid="moderator-panel-title" className="text-3xl font-bold text-white mb-8">
          Moderator Paneli
        </h1>

        <Tabs defaultValue="series" className="space-y-6">
          <TabsList className="neomorph-flat p-1">
            <TabsTrigger data-testid="series-tab" value="series" className="px-6 py-2 text-white data-[state=active]:neomorph-inset">
              Diziler
            </TabsTrigger>
            <TabsTrigger data-testid="seasons-tab" value="seasons" className="px-6 py-2 text-white data-[state=active]:neomorph-inset">
              Sezonlar
            </TabsTrigger>
            <TabsTrigger data-testid="episodes-tab" value="episodes" className="px-6 py-2 text-white data-[state=active]:neomorph-inset">
              Bölümler
            </TabsTrigger>
          </TabsList>

          {/* Series Tab */}
          <TabsContent value="series">
            <div className="neomorph-flat p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-white">Diziler</h2>
                <button
                  data-testid="add-series-button"
                  onClick={() => setShowSeriesModal(true)}
                  className="neomorph-btn px-4 py-2 text-white font-medium flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Yeni Dizi
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {series.map((item) => (
                  <div key={item.id} data-testid={`mod-series-${item.id}`} className="neomorph-flat p-4">
                    <img
                      src={item.poster_url}
                      alt={item.title}
                      className="w-full h-48 object-cover rounded-lg mb-3"
                      onError={(e) => {
                        e.target.src = 'https://via.placeholder.com/300x450/121212/ffffff?text=' + encodeURIComponent(item.title);
                      }}
                    />
                    <h3 className="text-white font-semibold mb-1">{item.title}</h3>
                    <p className="text-gray-400 text-sm line-clamp-2">{item.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>

          {/* Seasons Tab */}
          <TabsContent value="seasons">
            <div className="neomorph-flat p-6">
              <div className="mb-6">
                <label className="block text-gray-400 mb-2">Dizi Seçin</label>
                <select
                  data-testid="select-series-for-season"
                  value={selectedSeries?.id || ''}
                  onChange={(e) => {
                    const series = e.target.value;
                    setSelectedSeries(series ? { id: series } : null);
                    if (series) fetchSeasons(series);
                  }}
                  className="w-full neomorph-input px-4 py-2 text-white focus:outline-none"
                >
                  <option value="">Dizi seçin...</option>
                  {series.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.title}
                    </option>
                  ))}
                </select>
              </div>

              {selectedSeries && (
                <>
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-white">Sezonlar</h2>
                    <button
                      data-testid="add-season-button"
                      onClick={() => setShowSeasonModal(true)}
                      className="neomorph-btn px-4 py-2 text-white font-medium flex items-center gap-2"
                    >
                      <Plus className="w-4 h-4" />
                      Yeni Sezon
                    </button>
                  </div>

                  <div className="space-y-3">
                    {seasons.map((season) => (
                      <div key={season.id} data-testid={`season-${season.id}`} className="neomorph-flat p-4">
                        <p className="text-white font-semibold">
                          {season.season_number}. Sezon - {season.title}
                        </p>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </TabsContent>

          {/* Episodes Tab */}
          <TabsContent value="episodes">
            <div className="neomorph-flat p-6">
              <div className="mb-6 space-y-4">
                <div>
                  <label className="block text-gray-400 mb-2">Dizi Seçin</label>
                  <select
                    data-testid="select-series-for-episode"
                    value={selectedSeries?.id || ''}
                    onChange={(e) => {
                      const series = e.target.value;
                      setSelectedSeries(series ? { id: series } : null);
                      setSelectedSeason(null);
                      if (series) fetchSeasons(series);
                    }}
                    className="w-full neomorph-input px-4 py-2 text-white focus:outline-none"
                  >
                    <option value="">Dizi seçin...</option>
                    {series.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.title}
                      </option>
                    ))}
                  </select>
                </div>

                {selectedSeries && (
                  <div>
                    <label className="block text-gray-400 mb-2">Sezon Seçin</label>
                    <select
                      data-testid="select-season-for-episode"
                      value={selectedSeason?.id || ''}
                      onChange={(e) => {
                        const season = e.target.value;
                        setSelectedSeason(season ? { id: season } : null);
                        if (season) fetchEpisodes(season);
                      }}
                      className="w-full neomorph-input px-4 py-2 text-white focus:outline-none"
                    >
                      <option value="">Sezon seçin...</option>
                      {seasons.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.season_number}. Sezon - {s.title}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {selectedSeason && (
                <>
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-white">Bölümler</h2>
                    <button
                      data-testid="add-episode-button"
                      onClick={() => setShowEpisodeModal(true)}
                      className="neomorph-btn px-4 py-2 text-white font-medium flex items-center gap-2"
                    >
                      <Plus className="w-4 h-4" />
                      Yeni Bölüm
                    </button>
                  </div>

                  <div className="space-y-3">
                    {episodes.map((episode) => (
                      <div key={episode.id} data-testid={`episode-${episode.id}`} className="neomorph-flat p-4">
                        <p className="text-white font-semibold">
                          Bölüm {episode.episode_number}: {episode.title}
                        </p>
                        <p className="text-gray-400 text-sm mt-1">{episode.views} görüntüleme</p>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Series Modal */}
      <Dialog open={showSeriesModal} onOpenChange={setShowSeriesModal}>
        <DialogContent data-testid="series-modal" className="neomorph border-0 max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-white text-2xl font-bold">Yeni Dizi Ekle</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateSeries} className="space-y-4 mt-4">
            <div>
              <label className="block text-gray-400 mb-2">Başlık</label>
              <input
                data-testid="series-title-input"
                type="text"
                value={seriesForm.title}
                onChange={(e) => setSeriesForm({ ...seriesForm, title: e.target.value })}
                className="w-full neomorph-input px-4 py-2 text-white focus:outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-gray-400 mb-2">Açıklama</label>
              <textarea
                data-testid="series-description-input"
                value={seriesForm.description}
                onChange={(e) => setSeriesForm({ ...seriesForm, description: e.target.value })}
                className="w-full neomorph-input px-4 py-2 text-white focus:outline-none min-h-[100px]"
                required
              />
            </div>
            <div>
              <label className="block text-gray-400 mb-2">Poster URL</label>
              <input
                data-testid="series-poster-input"
                type="url"
                value={seriesForm.poster_url}
                onChange={(e) => setSeriesForm({ ...seriesForm, poster_url: e.target.value })}
                className="w-full neomorph-input px-4 py-2 text-white focus:outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-gray-400 mb-2">Tür</label>
              <input
                data-testid="series-genre-input"
                type="text"
                value={seriesForm.genre}
                onChange={(e) => setSeriesForm({ ...seriesForm, genre: e.target.value })}
                className="w-full neomorph-input px-4 py-2 text-white focus:outline-none"
              />
            </div>
            <button
              data-testid="submit-series-button"
              type="submit"
              className="w-full neomorph-btn py-3 text-white font-semibold"
            >
              Ekle
            </button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Season Modal */}
      <Dialog open={showSeasonModal} onOpenChange={setShowSeasonModal}>
        <DialogContent data-testid="season-modal" className="neomorph border-0 max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-white text-2xl font-bold">Yeni Sezon Ekle</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateSeason} className="space-y-4 mt-4">
            <div>
              <label className="block text-gray-400 mb-2">Sezon Numarası</label>
              <input
                data-testid="season-number-input"
                type="number"
                min="1"
                value={seasonForm.season_number}
                onChange={(e) => setSeasonForm({ ...seasonForm, season_number: parseInt(e.target.value) })}
                className="w-full neomorph-input px-4 py-2 text-white focus:outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-gray-400 mb-2">Başlık</label>
              <input
                data-testid="season-title-input"
                type="text"
                value={seasonForm.title}
                onChange={(e) => setSeasonForm({ ...seasonForm, title: e.target.value })}
                className="w-full neomorph-input px-4 py-2 text-white focus:outline-none"
                required
              />
            </div>
            <button
              data-testid="submit-season-button"
              type="submit"
              className="w-full neomorph-btn py-3 text-white font-semibold"
            >
              Ekle
            </button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Episode Modal */}
      <Dialog open={showEpisodeModal} onOpenChange={setShowEpisodeModal}>
        <DialogContent data-testid="episode-modal" className="neomorph border-0 max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-white text-2xl font-bold">Yeni Bölüm Ekle</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateEpisode} className="space-y-4 mt-4">
            <div>
              <label className="block text-gray-400 mb-2">Bölüm Numarası</label>
              <input
                data-testid="episode-number-input"
                type="number"
                min="1"
                value={episodeForm.episode_number}
                onChange={(e) => setEpisodeForm({ ...episodeForm, episode_number: parseInt(e.target.value) })}
                className="w-full neomorph-input px-4 py-2 text-white focus:outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-gray-400 mb-2">Başlık</label>
              <input
                data-testid="episode-title-input"
                type="text"
                value={episodeForm.title}
                onChange={(e) => setEpisodeForm({ ...episodeForm, title: e.target.value })}
                className="w-full neomorph-input px-4 py-2 text-white focus:outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-gray-400 mb-2">Video Embed URL</label>
              <input
                data-testid="episode-video-input"
                type="url"
                value={episodeForm.video_embed_url}
                onChange={(e) => setEpisodeForm({ ...episodeForm, video_embed_url: e.target.value })}
                className="w-full neomorph-input px-4 py-2 text-white focus:outline-none"
                placeholder="https://www.youtube.com/embed/..."
                required
              />
            </div>
            <div>
              <label className="block text-gray-400 mb-2">Küçük Resim URL (opsiyonel)</label>
              <input
                data-testid="episode-thumbnail-input"
                type="url"
                value={episodeForm.thumbnail_url}
                onChange={(e) => setEpisodeForm({ ...episodeForm, thumbnail_url: e.target.value })}
                className="w-full neomorph-input px-4 py-2 text-white focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-gray-400 mb-2">Açıklama (opsiyonel)</label>
              <textarea
                data-testid="episode-description-input"
                value={episodeForm.description}
                onChange={(e) => setEpisodeForm({ ...episodeForm, description: e.target.value })}
                className="w-full neomorph-input px-4 py-2 text-white focus:outline-none min-h-[80px]"
              />
            </div>
            <button
              data-testid="submit-episode-button"
              type="submit"
              className="w-full neomorph-btn py-3 text-white font-semibold"
            >
              Ekle
            </button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ModeratorPanel;