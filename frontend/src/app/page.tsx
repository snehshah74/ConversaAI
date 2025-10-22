"use client";

import Link from 'next/link';
import { 
  Bot, 
  MessageCircle, 
  Zap, 
  Shield, 
  BarChart3, 
  ArrowRight,
  Check,
  Sparkles,
  Globe,
  Users, 
  Clock, 
  TrendingUp
} from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-theme text-theme">

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center space-x-2 px-4 py-2 bg-zinc-900 rounded-full mb-6 border border-zinc-800">
              <Sparkles className="w-4 h-4 text-purple-400" />
              <span className="text-sm text-zinc-300">Advanced AI Technology</span>
            </div>
            
            <h1 className="text-6xl md:text-7xl font-bold mb-6 leading-tight">
              Conversa AI
              <br />
              <span className="bg-gradient-to-r from-purple-400 via-blue-400 to-cyan-400 bg-clip-text text-transparent">
                Voice AI Agents
              </span>
            </h1>
            
            <p className="text-xl text-zinc-400 mb-10 max-w-2xl mx-auto">
              Create, deploy, and manage AI-powered voice agents that speak naturally and understand your customers. 
              Built for enterprise scale, designed for simplicity.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link 
                href="/signup" 
                className="group px-8 py-4 bg-white text-black rounded-xl hover:bg-zinc-200 transition-all font-semibold text-lg flex items-center justify-center"
              >
                Get Started Free
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link 
                href="/login" 
                className="px-8 py-4 bg-zinc-900 text-white rounded-xl hover:bg-zinc-800 transition-colors font-semibold text-lg border border-zinc-800"
              >
                Sign In
              </Link>
          </div>

            <div className="mt-12 flex items-center justify-center space-x-8 text-sm text-zinc-500">
              <div className="flex items-center space-x-2">
                <Check className="w-4 h-4 text-green-400" />
                <span>Enterprise-grade security</span>
              </div>
              <div className="flex items-center space-x-2">
                <Check className="w-4 h-4 text-green-400" />
                <span>99.9% uptime SLA</span>
              </div>
            </div>
          </div>
              </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 border-y border-zinc-900">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-4xl font-bold mb-2">99.9%</div>
              <div className="text-zinc-500">Uptime</div>
              </div>
            <div className="text-center">
              <div className="text-4xl font-bold mb-2">50ms</div>
              <div className="text-zinc-500">Response Time</div>
              </div>
            <div className="text-center">
              <div className="text-4xl font-bold mb-2">10M+</div>
              <div className="text-zinc-500">Messages Processed</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold mb-2">500+</div>
              <div className="text-zinc-500">Active Agents</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-5xl font-bold mb-4">Powerful Features</h2>
            <p className="text-xl text-zinc-400">Everything you need to build intelligent voice AI agents</p>
              </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: <MessageCircle className="w-6 h-6" />,
                title: "Natural Voice Conversations",
                description: "Advanced speech recognition and synthesis for human-like voice interactions with emotion and tone."
              },
              {
                icon: <Zap className="w-6 h-6" />,
                title: "Real-time Voice Processing",
                description: "Sub-100ms voice response times with advanced audio processing and noise cancellation."
              },
              {
                icon: <Shield className="w-6 h-6" />,
                title: "Enterprise Voice Security",
                description: "Bank-grade encryption for voice data, SOC 2 compliance, and secure voice transmission."
              },
              {
                icon: <BarChart3 className="w-6 h-6" />,
                title: "Voice Analytics",
                description: "Real-time voice insights, conversation analytics, and performance optimization tools."
              },
              {
                icon: <Globe className="w-6 h-6" />,
                title: "Multi-language Voice",
                description: "50+ languages with native voice synthesis and regional accent customization."
              },
              {
                icon: <Users className="w-6 h-6" />,
                title: "Voice Agent Collaboration",
                description: "Advanced tools for building, testing, and deploying voice AI agents at scale."
              }
            ].map((feature, index) => (
              <div 
                key={index} 
                className="p-8 bg-zinc-900/50 rounded-2xl border border-zinc-800 hover:border-zinc-700 transition-colors group"
              >
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-500 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-zinc-400">{feature.description}</p>
                </div>
            ))}
                        </div>
                      </div>
      </section>

      {/* How It Works */}
      <section className="py-24 px-4 bg-zinc-900/30">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-5xl font-bold mb-4">How It Works</h2>
            <p className="text-xl text-zinc-400">Get started in three simple steps</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: "01",
                title: "Design Your Voice Agent",
                description: "Define personality, voice characteristics, and capabilities using our intuitive voice AI builder."
              },
              {
                step: "02",
                title: "Train & Optimize Voice",
                description: "Fine-tune voice responses, optimize speech patterns, and train on your specific voice data."
              },
              {
                step: "03",
                title: "Deploy & Scale Voice",
                description: "Launch your voice AI agent and watch it handle thousands of voice conversations with enterprise reliability."
              }
            ].map((item, index) => (
              <div key={index} className="relative">
                <div className="text-7xl font-bold text-zinc-800 mb-4">{item.step}</div>
                <h3 className="text-2xl font-semibold mb-3">{item.title}</h3>
                <p className="text-zinc-400">{item.description}</p>
                {index < 2 && (
                  <div className="hidden md:block absolute top-12 right-0 transform translate-x-1/2">
                    <ArrowRight className="w-6 h-6 text-zinc-700" />
                      </div>
                )}
                    </div>
                  ))}
                </div>
            </div>
      </section>

      {/* Technology Showcase */}
      <section id="technology" className="py-24 px-4 bg-zinc-900/30">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-5xl font-bold mb-4">Voice AI Technology</h2>
            <p className="text-xl text-zinc-400">Built with cutting-edge voice AI innovations for superior audio performance</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                icon: <Bot className="w-8 h-8" />,
                title: "Neural Voice Synthesis",
                description: "Advanced deep learning models trained on millions of voice samples for natural speech"
              },
              {
                icon: <Zap className="w-8 h-8" />,
                title: "Real-time Audio Processing",
                description: "Sub-second voice response times with intelligent audio streaming"
              },
              {
                icon: <Shield className="w-8 h-8" />,
                title: "Voice Privacy First",
                description: "End-to-end voice encryption with zero-knowledge voice data architecture"
              },
              {
                icon: <TrendingUp className="w-8 h-8" />,
                title: "Adaptive Voice Learning",
                description: "Self-improving voice AI that gets more natural with every conversation"
              }
            ].map((tech, index) => (
              <div 
                key={index} 
                className="group p-8 bg-zinc-900/50 rounded-2xl border border-zinc-800 hover:border-purple-500/50 transition-all duration-300"
              >
                <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-blue-500 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                  {tech.icon}
                </div>
                <h3 className="text-xl font-semibold mb-3 text-white">{tech.title}</h3>
                <p className="text-zinc-400 leading-relaxed">{tech.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-5xl font-bold mb-6">
            Ready to Build the Future of
            <br />
            Voice AI?
          </h2>
          <p className="text-xl text-zinc-400 mb-10">
            Join the next generation of AI-powered voice interactions. 
            Start building intelligent voice AI agents today.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              href="/signup" 
              className="inline-flex items-center px-8 py-4 bg-white text-black rounded-xl hover:bg-zinc-200 transition-colors font-semibold text-lg"
            >
              Get Started Free
              <ArrowRight className="ml-2 w-5 h-5" />
            </Link>
            <Link 
              href="/login" 
              className="inline-flex items-center px-8 py-4 bg-zinc-900 text-white rounded-xl hover:bg-zinc-800 transition-colors font-semibold text-lg border border-zinc-800"
            >
              Sign In
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-zinc-900 py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg flex items-center justify-center">
                  <Bot className="w-5 h-5 text-white" />
                    </div>
                <span className="text-xl font-bold">Conversa AI</span>
                      </div>
              <p className="text-zinc-500 text-sm">
                Building the future of AI-powered voice interactions.
              </p>
                    </div>
            
            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-sm text-zinc-500">
                <li><a href="#features" className="hover:text-white transition-colors">Features</a></li>
                <li><a href="#technology" className="hover:text-white transition-colors">Technology</a></li>
                <li><Link href="/dashboard" className="hover:text-white transition-colors">Dashboard</Link></li>
                <li><a href="/docs" className="hover:text-white transition-colors">API Docs</a></li>
              </ul>
                  </div>
            
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-sm text-zinc-500">
                <li><a href="#about" className="hover:text-white transition-colors">About</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Careers</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
              </ul>
              </div>

            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-zinc-500">
                <li><a href="#" className="hover:text-white transition-colors">Privacy</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Terms</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Security</a></li>
              </ul>
            </div>
          </div>
          
          <div className="pt-8 border-t border-zinc-900 text-center text-sm text-zinc-500">
            © 2025 Conversa AI. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
