import Link from 'next/link';
import { Bot, Home } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-purple-600 to-slate-950 flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="mb-8">
          <Bot className="w-24 h-24 text-slate-400 mx-auto mb-4" />
          <h1 className="text-6xl font-bold text-white mb-4">404</h1>
          <h2 className="text-2xl font-semibold text-slate-300 mb-4">Page Not Found</h2>
          <p className="text-slate-400 mb-8">
            The page you're looking for doesn't exist or has been moved.
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/"
            className="inline-flex items-center justify-center px-6 py-3 bg-white text-black rounded-xl hover:bg-zinc-200 transition-colors font-semibold"
          >
            <Home className="w-5 h-5 mr-2" />
            Go Home
          </Link>
          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center px-6 py-3 bg-zinc-900 text-white rounded-xl hover:bg-zinc-800 transition-colors font-semibold border border-zinc-800"
          >
            <Bot className="w-5 h-5 mr-2" />
            Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}

