import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import Navbar from '@/components/Navbar';
import CommentSection from '@/components/CommentSection';
import { toast } from 'sonner';
import { useAuth } from '@/App';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const WatchPage = () => {
  const { episodeId } = useParams();
  const { isAuthenticated } = useAuth();
  const [episode, setEpisode] = useState(null);
  const [ads, setAds] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEpisode();
    fetchAds();
  }, [episodeId]);

  const fetchEpisode = async () => {
    try {
      const response = await axios.get(`${API}/episodes/${episodeId}`);
      setEpisode(response.data);
    } catch (error) {
      console.error('Failed to fetch episode:', error);
      toast.error('Bölüm yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  const fetchAds = async () => {
    try {
      const response = await axios.get(`${API}/ads`);
      setAds(response.data);
    } catch (error) {
      console.error('Failed to fetch ads:', error);
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

  if (!episode) {
    return (
      <div className="min-h-screen bg-[#0a0a0a]">
        <Navbar />
        <div className="container mx-auto px-4 py-20 text-center">
          <div className="neomorph inline-block p-8">
            <p className="text-white text-xl">Bölüm bulunamadı</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <Navbar />

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Video Player */}
            <div className="neomorph-flat p-4">
              <div className="video-container" data-testid="video-player">
                <iframe
                  src={episode.video_embed_url}
                  title={episode.title}
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            </div>

            {/* Episode Info */}
            <div className="neomorph-flat p-6">
              <h1 data-testid="episode-title" className="text-2xl sm:text-3xl font-bold text-white mb-2">
                {episode.title}
              </h1>
              {episode.description && (
                <p className="text-gray-300 mt-4">{episode.description}</p>
              )}
              <div className="flex items-center gap-4 mt-4 text-sm text-gray-400">
                <span>Bölüm {episode.episode_number}</span>
                <span>•</span>
                <span>{episode.views} görüntüleme</span>
              </div>
            </div>

            {/* Comments */}
            <CommentSection episodeId={episodeId} />
          </div>

          {/* Sidebar - Ad Space */}
          <div className="lg:col-span-1">
            {ads && ads.content && (
              <div data-testid="ad-space" className="neomorph-flat p-4">
                <p className="text-xs text-gray-500 mb-2 text-center">Reklam</p>
                <div dangerouslySetInnerHTML={{ __html: ads.content }} />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default WatchPage;