import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4">
          <div className="neomorph-flat p-8 max-w-lg text-center">
            <h2 className="text-2xl font-bold text-white mb-4">Bir Hata Oluştu</h2>
            <p className="text-gray-400 mb-6">
              Üzgünüz, bir şeyler ters gitti. Lütfen sayfayı yenileyin.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="neomorph-btn px-6 py-3 text-white font-semibold"
            >
              Sayfayı Yenile
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
