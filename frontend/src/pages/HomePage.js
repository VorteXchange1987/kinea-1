import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Navbar from '@/components/Navbar';
import { Heart, Filter, X } from 'lucide-react';
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
  
  // Filter states
  const [showFilters, setShowFilters] = useState(false);
  const [availableGenres, setAvailableGenres] = useState([]);
  const [availableYears, setAvailableYears] = useState([]);
  const [selectedGenre, setSelectedGenre] = useState('');
  const [selectedYear, setSelectedYear] = useState('');
  const [minRating, setMinRating] = useState('');

  useEffect(() => {
    fetchSeries();
    fetchFilterOptions();
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

  const fetchFilterOptions = async () => {
    try {
      const response = await axios.get(`${API}/series/filters`);
      setAvailableGenres(response.data.genres || []);
      setAvailableYears(response.data.years || []);
    } catch (error) {
      console.error('Failed to fetch filter options:', error);
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

  const applyFilters = async () => {
    try {
      const params = new URLSearchParams();
      if (selectedGenre) params.append('genre', selectedGenre);
      if (selectedYear) params.append('year', selectedYear);
      if (minRating) params.append('min_rating', minRating);

      if (params.toString()) {
        const response = await axios.get(`${API}/series/filter?${params.toString()}`);
        setFilteredSeries(response.data);
      } else {
        setFilteredSeries(series);
      }
    } catch (error) {
      console.error('Filter failed:', error);
      toast.error('Filtreleme başarısız');
    }
  };

  const clearFilters = () => {
    setSelectedGenre('');
    setSelectedYear('');
    setMinRating('');
    setFilteredSeries(series);
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
        <div className="flex items-center justify-between mb-8">
          <h1 data-testid="page-title" className="text-3xl sm:text-4xl font-bold text-white">Diziler</h1>
          
          {/* Filter Toggle Button */}
          <button
            data-testid="filter-toggle-btn"
            onClick={() => setShowFilters(!showFilters)}
            className="neomorph-btn px-4 py-2 flex items-center gap-2 text-white"
          >
            <Filter className="w-5 h-5" />
            <span>Filtrele</span>
          </button>
        </div>

        {/* Filter Panel */}
        {showFilters && (
          <div data-testid="filter-panel" className="neomorph-flat p-6 mb-8 animate-in slide-in-from-top-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-white">Gelişmiş Filtreleme</h3>
              <button
                onClick={() => setShowFilters(false)}
                className="text-gray-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              {/* Genre Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Tür</label>
                <select
                  data-testid="genre-filter"
                  value={selectedGenre}
                  onChange={(e) => setSelectedGenre(e.target.value)}
                  className="w-full neomorph-input px-4 py-2 text-white focus:outline-none"
                >
                  <option value="">Tüm Türler</option>
                  {availableGenres.map((genre) => (
                    <option key={genre} value={genre}>{genre}</option>
                  ))}
                </select>
              </div>

              {/* Year Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Yıl</label>
                <select
                  data-testid="year-filter"
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(e.target.value)}
                  className="w-full neomorph-input px-4 py-2 text-white focus:outline-none"
                >
                  <option value="">Tüm Yıllar</option>
                  {availableYears.map((year) => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
              </div>

              {/* Rating Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Minimum Puan</label>
                <select
                  data-testid="rating-filter"
                  value={minRating}
                  onChange={(e) => setMinRating(e.target.value)}
                  className="w-full neomorph-input px-4 py-2 text-white focus:outline-none"
                >
                  <option value="">Tümü</option>
                  <option value="7">7.0+</option>
                  <option value="8">8.0+</option>
                  <option value="9">9.0+</option>
                </select>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                data-testid="apply-filters-btn"
                onClick={applyFilters}
                className="neomorph-btn px-6 py-2 text-white font-medium"
              >
                Filtreleri Uygula
              </button>
              <button
                data-testid="clear-filters-btn"
                onClick={clearFilters}
                className="neomorph-btn px-6 py-2 text-gray-400 font-medium"
              >
                Temizle
              </button>
            </div>
          </div>
        )}

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
                <div className="flex items-center justify-between text-xs text-gray-400">
                  {item.genre && <span className="truncate">{item.genre}</span>}
                  {item.year && <span>{item.year}</span>}
                </div>
                {item.rating && (
                  <div className="text-xs text-yellow-400 mt-1">
                    ⭐ {item.rating.toFixed(1)}
                  </div>
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