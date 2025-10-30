import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/App';
import { Search, User, LogOut, Shield, Settings } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

const Navbar = ({ onSearch }) => {
  const { user, logout, isAdmin, isModerator } = useAuth();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim() && onSearch) {
      onSearch(searchQuery.trim());
    }
  };

  return (
    <nav className="sticky top-0 z-50 neomorph mb-6">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between gap-4">
          {/* Logo */}
          <Link to="/home" className="flex items-center">
            <img 
              src="https://customer-assets.emergentagent.com/job_6fe398f4-61e4-451c-814f-579c21b513bf/artifacts/d5u0r8a4_kinealogo.png" 
              alt="KINEA Logo" 
              className="h-10 w-auto"
            />
          </Link>

          {/* Search Bar */}
          {onSearch && (
            <form onSubmit={handleSearch} className="flex-1 max-w-md">
              <div className="relative">
                <input
                  data-testid="search-input"
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Dizi ara..."
                  className="w-full neomorph-input px-4 py-2 pl-10 text-white placeholder-gray-500 focus:outline-none"
                />
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              </div>
            </form>
          )}

          {/* User Menu */}
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger data-testid="user-menu-trigger" className="neomorph-btn px-4 py-2 flex items-center gap-2">
                <Avatar className="w-8 h-8">
                  <AvatarImage src={user.profile_photo_url} />
                  <AvatarFallback className="bg-gray-800 text-white">
                    {user.username.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span className="text-white hidden sm:inline">{user.username}</span>
              </DropdownMenuTrigger>
              <DropdownMenuContent data-testid="user-menu-content" className="neomorph border-0">
                <DropdownMenuItem 
                  data-testid="profile-menu-item"
                  onClick={() => navigate('/profile')}
                  className="text-white cursor-pointer hover:bg-gray-800"
                >
                  <User className="w-4 h-4 mr-2" />
                  Profilim
                </DropdownMenuItem>
                {isModerator && (
                  <DropdownMenuItem 
                    data-testid="moderator-panel-menu-item"
                    onClick={() => navigate('/moderator')}
                    className="text-white cursor-pointer hover:bg-gray-800"
                  >
                    <Settings className="w-4 h-4 mr-2" />
                    Mod Panel
                  </DropdownMenuItem>
                )}
                {isAdmin && (
                  <DropdownMenuItem 
                    data-testid="admin-panel-menu-item"
                    onClick={() => navigate('/admin')}
                    className="text-white cursor-pointer hover:bg-gray-800"
                  >
                    <Shield className="w-4 h-4 mr-2" />
                    Admin Panel
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem 
                  data-testid="logout-menu-item"
                  onClick={logout}
                  className="text-red-400 cursor-pointer hover:bg-gray-800"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Çıkış Yap
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Link to="/" data-testid="login-link">
              <button className="neomorph-btn px-6 py-2 text-white font-medium">
                Giriş Yap
              </button>
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;