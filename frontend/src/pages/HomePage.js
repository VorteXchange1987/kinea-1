import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Navbar from '@/components/Navbar';
import { Heart } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/App';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const HomePage = () => {
  const navigate = useNavigate();
  const { token, isAuthenticated } = useAuth();
  const [series, setSeries] = useState([]);
  const [filteredSeries, setFilteredSeries] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSeries();
    if (isAuthenticated) {
      fetchFavorites();
    }
  }, [isAuthenticated]);

  const fetchSeries = async () => {
    try {
      const response = await axios.get(`${API}/series`);
      setSeries(response.data);
      setFilteredSeries(response.data);
    } catch (error) {
      console.error('Failed to fetch series:', error);
      toast.error('Diziler yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  const fetchFavorites = async () => {
    try {
      const response = await axios.get(`${API}/favorites`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setFavorites(response.data.map(s => s.id));
    } catch (error) {
      console.error('Failed to fetch favorites:', error);
    }
  };

  const handleSearch = async (query) => {
    if (!query) {
      setFilteredSeries(series);
      return;
    }

    try {
      const response = await axios.get(`${API}/series/search?q=${encodeURIComponent(query)}`);
      setFilteredSeries(response.data);
    } catch (error) {
      console.error('Search failed:', error);
    }
  };

  const toggleFavorite = async (seriesId, e) => {
    e.stopPropagation();
    if (!isAuthenticated) {
      toast.error('Favori eklemek için giriş yapmalısınız');
      return;
    }

    try {
      const response = await axios.post(
        `${API}/favorites/${seriesId}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.action === 'added') {
        setFavorites([...favorites, seriesId]);
        toast.success('Favorilere eklendi');
      } else {
        setFavorites(favorites.filter(id => id !== seriesId));
        toast.info('Favorilerden çıkarıldı');
      }
    } catch (error) {
      console.error('Toggle favorite failed:', error);
      toast.error('Bir hata oluştu');
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <Navbar onSearch={handleSearch} />

      <div className="container mx-auto px-4 py-8">
        <h1 data-testid="page-title" className="text-3xl sm:text-4xl font-bold text-white mb-8">Diziler</h1>

        {loading ? (
          <div className="text-center py-20">
            <div className="neomorph inline-block p-8">
              <p className="text-white text-xl">Yükleniyor...</p>
            </div>
          </div>
        ) : filteredSeries.length === 0 ? (
          <div className="text-center py-20">
            <div className="neomorph inline-block p-8">
              <p className="text-gray-400 text-xl">Dizi bulunamadı</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
            {filteredSeries.map((item) => (
              <div
                key={item.id}
                data-testid={`series-card-${item.id}`}
                onClick={() => navigate(`/series/${item.id}`)}
                className="neomorph-flat neomorph-hover p-4 cursor-pointer group relative"
              >
                <div className="aspect-[2/3] mb-3 rounded-lg overflow-hidden bg-gray-900">
                  <img
                    src={item.poster_url}
                    alt={item.title}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.src = 'https://via.placeholder.com/300x450/121212/ffffff?text=' + encodeURIComponent(item.title);
                    }}
                  />
                </div>
                <h3 className="text-white font-semibold text-sm mb-1 truncate">{item.title}</h3>
                {item.genre && (
                  <p className="text-gray-400 text-xs truncate">{item.genre}</p>
                )}

                {/* Favorite Button */}
                <button
                  data-testid={`favorite-button-${item.id}`}
                  onClick={(e) => toggleFavorite(item.id, e)}
                  className="absolute top-6 right-6 neomorph-btn p-2"
                >
                  <Heart
                    className={`w-5 h-5 ${
                      favorites.includes(item.id)
                        ? 'fill-white text-white'
                        : 'text-gray-400'
                    }`}
                  />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default HomePage;