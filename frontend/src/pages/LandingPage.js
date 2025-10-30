import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, Film } from 'lucide-react';
import AuthModal from '@/components/AuthModal';
import { useAuth } from '@/App';

const LandingPage = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);

  const handleGetStarted = () => {
    if (isAuthenticated) {
      navigate('/home');
    } else {
      setShowAuthModal(true);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] relative overflow-hidden">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-20 relative z-10">
        <div className="flex flex-col items-center justify-center min-h-[80vh] text-center">
          {/* Logo */}
          <div className="mb-8">
            <img 
              src="https://customer-assets.emergentagent.com/job_6fe398f4-61e4-451c-814f-579c21b513bf/artifacts/d5u0r8a4_kinealogo.png" 
              alt="KINEA Logo" 
              className="h-32 w-auto mx-auto"
            />
          </div>

          {/* Main Heading */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6 tracking-tight">
            En İyi Dizileri
            <br />
            <span className="text-gradient">Tek Platformda</span>
          </h1>

          {/* Subheading */}
          <p className="text-base sm:text-lg text-gray-400 max-w-2xl mb-12">
            KINEA ile favori dizilerinizi izleyin, yorumlarda paylaşımda bulunun ve enpopuler içerikleri keşfedin. Modern, hızlı ve kullanıcı dostu arayüz.
          </p>

          {/* CTA Button */}
          <button
            data-testid="get-started-button"
            onClick={handleGetStarted}
            className="neomorph-btn px-8 py-4 text-white font-semibold text-lg flex items-center gap-3 group"
          >
            <Play className="w-5 h-5" />
            Hemen Başla
          </button>

          {/* Features */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-20 w-full max-w-4xl">
            <div data-testid="feature-unlimited" className="neomorph-flat p-6 text-center">
              <Film className="w-10 h-10 mx-auto mb-4 text-white" />
              <h3 className="text-white font-semibold text-lg mb-2">Geniş Kütüphane</h3>
              <p className="text-gray-400 text-sm">Binlerce dizi ve bölüm erişiminizde</p>
            </div>

            <div data-testid="feature-community" className="neomorph-flat p-6 text-center">
              <svg className="w-10 h-10 mx-auto mb-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z"/>
              </svg>
              <h3 className="text-white font-semibold text-lg mb-2">Aktif Topluluk</h3>
              <p className="text-gray-400 text-sm">Diğer izleyicilerle fikir paylaşımı</p>
            </div>

            <div data-testid="feature-quality" className="neomorph-flat p-6 text-center">
              <svg className="w-10 h-10 mx-auto mb-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h3 className="text-white font-semibold text-lg mb-2">Yüksek Kalite</h3>
              <p className="text-gray-400 text-sm">HD kalitede kesintisiz izleme deneyimi</p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Links */}
      <div className="container mx-auto px-4 py-8 border-t border-gray-800">
        <div className="flex flex-col sm:flex-row justify-center items-center gap-6 text-gray-400">
          <a href="/about" className="hover:text-white">Hakkımızda</a>
          <a href="/contact" className="hover:text-white">İletişim</a>
        </div>
      </div>

      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
    </div>
  );
};

export default LandingPage;