const AboutPage = () => {
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
          <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4">Hakkımızda</h1>
        </div>

        {/* Content */}
        <div className="max-w-3xl mx-auto space-y-6">
          <div className="neomorph-flat p-8">
            <h2 className="text-2xl font-bold text-white mb-4">KINEA Nedir?</h2>
            <p className="text-gray-300 leading-relaxed">
              KINEA, dizi tutkunları için tasarlanmış modern bir izleme platformudur. 
              Amacımız, kullanıcılarımıza en iyi dizi deneyimini sunmak ve 
              bir topluluk oluşturmaktır.
            </p>
          </div>

          <div className="neomorph-flat p-8">
            <h2 className="text-2xl font-bold text-white mb-4">Misyonumuz</h2>
            <p className="text-gray-300 leading-relaxed">
              Kullanıcılarımıza geniş bir dizi kütüphanesi sunarak, kaliteli 
              eğlence içeriklerine kolay erişim sağlamak. Ayrıca, izleyicilerin 
              birbirleriyle etkileşimde bulunabileceği sosyal bir platform oluşturmak.
            </p>
          </div>

          <div className="neomorph-flat p-8">
            <h2 className="text-2xl font-bold text-white mb-4">Vizyonumuz</h2>
            <p className="text-gray-300 leading-relaxed">
              Türkiye'nin en sevilen dizi izleme platformu olmak ve kullanıcılarımıza 
              sürekli gelişen, yenilikçi özellikler sunmak.
            </p>
          </div>
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

export default AboutPage;