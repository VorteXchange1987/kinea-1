import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useAuth } from '@/App';

const AuthModal = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const { login, register } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    // Gmail validation for register
    if (!isLogin && !formData.email.endsWith('@gmail.com')) {
      setError('Sadece Gmail adresleri kabul edilir (@gmail.com)');
      return;
    }

    setLoading(true);

    try {
      let result;
      if (isLogin) {
        result = await login(formData.email, formData.password);
      } else {
        result = await register(formData.username, formData.email, formData.password);
      }

      setLoading(false);
      if (result.success) {
        onClose();
        setFormData({ username: '', email: '', password: '' });
        setError('');
        // Navigate to home after successful login/register
        navigate('/home');
      } else if (result.error) {
        setError(result.error);
      }
    } catch (err) {
      setLoading(false);
      setError('Bir hata oluştu. Lütfen tekrar deneyin.');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent data-testid="auth-modal" className="neomorph border-0 max-w-md" aria-describedby="auth-description">
        <DialogHeader>
          <DialogTitle className="text-white text-2xl font-bold">
            {isLogin ? 'Giriş Yap' : 'Kayıt Ol'}
          </DialogTitle>
        </DialogHeader>
        <p id="auth-description" className="sr-only">
          {isLogin ? 'Hesabınıza giriş yapın' : 'Yeni bir hesap oluşturun'}
        </p>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          {!isLogin && (
            <div>
              <label className="block text-gray-400 mb-2 text-sm">Kullanıcı Adı</label>
              <input
                data-testid="username-input"
                type="text"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                className="w-full neomorph-input px-4 py-2 text-white focus:outline-none"
                required={!isLogin}
                minLength={3}
              />
            </div>
          )}

          <div>
            <label className="block text-gray-400 mb-2 text-sm">Email (Gmail)</label>
            <input
              data-testid="email-input"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full neomorph-input px-4 py-2 text-white focus:outline-none"
              required
              placeholder="ornek@gmail.com"
            />
          </div>

          <div>
            <label className="block text-gray-400 mb-2 text-sm">Şifre</label>
            <input
              data-testid="password-input"
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="w-full neomorph-input px-4 py-2 text-white focus:outline-none"
              required
              minLength={6}
            />
          </div>

          {error && (
            <div className="neomorph-input p-3 bg-red-900/20 border border-red-800">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          <button
            data-testid="auth-submit-button"
            type="submit"
            disabled={loading}
            className="w-full neomorph-btn py-3 text-white font-semibold disabled:opacity-50"
          >
            {loading ? 'Yükleniyor...' : (isLogin ? 'Giriş Yap' : 'Kayıt Ol')}
          </button>

          <div className="text-center">
            <button
              data-testid="toggle-auth-mode"
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              className="text-gray-400 hover:text-white text-sm"
            >
              {isLogin ? 'Hesabın yok mu? Kayıt ol' : 'Zaten hesabın var mı? Giriş yap'}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AuthModal;