import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import logoImg from '../assets/images/logo.svg';

export const Navbar: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);
  const location = useLocation();
  const navigate = useNavigate();

  const navLinks = [
    { label: 'Programs', hash: '#programs' },
    { label: 'Facilities', hash: '#facilities' },
    { label: 'Pricing', hash: '#pricing' },
  ];

  const handleSectionClick = (
    e: React.MouseEvent<HTMLAnchorElement>,
    hash: string
  ): void => {
    setMobileMenuOpen(false);
    if (location.pathname !== '/') {
      e.preventDefault();
      navigate('/' + hash);
    }
  };

  return (
    <header className="sticky top-0 z-50 border-b border-slate-800/80 bg-slate-950/90 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3.5 sm:px-6 lg:px-8">
        {/* Brand Logo Image */}
        <Link
          to="/"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="group flex items-center"
        >
          <img
            src={logoImg}
            alt="PulseFit Performance Studio Logo"
            className="h-11 w-auto object-contain transition-transform duration-300 group-hover:scale-105 sm:h-12"
          />
        </Link>

        {/* Standard Navigation Links */}
        <nav className="hidden items-center gap-8 md:flex">
          {navLinks.map((link) => (
            <a
              key={link.label}
              href={`/${link.hash}`}
              onClick={(e) => handleSectionClick(e, link.hash)}
              className="text-sm font-bold uppercase tracking-wider text-slate-300 transition-colors hover:text-rose-400"
            >
              {link.label}
            </a>
          ))}
        </nav>

        {/* Prominent Member Portal Button (Top Right) */}
        <div className="hidden items-center md:flex">
          <Link
            to="/member-login"
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-rose-600 to-orange-600 px-5 py-2.5 text-xs font-extrabold uppercase tracking-wider text-white shadow-lg shadow-rose-600/25 transition-all duration-300 hover:scale-[1.02] hover:from-rose-500 hover:to-orange-500"
          >
            <span>Member Portal</span>
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M17 8l4 4m0 0l-4 4m4-4H3"
              />
            </svg>
          </Link>
        </div>

        {/* Mobile Menu Button */}
        <button
          type="button"
          onClick={() => setMobileMenuOpen((prev) => !prev)}
          aria-label="Toggle navigation menu"
          className="inline-flex items-center justify-center rounded-xl border border-slate-800 bg-slate-900 p-2.5 text-slate-200 hover:border-rose-500/50 hover:text-white md:hidden"
        >
          <svg
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            {mobileMenuOpen ? (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18L18 6M6 6l12 12"
              />
            ) : (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4 6h16M4 12h16M4 18h16"
              />
            )}
          </svg>
        </button>
      </div>

      {/* Mobile Dropdown */}
      {mobileMenuOpen && (
        <div className="border-t border-slate-800 bg-slate-950 px-4 pb-5 pt-3 md:hidden">
          <div className="flex flex-col space-y-2">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={`/${link.hash}`}
                onClick={(e) => handleSectionClick(e, link.hash)}
                className="rounded-lg px-3 py-2 text-sm font-bold uppercase tracking-wider text-slate-200 hover:bg-slate-900 hover:text-rose-400"
              >
                {link.label}
              </a>
            ))}
            <Link
              to="/member-login"
              onClick={() => setMobileMenuOpen(false)}
              className="mt-2 flex items-center justify-center rounded-xl bg-gradient-to-r from-rose-600 to-orange-600 px-4 py-3 text-xs font-extrabold uppercase tracking-wider text-white shadow-lg"
            >
              Member Portal
            </Link>
          </div>
        </div>
      )}
    </header>
  );
};

export default Navbar;
