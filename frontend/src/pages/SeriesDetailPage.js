import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Navbar from '@/components/Navbar';
import { Play, ChevronDown, ChevronUp } from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const SeriesDetailPage = () => {
  const { seriesId } = useParams();
  const navigate = useNavigate();
  const [series, setSeries] = useState(null);
  const [seasons, setSeasons] = useState([]);
  const [episodesBySeason, setEpisodesBySeason] = useState({});
  const [expandedSeasons, setExpandedSeasons] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSeriesData();
  }, [seriesId]);

  const fetchSeriesData = async () => {
    try {
      const [seriesRes, seasonsRes] = await Promise.all([
        axios.get(`${API}/series/${seriesId}`),
        axios.get(`${API}/series/${seriesId}/seasons`)
      ]);

      setSeries(seriesRes.data);
      setSeasons(seasonsRes.data);

      // Fetch episodes for each season
      const episodesData = {};
      for (const season of seasonsRes.data) {
        const episodesRes = await axios.get(`${API}/seasons/${season.id}/episodes`);
        episodesData[season.id] = episodesRes.data;
      }
      setEpisodesBySeason(episodesData);

      // Expand first season by default
      if (seasonsRes.data.length > 0) {
        setExpandedSeasons({ [seasonsRes.data[0].id]: true });
      }
    } catch (error) {
      console.error('Failed to fetch series data:', error);
      toast.error('Dizi bilgileri yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  const toggleSeason = (seasonId) => {
    setExpandedSeasons(prev => ({
      ...prev,
      [seasonId]: !prev[seasonId]
    }));
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

  if (!series) {
    return (
      <div className="min-h-screen bg-[#0a0a0a]">
        <Navbar />
        <div className="container mx-auto px-4 py-20 text-center">
          <div className="neomorph inline-block p-8">
            <p className="text-white text-xl">Dizi bulunamadı</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <Navbar />

      <div className="container mx-auto px-4 py-8">
        {/* Series Header */}
        <div className="neomorph-flat p-6 md:p-8 mb-8">
          <div className="flex flex-col md:flex-row gap-6">
            <div className="w-full md:w-48 flex-shrink-0">
              <img
                src={series.poster_url}
                alt={series.title}
                className="w-full rounded-lg"
                onError={(e) => {
                  e.target.src = 'https://via.placeholder.com/300x450/121212/ffffff?text=' + encodeURIComponent(series.title);
                }}
              />
            </div>
            <div className="flex-1">
              <h1 data-testid="series-title" className="text-3xl sm:text-4xl font-bold text-white mb-3">
                {series.title}
              </h1>
              {series.genre && (
                <p className="text-gray-400 mb-4">{series.genre}</p>
              )}
              <p className="text-gray-300 leading-relaxed">{series.description}</p>
            </div>
          </div>
        </div>

        {/* Seasons & Episodes */}
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-white mb-4">Sezonlar ve Bölümler</h2>

          {seasons.length === 0 ? (
            <div className="neomorph-flat p-8 text-center">
              <p className="text-gray-400">Henüz bölüm eklenmemiş</p>
            </div>
          ) : (
            seasons.map((season) => (
              <div key={season.id} className="neomorph-flat overflow-hidden">
                <button
                  data-testid={`season-toggle-${season.id}`}
                  onClick={() => toggleSeason(season.id)}
                  className="w-full p-4 flex items-center justify-between hover:bg-gray-900/20"
                >
                  <h3 className="text-white font-semibold text-lg">
                    {season.season_number}. Sezon - {season.title}
                  </h3>
                  {expandedSeasons[season.id] ? (
                    <ChevronUp className="text-gray-400 w-5 h-5" />
                  ) : (
                    <ChevronDown className="text-gray-400 w-5 h-5" />
                  )}
                </button>

                {expandedSeasons[season.id] && (
                  <div className="p-4 pt-0 space-y-2">
                    {episodesBySeason[season.id]?.length === 0 ? (
                      <p className="text-gray-400 text-center py-4">Bölüm yok</p>
                    ) : (
                      episodesBySeason[season.id]?.map((episode) => (
                        <div
                          key={episode.id}
                          data-testid={`episode-card-${episode.id}`}
                          onClick={() => navigate(`/watch/${episode.id}`)}
                          className="neomorph-flat neomorph-hover p-4 cursor-pointer flex items-center gap-4"
                        >
                          <div className="neomorph-btn p-3">
                            <Play className="w-5 h-5 text-white" />
                          </div>
                          <div className="flex-1">
                            <h4 className="text-white font-medium">
                              Bölüm {episode.episode_number}: {episode.title}
                            </h4>
                            {episode.description && (
                              <p className="text-gray-400 text-sm mt-1 line-clamp-2">
                                {episode.description}
                              </p>
                            )}
                          </div>
                          <div className="text-gray-500 text-sm">
                            {episode.views || 0} görüntüleme
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default SeriesDetailPage;