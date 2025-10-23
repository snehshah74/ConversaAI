"use client";

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Bot, ArrowRight, Mail, Lock, User, Building2, Sparkles } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export default function SignUpPage() {
  const router = useRouter();
  const { signup, isLoading } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    try {
      await signup({
        name: formData.name,
        email: formData.email,
        company: formData.company,
        password: formData.password
      });
    } catch (error) {
      setError('Failed to create account. Please try again.');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div className="min-h-screen bg-theme text-theme">
      {/* Main Content */}
      <div className="pt-16 flex min-h-screen">
        {/* Left Side - Form */}
        <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
          <div className="w-full max-w-md">

          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2">Create your account</h1>
            <p className="text-zinc-400">Start building Voice AI agents in minutes</p>
          </div>

          {/* Social Sign Up */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <button className="flex items-center justify-center space-x-2 px-4 py-3 bg-zinc-900 hover:bg-zinc-800 rounded-xl border border-zinc-800 transition-colors">
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              <span className="text-sm font-medium">Google</span>
            </button>
            
            <button className="flex items-center justify-center space-x-2 px-4 py-3 bg-zinc-900 hover:bg-zinc-800 rounded-xl border border-zinc-800 transition-colors">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
              </svg>
              <span className="text-sm font-medium">GitHub</span>
            </button>
          </div>

          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-zinc-800"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-black text-zinc-500">Or continue with email</span>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium mb-2 text-zinc-300">Full Name</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-zinc-500" />
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="w-full pl-10 pr-4 py-3 bg-zinc-900 border border-zinc-800 rounded-xl focus:outline-none focus:border-purple-500 transition-colors"
                  placeholder="John Doe"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-zinc-300">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-zinc-500" />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="w-full pl-10 pr-4 py-3 bg-zinc-900 border border-zinc-800 rounded-xl focus:outline-none focus:border-purple-500 transition-colors"
                  placeholder="you@company.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-zinc-300">Company</label>
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-zinc-500" />
                <input
                  type="text"
                  name="company"
                  value={formData.company}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-3 bg-zinc-900 border border-zinc-800 rounded-xl focus:outline-none focus:border-purple-500 transition-colors"
                  placeholder="Your Company Inc."
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-zinc-300">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-zinc-500" />
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  className="w-full pl-10 pr-4 py-3 bg-zinc-900 border border-zinc-800 rounded-xl focus:outline-none focus:border-purple-500 transition-colors"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-zinc-300">Confirm Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-zinc-500" />
                <input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                  className="w-full pl-10 pr-4 py-3 bg-zinc-900 border border-zinc-800 rounded-xl focus:outline-none focus:border-purple-500 transition-colors"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-white text-black rounded-xl hover:bg-zinc-200 transition-colors font-semibold flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <span>Creating account...</span>
              ) : (
                <>
                  <span>Create Account</span>
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-zinc-500">
            Already have an account?{' '}
            <Link href="/login" className="text-white hover:underline font-medium">
              Sign in
            </Link>
          </p>

          <p className="mt-4 text-center text-xs text-zinc-600">
            By signing up, you agree to our{' '}
            <a href="#" className="hover:text-zinc-400">Terms of Service</a>
            {' '}and{' '}
            <a href="#" className="hover:text-zinc-400">Privacy Policy</a>
          </p>
        </div>
      </div>

      {/* Right Side - Feature Showcase */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-purple-900/20 via-blue-900/20 to-black p-12 items-center justify-center relative overflow-hidden">
        {/* Background Elements */}
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10"></div>
        <div className="absolute top-20 right-20 w-72 h-72 bg-purple-500/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 left-20 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl"></div>

        <div className="relative z-10 max-w-lg">
          <div className="inline-flex items-center space-x-2 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full mb-8 border border-white/10">
            <Sparkles className="w-4 h-4 text-purple-400" />
            <span className="text-sm">Trusted by 500+ companies</span>
          </div>

            <h2 className="text-5xl font-bold mb-6 leading-tight">
              Build Voice AI agents that speak naturally
            </h2>
          
          <div className="space-y-6">
            {[
              {
                title: "Launch in Minutes",
                description: "Create and deploy your first Voice AI agent in under 5 minutes with our intuitive voice builder."
              },
              {
                title: "Scale Effortlessly",
                description: "Handle thousands of voice conversations simultaneously with enterprise-grade voice infrastructure."
              },
              {
                title: "Insights & Analytics",
                description: "Real-time dashboards and analytics to optimize your agent's performance."
              }
            ].map((feature, index) => (
              <div key={index} className="flex items-start space-x-4">
                <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg flex items-center justify-center">
                  <span className="text-sm font-bold">{index + 1}</span>
                </div>
                <div>
                  <h3 className="font-semibold mb-1">{feature.title}</h3>
                  <p className="text-sm text-zinc-400">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-12 p-6 bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10">
            <div className="flex items-center space-x-3 mb-4">
              <div className="flex -space-x-2">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="w-8 h-8 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full border-2 border-black"></div>
                ))}
              </div>
              <div className="text-sm">
                <span className="font-semibold">10,000+</span>
                <span className="text-zinc-400"> Voice AI agents created</span>
              </div>
            </div>
            <p className="text-sm text-zinc-400">
              "Conversa AI's voice agents transformed our customer support. Response time decreased by 80% and customer satisfaction increased dramatically."
            </p>
            <p className="text-sm font-medium mt-2">— Sarah Chen, CTO at TechCorp</p>
          </div>
        </div>
      </div>
      </div>
    </div>
  );
}

