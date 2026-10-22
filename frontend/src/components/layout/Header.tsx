import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, Sun, Moon, Globe, User, Menu, X, ShieldCheck, LogOut, Settings, Bookmark } from 'lucide-react';
import { useTheme } from '../../hooks/useTheme';
import { useAuth } from '../../hooks/useAuth';
import { Navbar } from './Navbar';
import { Dropdown } from '../ui/Dropdown';
import { Avatar } from '../ui/Avatar';

import { useLanguage } from '../../context/LanguageContext';
import { Heart } from 'lucide-react';

export const Header: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const { currentLanguage, setLanguage, availableLanguages, t } = useLanguage();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const activeLangObj = availableLanguages.find((l) => l.code === currentLanguage) || availableLanguages[0];

  const currentDate = new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  }).format(new Date());

  const languageItems = availableLanguages.map((lang) => ({
    label: `${lang.nativeName} (${lang.name})`,
    onClick: () => setLanguage(lang.code)
  }));

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const userMenuItems = [
    {
      label: t('profile'),
      icon: <User className="w-4 h-4 text-slate-500" />,
      onClick: () => navigate('/profile')
    },
    {
      label: t('saved'),
      icon: <Bookmark className="w-4 h-4 text-slate-500" />,
      onClick: () => navigate('/saved')
    },
    {
      label: t('liked'),
      icon: <Heart className="w-4 h-4 text-rose-500" />,
      onClick: () => navigate('/liked')
    },
    {
      label: t('preferences'),
      icon: <Settings className="w-4 h-4 text-slate-500" />,
      onClick: () => navigate('/settings')
    },
    ...(isAdmin
      ? [
          {
            label: t('admin'),
            icon: <ShieldCheck className="w-4 h-4 text-editorial-red" />,
            onClick: () => navigate('/admin')
          }
        ]
      : []),
    {
      label: t('signOut'),
      icon: <LogOut className="w-4 h-4 text-slate-500" />,
      onClick: handleLogout
    }
  ];

  return (
    <header className="w-full bg-white dark:bg-navy-950 border-b border-slate-200 dark:border-navy-700/80 sticky top-0 z-40">
      {/* Top Bar: Edition date, language selector, theme toggle, admin shortcut */}
      <div className="border-b border-slate-100 dark:border-navy-800/80 py-1.5 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-3">
            <span className="hidden md:inline font-serif italic text-slate-600 dark:text-slate-300">
              {currentDate}
            </span>
            <span className="hidden md:inline text-slate-300 dark:text-navy-700">|</span>
            <span className="text-[11px] uppercase tracking-wider font-semibold text-slate-600 dark:text-slate-300">
              Global Edition
            </span>
          </div>

          <div className="flex items-center gap-3">
            {/* Language Selector */}
            <Dropdown
              trigger={
                <button
                  type="button"
                  className="flex items-center gap-1.5 px-2 py-1 rounded hover:bg-slate-100 dark:hover:bg-navy-850 text-slate-700 dark:text-slate-300 transition-colors"
                  aria-label="Select language"
                >
                  <Globe className="w-3.5 h-3.5" />
                  <span className="text-xs font-medium hidden sm:inline">{activeLangObj.nativeName}</span>
                </button>
              }
              items={languageItems}
            />

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              type="button"
              className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-navy-850 text-slate-700 dark:text-slate-300 transition-colors"
              aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
            </button>

            {/* Admin entry point - visible if Admin */}
            {isAdmin && (
              <Link
                to="/admin"
                className="hidden lg:flex items-center gap-1 text-[11px] uppercase tracking-wider font-semibold px-2 py-1 rounded bg-slate-100 dark:bg-navy-850 hover:bg-slate-200 dark:hover:bg-navy-800 text-slate-700 dark:text-slate-300 transition-colors"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-editorial-red" />
                <span>Admin Console</span>
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Main Masthead / Logo Row */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
        {/* Mobile Hamburger Button */}
        <div className="flex items-center md:hidden">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-navy-800"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Brand Masthead */}
        <div className="flex-1 md:flex-initial text-center md:text-left">
          <Link to="/" className="inline-block group focus:outline-none">
            <div className="flex items-baseline gap-1.5 justify-center md:justify-start">
              <span className="text-2xl sm:text-3xl md:text-4xl font-black uppercase tracking-tighter text-navy-900 dark:text-white font-sans">
                THE NEWS REPORT
              </span>
              <span className="w-2.5 h-2.5 rounded-full bg-editorial-red inline-block mb-1 group-hover:scale-125 transition-transform" />
            </div>
            <p className="hidden sm:block text-[10px] uppercase font-bold tracking-[0.25em] text-slate-500 dark:text-slate-400">
              Authoritative • Independent • Multilingual
            </p>
          </Link>
        </div>

        {/* Action Buttons: Search & Account */}
        <div className="flex items-center gap-2 sm:gap-3">
          <Link
            to="/search"
            className="flex items-center gap-1.5 px-3 py-2 rounded text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-navy-850 transition-colors text-xs font-semibold uppercase tracking-wider"
            aria-label="Search articles"
          >
            <Search className="w-4 h-4 text-slate-500 dark:text-slate-400" />
            <span className="hidden sm:inline">Search</span>
          </Link>

          {isAuthenticated && user ? (
            <Dropdown
              trigger={
                <button
                  type="button"
                  className="flex items-center gap-2 px-2.5 py-1.5 rounded hover:bg-slate-100 dark:hover:bg-navy-850 text-slate-800 dark:text-slate-200 transition-colors text-xs font-semibold"
                >
                  <Avatar name={user.name} size="sm" src={user.avatar} />
                  <span className="hidden sm:inline max-w-[100px] truncate">{user.name}</span>
                </button>
              }
              items={userMenuItems}
            />
          ) : (
            <Link
              to="/login"
              className="flex items-center gap-1.5 px-3.5 py-2 rounded bg-navy-900 hover:bg-navy-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-navy-950 transition-colors text-xs font-bold uppercase tracking-wider"
            >
              <User className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Sign In</span>
            </Link>
          )}
        </div>
      </div>

      {/* Desktop Horizontal Navigation */}
      <div className="hidden md:block border-t border-slate-200 dark:border-navy-700/80 bg-slate-50/50 dark:bg-navy-900/60">
        <Navbar orientation="horizontal" />
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 top-[110px] z-50 bg-white dark:bg-navy-950 p-6 overflow-y-auto border-t border-slate-200 dark:border-navy-800 animate-in slide-in-from-top-2 duration-200">
          <div className="mb-6">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-3">
              Editorial Desks
            </h4>
            <Navbar orientation="vertical" onItemClick={() => setMobileMenuOpen(false)} />
          </div>

          <div className="pt-6 border-t border-slate-200 dark:border-navy-800 space-y-3">
            {isAuthenticated && user ? (
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 rounded bg-slate-50 dark:bg-navy-900 border border-slate-200 dark:border-navy-750">
                  <Avatar name={user.name} size="sm" src={user.avatar} />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{user.name}</p>
                    <p className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider">
                      Role: {user.role}
                    </p>
                  </div>
                </div>

                <Link
                  to="/profile"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block w-full py-2.5 text-center rounded bg-slate-100 dark:bg-navy-850 text-slate-800 dark:text-slate-200 text-xs font-bold uppercase tracking-wider"
                >
                  My Profile Settings
                </Link>

                {isAdmin && (
                  <Link
                    to="/admin"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center justify-between p-3 rounded bg-navy-100 dark:bg-navy-850 text-xs font-semibold uppercase tracking-wider text-slate-900 dark:text-white"
                  >
                    <span>Admin Management Console</span>
                    <ShieldCheck className="w-4 h-4 text-editorial-red" />
                  </Link>
                )}

                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    handleLogout();
                  }}
                  className="block w-full py-2.5 text-center rounded border border-slate-200 dark:border-navy-700 text-slate-700 dark:text-slate-300 text-xs font-bold uppercase tracking-wider hover:bg-slate-50 dark:hover:bg-navy-900"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="block w-full py-2.5 text-center rounded bg-navy-900 text-white text-xs font-bold uppercase tracking-wider"
              >
                Sign In to Your Account
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
