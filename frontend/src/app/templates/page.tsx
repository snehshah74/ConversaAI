"use client";

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  Search,
  Filter,
  Star,
  Users,
  Play,
  Copy,
  TrendingUp,
  Sparkles,
  ArrowRight,
  CheckCircle2
} from 'lucide-react';
import {
  AGENT_TEMPLATES,
  INDUSTRIES,
  CATEGORIES,
  getPopularTemplates,
  searchTemplates,
  getTemplatesByIndustry,
  getTemplatesByCategory,
  type AgentTemplate
} from '@/lib/templates';

export default function TemplatesPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIndustry, setSelectedIndustry] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [previewTemplate, setPreviewTemplate] = useState<AgentTemplate | null>(null);

  // Filter templates
  const filteredTemplates = useMemo(() => {
    let templates = AGENT_TEMPLATES;

    // Search filter
    if (searchQuery) {
      templates = searchTemplates(searchQuery);
    }

    // Industry filter
    if (selectedIndustry !== 'all') {
      templates = templates.filter(t => t.industry === selectedIndustry);
    }

    // Category filter
    if (selectedCategory !== 'all') {
      templates = templates.filter(t => t.category === selectedCategory);
    }

    return templates;
  }, [searchQuery, selectedIndustry, selectedCategory]);

  const popularTemplates = getPopularTemplates(6);

  const handleCloneTemplate = (template: AgentTemplate) => {
    // Navigate to agent creation with template pre-filled
    router.push(`/agents/create?template=${template.id}`);
  };

  const handlePreviewTemplate = (template: AgentTemplate) => {
    setPreviewTemplate(template);
  };

  return (
    <div className="min-h-screen bg-theme text-theme">
      <div className="max-w-7xl mx-auto px-4 py-12">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-4">
            <Sparkles className="w-12 h-12 text-yellow-400 mr-3" />
            <h1 className="text-5xl font-bold text-white">Agent Templates</h1>
          </div>
          <p className="text-xl text-zinc-400 max-w-2xl mx-auto">
            Choose from pre-built templates for your industry. Customize and deploy in minutes.
          </p>
        </div>

        {/* Search & Filters */}
        <div className="bg-zinc-900/50 backdrop-blur-sm rounded-2xl border border-zinc-800 p-6 mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-zinc-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search templates..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-zinc-800/50 border border-zinc-700 rounded-xl text-white placeholder-zinc-500 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>

            {/* Industry Filter */}
            <div className="relative">
              <Filter className="absolute left-4 top-1/2 transform -translate-y-1/2 text-zinc-400 w-5 h-5" />
              <select
                value={selectedIndustry}
                onChange={(e) => setSelectedIndustry(e.target.value)}
                className="pl-12 pr-10 py-3 bg-zinc-800/50 border border-zinc-700 rounded-xl text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent appearance-none cursor-pointer"
              >
                <option value="all">All Industries</option>
                {INDUSTRIES.map(industry => (
                  <option key={industry} value={industry}>{industry}</option>
                ))}
              </select>
            </div>

            {/* Category Filter */}
            <div className="relative">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="pl-4 pr-10 py-3 bg-zinc-800/50 border border-zinc-700 rounded-xl text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent appearance-none cursor-pointer"
              >
                <option value="all">All Categories</option>
                {CATEGORIES.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Most Popular Section */}
        {selectedIndustry === 'all' && selectedCategory === 'all' && !searchQuery && (
          <div className="mb-12">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center">
                <TrendingUp className="w-6 h-6 text-purple-400 mr-2" />
                <h2 className="text-3xl font-bold text-white">Most Popular Templates</h2>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {popularTemplates.map(template => (
                <TemplateCard
                  key={template.id}
                  template={template}
                  onClone={() => handleCloneTemplate(template)}
                  onPreview={() => handlePreviewTemplate(template)}
                />
              ))}
            </div>
          </div>
        )}

        {/* All Templates */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-3xl font-bold text-white">
              {filteredTemplates.length} Template{filteredTemplates.length !== 1 ? 's' : ''} Found
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTemplates.map(template => (
              <TemplateCard
                key={template.id}
                template={template}
                onClone={() => handleCloneTemplate(template)}
                onPreview={() => handlePreviewTemplate(template)}
              />
            ))}
          </div>
          {filteredTemplates.length === 0 && (
            <div className="text-center py-12">
              <p className="text-zinc-400 text-lg">No templates found. Try adjusting your filters.</p>
            </div>
          )}
        </div>
      </div>

      {/* Preview Modal */}
      {previewTemplate && (
        <PreviewModal
          template={previewTemplate}
          onClose={() => setPreviewTemplate(null)}
          onClone={() => {
            handleCloneTemplate(previewTemplate);
            setPreviewTemplate(null);
          }}
        />
      )}
    </div>
  );
}

interface TemplateCardProps {
  template: AgentTemplate;
  onClone: () => void;
  onPreview: () => void;
}

function TemplateCard({ template, onClone, onPreview }: TemplateCardProps) {
  return (
    <div className="bg-zinc-900/50 backdrop-blur-sm rounded-2xl p-6 border border-zinc-800 hover:border-purple-500/50 transition-all duration-300 hover:shadow-xl hover:shadow-purple-500/10 group">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center">
          <span className="text-4xl mr-3">{template.icon}</span>
          <div>
            <h3 className="text-xl font-bold text-white group-hover:text-purple-400 transition-colors">
              {template.name}
            </h3>
            <p className="text-sm text-zinc-400">{template.industry}</p>
          </div>
        </div>
      </div>

      {/* Description */}
      <p className="text-zinc-300 mb-4 line-clamp-2">{template.description}</p>

      {/* Badges */}
      {template.badges && template.badges.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {template.badges.map(badge => (
            <span
              key={badge}
              className="px-2 py-1 bg-purple-500/20 text-purple-300 text-xs rounded-full border border-purple-500/30"
            >
              {badge}
            </span>
          ))}
        </div>
      )}

      {/* Stats */}
      <div className="flex items-center justify-between mb-4 text-sm text-zinc-400">
        <div className="flex items-center">
          <Star className="w-4 h-4 text-yellow-400 mr-1 fill-yellow-400" />
          <span>{template.rating?.toFixed(1)}</span>
        </div>
        {template.usedBy && (
          <div className="flex items-center">
            <Users className="w-4 h-4 mr-1" />
            <span>{template.usedBy.toLocaleString()}</span>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <button
          onClick={onPreview}
          className="flex-1 flex items-center justify-center px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl transition-colors text-sm"
        >
          <Play className="w-4 h-4 mr-2" />
          Preview
        </button>
        <button
          onClick={onClone}
          className="flex-1 flex items-center justify-center px-4 py-2 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white rounded-xl transition-colors text-sm"
        >
          <Copy className="w-4 h-4 mr-2" />
          Use Template
        </button>
      </div>
    </div>
  );
}

interface PreviewModalProps {
  template: AgentTemplate;
  onClose: () => void;
  onClone: () => void;
}

function PreviewModal({ template, onClose, onClone }: PreviewModalProps) {
  return (
    <div className="fixed inset-0 bg-black/75 flex items-center justify-center z-50 p-4">
      <div className="bg-zinc-900 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto border border-zinc-800">
        {/* Header */}
        <div className="sticky top-0 bg-zinc-900 border-b border-zinc-800 p-6 flex items-center justify-between">
          <div className="flex items-center">
            <span className="text-4xl mr-4">{template.icon}</span>
            <div>
              <h2 className="text-2xl font-bold text-white">{template.name}</h2>
              <p className="text-zinc-400">{template.industry} • {template.category}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-white transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Description */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-2">Description</h3>
            <p className="text-zinc-300">{template.description}</p>
          </div>

          {/* Sample Conversation */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-2">Sample Conversation</h3>
            <div className="bg-zinc-800/50 rounded-xl p-4 space-y-3">
              <div>
                <p className="text-sm text-zinc-400 mb-1">Agent:</p>
                <p className="text-zinc-200 bg-zinc-800 rounded-xl p-2">{template.greetingMessage}</p>
              </div>
              {template.sampleConversationFlow.map((node, idx) => (
                <div key={idx} className="space-y-2">
                  <div>
                    <p className="text-sm text-zinc-400 mb-1">User:</p>
                    <p className="text-blue-300 bg-blue-900/30 rounded-xl p-2">{node.userMessage}</p>
                  </div>
                  <div>
                    <p className="text-sm text-zinc-400 mb-1">Agent:</p>
                    <p className="text-zinc-200 bg-zinc-800 rounded-xl p-2">{node.agentResponse}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Features */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h3 className="text-lg font-semibold text-white mb-2">Personality</h3>
              <div className="flex flex-wrap gap-2">
                {template.personality.map(trait => (
                  <span key={trait} className="px-3 py-1 bg-purple-500/20 text-purple-300 rounded-full text-sm border border-purple-500/30">
                    {trait}
                  </span>
                ))}
              </div>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white mb-2">Suggested Tools</h3>
              <div className="flex flex-wrap gap-2">
                {template.suggestedTools.map(tool => (
                  <span key={tool} className="px-3 py-1 bg-blue-500/20 text-blue-300 rounded-full text-sm border border-blue-500/30">
                    {tool}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Required Fields */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-2">Required Information</h3>
            <ul className="list-disc list-inside text-zinc-300 space-y-1">
              {template.requiredFields.map(field => (
                <li key={field}>{field}</li>
              ))}
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-zinc-900 border-t border-zinc-800 p-6 flex justify-end gap-4">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onClone}
            className="px-6 py-2 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white rounded-xl transition-colors flex items-center"
          >
            <Copy className="w-4 h-4 mr-2" />
            Use This Template
            <ArrowRight className="w-4 h-4 ml-2" />
          </button>
        </div>
      </div>
    </div>
  );
}
