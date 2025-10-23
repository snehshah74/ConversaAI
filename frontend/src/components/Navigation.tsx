"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";

const Navigation = () => {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { isAuthenticated, user, logout } = useAuth();

  const navigationItems = [
    { name: "Features", href: "/#features" },
    { name: "Technology", href: "/#technology" },
    { name: "About", href: "/#about" },
  ];

  const authenticatedNavItems = [
    { name: "Dashboard", href: "/dashboard" },
    { name: "Agents", href: "/agents" },
    { name: "Analytics", href: "/analytics" },
  ];

  const isActive = (href: string) => {
    return pathname === href;
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-xl border-b border-zinc-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex-shrink-0">
            <Link href="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg flex items-center justify-center">
                <svg
                  className="w-5 h-5 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
                  />
                </svg>
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                Conversa AI
              </span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <div className="flex items-baseline space-x-8">
              {(isAuthenticated ? authenticatedNavItems : navigationItems).map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                          className={`px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                            isActive(item.href)
                              ? "bg-zinc-800/50 text-purple-400 border border-zinc-700/50"
                              : "text-zinc-400 hover:text-white hover:bg-zinc-800/30"
                          }`}
                >
                  {item.name}
                </Link>
              ))}
            </div>
            
            {/* Auth Buttons */}
            <div className="flex items-center space-x-4">
              {isAuthenticated ? (
                <>
                  <span className="text-sm text-zinc-400">Welcome, {user?.name}</span>
                  <button
                    onClick={logout}
                    className="px-4 py-2 text-sm font-medium text-zinc-400 hover:text-white transition-colors"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <>
                          <Link
                            href="/login"
                            className="px-4 py-2 text-sm font-medium text-zinc-400 hover:text-white transition-colors"
                          >
                            Sign In
                          </Link>
                          <Link
                            href="/signup"
                            className="px-4 py-2 bg-white text-black rounded-lg hover:bg-zinc-200 transition-colors font-medium text-sm"
                          >
                            Sign Up
                          </Link>
                </>
              )}
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center space-x-2">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-zinc-400 hover:text-white hover:bg-zinc-800/50 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-purple-500 transition-colors duration-200"
              aria-expanded="false"
            >
              <span className="sr-only">Open main menu</span>
              {!isMobileMenuOpen ? (
                <svg
                  className="block h-6 w-6"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
              ) : (
                <svg
                  className="block h-6 w-6"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-zinc-900/95 backdrop-blur-md border-t border-zinc-800/50">
            {(isAuthenticated ? authenticatedNavItems : navigationItems).map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={`block px-3 py-2 rounded-md text-base font-medium transition-all duration-200 ${
                  isActive(item.href)
                    ? "bg-zinc-800/50 text-purple-400 border border-zinc-700/50"
                    : "text-zinc-400 hover:text-white hover:bg-zinc-800/30"
                }`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {item.name}
              </Link>
            ))}
            
            {/* Mobile Auth Buttons */}
            <div className="pt-4 border-t border-zinc-800/50 mt-4">
              {isAuthenticated ? (
                <>
                  <div className="px-3 py-2 text-sm text-zinc-400">
                    Welcome, {user?.name}
                  </div>
                  <button
                    onClick={() => {
                      logout();
                      setIsMobileMenuOpen(false);
                    }}
                    className="block w-full px-3 py-2 rounded-md text-base font-medium text-zinc-400 hover:text-white hover:bg-zinc-800/30 transition-all duration-200"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/login"
                    className="block px-3 py-2 rounded-md text-base font-medium text-zinc-400 hover:text-white hover:bg-zinc-800/30 transition-all duration-200"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Sign In
                  </Link>
                  <Link
                    href="/signup"
                    className="block px-3 py-2 rounded-md text-base font-medium bg-white text-black hover:bg-zinc-200 transition-colors mt-2"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Sign Up
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navigation;
