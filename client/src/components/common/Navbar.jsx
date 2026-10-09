import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu, Search, PlusCircle, Sprout, MapPin } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import { Button } from './Button.jsx';

export const Navbar = ({ onOpenSidebar }) => {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/crops?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-200 bg-white/95 backdrop-blur px-4 sm:px-6">
      {/* Left side: Hamburger and Search */}
      <div className="flex items-center gap-4 flex-1 max-w-lg">
        <button
          onClick={onOpenSidebar}
          className="lg:hidden rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700"
          aria-label="Open Navigation"
        >
          <Menu className="h-5 w-5" />
        </button>

        {/* Crop Search input */}
        <form onSubmit={handleSearch} className="relative w-full hidden sm:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search crops, varieties, or regions (e.g., Wheat, Sona Masoori, Nashik)..."
            className="w-full rounded-xl border border-slate-200 bg-slate-50/70 pl-9 pr-4 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-agri-500 focus:outline-none focus:ring-1 focus:ring-agri-500 transition-all"
          />
        </form>
      </div>

      {/* Right side: Quick Action Buttons & Location Indicator */}
      <div className="flex items-center gap-3">
        {profile?.district && profile?.state && (
          <div className="hidden md:flex items-center gap-1.5 text-xs text-slate-500 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200/60">
            <MapPin className="w-3.5 h-3.5 text-agri-600" />
            <span className="font-medium text-slate-700">{profile.district}, {profile.state}</span>
          </div>
        )}

        <Button
          size="sm"
          variant="outline"
          icon={Sprout}
          onClick={() => navigate('/crops')}
          className="hidden sm:inline-flex"
        >
          Find Crops
        </Button>

        <Button
          size="sm"
          variant="primary"
          icon={PlusCircle}
          onClick={() => navigate('/requirements?action=new')}
        >
          Post Requirement
        </Button>
      </div>
    </header>
  );
};
