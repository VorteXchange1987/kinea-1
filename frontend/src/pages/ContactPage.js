import { useState } from 'react';
import { toast } from 'sonner';

const ContactPage = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    toast.success('Mesajınız alındı! En kısa sürede dönüş yapacağız.');
    setFormData({ name: '', email: '', message: '' });
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <div className="container mx-auto px-4 py-20">
        {/* Logo */}
        <div className="text-center mb-12">
          <img 
            src="https://customer-assets.emergentagent.com/job_6fe398f4-61e4-451c-814f-579c21b513bf/artifacts/d5u0r8a4_kinealogo.png" 
            alt="KINEA Logo" 
            className="h-20 w-auto mx-auto mb-8"
          />
          <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4">İletişim</h1>
          <p className="text-gray-400">Sorularınız veya önerileriniz için bize ulaşın</p>
        </div>

        {/* Contact Form */}
        <div className="max-w-2xl mx-auto">
          <form onSubmit={handleSubmit} className="neomorph-flat p-8 space-y-6">
            <div>
              <label className="block text-gray-400 mb-2">Ad Soyad</label>
              <input
                data-testid="contact-name-input"
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full neomorph-input px-4 py-3 text-white focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-gray-400 mb-2">Email</label>
              <input
                data-testid="contact-email-input"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full neomorph-input px-4 py-3 text-white focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-gray-400 mb-2">Mesaj</label>
              <textarea
                data-testid="contact-message-input"
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                className="w-full neomorph-input px-4 py-3 text-white focus:outline-none min-h-[150px]"
                required
              />
            </div>

            <button
              data-testid="contact-submit-button"
              type="submit"
              className="w-full neomorph-btn py-3 text-white font-semibold"
            >
              Mesaj Gönder
            </button>
          </form>
        </div>

        {/* Back Button */}
        <div className="text-center mt-12">
          <a href="/">
            <button className="neomorph-btn px-8 py-3 text-white font-semibold">
              Ana Sayfaya Dön
            </button>
          </a>
        </div>
      </div>
    </div>
  );
};

export default ContactPage;