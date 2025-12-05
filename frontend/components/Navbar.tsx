"use client";
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '../utils/api';

export default function Navbar() {
  const [user, setUser] = useState<{ name: string } | null>(null);
  const router = useRouter();

  // Check auth status on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await api.get('/auth/me');
        setUser(res.data);
      } catch (err) {
        setUser(null);
      }
    };
    checkAuth();
  }, []);

  const handleLogout = async () => {
    try {
      await api.post('/auth/logout');
      setUser(null);
      router.push('/login');
    } catch (error) {
      console.error("Logout failed", error);
    }
  };

  return (
    <nav className="bg-slate-900 text-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="font-bold text-xl tracking-wider text-blue-400">
              AI<span className="text-white">STOCK</span>PREDICT
            </Link>
          </div>
          <div className="flex items-center space-x-6">
            {user ? (
              <>
                <Link href="/" className="hover:text-blue-400 transition-colors text-sm font-medium">
                  Home
                </Link>
                <Link href="/statistics" className="hover:text-blue-400 transition-colors text-sm font-medium">
                  Statistics
                </Link>
                <Link href="/chatbot" className="hover:text-blue-400 transition-colors text-sm font-medium">
                  AI Analyst
                </Link>
                <div className="flex items-center border-l border-gray-700 pl-6 space-x-4">
                  <span className="text-gray-300 text-sm">Hi, {user.name}</span>
                  <button 
                    onClick={handleLogout}
                    className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded-md text-sm transition-colors"
                  >
                    Logout
                  </button>
                </div>
              </>
            ) : (
              <div className="space-x-4">
                <Link 
                  href="/login" 
                  className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium"
                >
                  Login
                </Link>
                <Link 
                  href="/signup" 
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}