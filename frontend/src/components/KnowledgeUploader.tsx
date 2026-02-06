"use client";

import { useState, useCallback, useRef, useEffect } from 'react';
import { getApiUrl } from '@/lib/api';
import {
  Upload,
  FileText,
  Link as LinkIcon,
  HelpCircle,
  X,
  Trash2,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Globe,
  File
} from 'lucide-react';

interface KnowledgeSource {
  id: string;
  source: string;
  content_type: 'document' | 'url' | 'faq';
  metadata: any;
  created_at: string;
  chunk_count?: number;
  preview?: string;
}

interface KnowledgeUploaderProps {
  agentId: string;
  onUploadComplete?: () => void;
  className?: string;
}

export default function KnowledgeUploader({
  agentId,
  onUploadComplete,
  className = ''
}: KnowledgeUploaderProps) {
  const [knowledgeSources, setKnowledgeSources] = useState<KnowledgeSource[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{ [key: string]: number }>({});
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'document' | 'url' | 'faq'>('document');
  
  // Debug: Log agentId
  useEffect(() => {
    console.log('KnowledgeUploader mounted with agentId:', agentId);
    if (!agentId) {
      setError('Agent ID is missing. Please create the agent first.');
      return;
    }
    
    // Test backend connection
    const testConnection = async () => {
      try {
        const apiUrl = getApiUrl();
        const healthUrl = `${apiUrl}/api/health`;
        const response = await fetch(healthUrl);
        if (!response.ok) {
          setError(`Backend not accessible. Please ensure the backend server is running at ${apiUrl}`);
        }
      } catch (error) {
        console.error('Backend connection test failed:', error);
        setError(`Cannot connect to backend. Please ensure the backend server is running.`);
      }
    };
    
    testConnection();
  }, [agentId]);
  
  // FAQ form state
  const [faqQuestion, setFaqQuestion] = useState('');
  const [faqAnswer, setFaqAnswer] = useState('');
  
  // URL form state
  const [urlInput, setUrlInput] = useState('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragCounter = useRef(0);
  const [isDragging, setIsDragging] = useState(false);

  // Load existing knowledge sources
  const loadKnowledgeSources = useCallback(async () => {
    if (!agentId) {
      console.warn('No agentId provided to KnowledgeUploader');
      return;
    }
    
    try {
      setIsLoading(true);
      setError(null);
      const apiUrl = getApiUrl();
      const url = `${apiUrl}/api/agents/${agentId}/knowledge`;
      console.log('🔄 Loading knowledge sources from:', url);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      console.log('📡 Response status:', response.status, response.statusText);
      
      if (!response.ok) {
        const errorText = await response.text().catch(() => '');
        console.error('❌ Failed to load knowledge sources:', response.status, errorText);
        let errorData: any = {};
        try {
          errorData = JSON.parse(errorText);
        } catch (e) {
          // If parsing fails, use empty object
        }
        throw new Error(errorData.detail || `Failed to load: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('📦 Full API response:', JSON.stringify(data, null, 2));
      
      // Handle both possible response formats
      const sources = data.knowledge_sources || data.items || data || [];
      console.log(`✅ Parsed ${sources.length} knowledge sources:`, sources);
      
      // Ensure all sources have required fields
      const normalizedSources = sources.map((source: any) => ({
        id: source.id || source.source || `source-${Date.now()}`,
        source: source.source || source.title || source.filename || 'Unknown',
        content_type: source.content_type || 'document',
        metadata: source.metadata || {},
        created_at: source.created_at || new Date().toISOString(),
        chunk_count: source.chunk_count || 0,
        preview: source.preview || source.content?.substring(0, 200) || '',
      }));
      
      setKnowledgeSources(normalizedSources);
      console.log(`✅ Set ${normalizedSources.length} knowledge sources in state`);
      
    } catch (error: any) {
      console.error('❌ Error loading knowledge sources:', error);
      setError(`Failed to load knowledge sources: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  }, [agentId]);

  // Load on mount
  useEffect(() => {
    loadKnowledgeSources();
  }, [loadKnowledgeSources]);

  // Handle file upload
  const handleFileUpload = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0) {
      console.warn('⚠️ No files selected');
      return;
    }

    const file = files[0];
    console.log('📤 Starting upload for file:', file.name, 'Size:', file.size, 'Type:', file.type);
    
    // Validate file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      const errorMsg = 'File size exceeds 10MB limit';
      console.error('❌', errorMsg);
      setError(errorMsg);
      return;
    }

    // Validate file type
    const allowedTypes = ['.pdf', '.docx', '.doc', '.txt', '.csv'];
    const fileExt = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!allowedTypes.includes(fileExt)) {
      const errorMsg = `Unsupported file type. Allowed: ${allowedTypes.join(', ')}`;
      console.error('❌', errorMsg);
      setError(errorMsg);
      return;
    }

    if (!agentId) {
      const errorMsg = 'Agent ID is missing. Cannot upload file.';
      console.error('❌', errorMsg);
      setError(errorMsg);
      return;
    }

    try {
      setIsUploading(true);
      setIsLoading(true);
      setError(null);
      setSuccessMessage(null);
      setUploadProgress({ [file.name]: 0 });

      const apiUrl = getApiUrl();
      const url = `${apiUrl}/api/agents/${agentId}/knowledge/upload`;
      console.log('📡 Upload URL:', url);
      console.log('📋 Agent ID:', agentId);
      console.log('📄 File details:', {
        name: file.name,
        size: file.size,
        type: file.type,
        extension: fileExt
      });
      
      const formData = new FormData();
      formData.append('file', file);
      
      console.log('🚀 Sending upload request...');
      const response = await fetch(url, {
        method: 'POST',
        body: formData
        // Don't set Content-Type header - browser will set it with boundary
      });
      
      console.log('📥 Upload response received:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
        headers: Object.fromEntries(response.headers.entries())
      });

      if (!response.ok) {
        let errorMessage = 'Upload failed';
        try {
          const errorData = await response.json();
          console.error('❌ Upload error response:', errorData);
          errorMessage = errorData.detail || errorData.message || `Upload failed: ${response.status} ${response.statusText}`;
        } catch (e) {
          const text = await response.text().catch(() => '');
          console.error('❌ Upload error text:', text);
          errorMessage = `Upload failed: ${response.status} ${response.statusText}${text ? '. ' + text.substring(0, 200) : ''}`;
        }
        throw new Error(errorMessage);
      }

      const result = await response.json();
      console.log('✅ Upload result:', result);
      setUploadProgress({ [file.name]: 100 });
      
      // Check if upload actually succeeded
      if (!result.success) {
        const errorMsg = result.error || 'Upload failed - no chunks were stored. Check backend logs and Supabase connection.';
        console.error('❌ Upload failed:', errorMsg);
        throw new Error(errorMsg);
      }
      
      // Show success message
      const successMsg = `${file.name} uploaded successfully! ${result.chunks_created || 0} chunks created.`;
      console.log('✅', successMsg);
      setSuccessMessage(successMsg);
      
      // Clear success message after 5 seconds
      setTimeout(() => setSuccessMessage(null), 5000);
      
      // CRITICAL: Wait a moment for backend to finish processing, then reload
      console.log('⏳ Waiting 2 seconds before reloading knowledge sources...');
      setTimeout(async () => {
        console.log('🔄 Reloading knowledge sources after upload...');
        try {
          await loadKnowledgeSources();
          console.log('✅ Knowledge sources reloaded');
        } catch (reloadError) {
          console.error('❌ Failed to reload knowledge sources:', reloadError);
        }
      }, 2000);
      
      // Also try immediate reload if backend returned stored_sources
      if (result.stored_sources && result.stored_sources.length > 0) {
        console.log('✅ Backend returned stored sources immediately, updating UI...');
        setKnowledgeSources(prev => {
          const existing = prev.map(s => s.source);
          const newSources = result.stored_sources.filter((s: any) => !existing.includes(s.source));
          return [...prev, ...newSources];
        });
      }
      
      onUploadComplete?.();

      // Clear progress after a delay
      setTimeout(() => {
        setUploadProgress(prev => {
          const newProgress = { ...prev };
          delete newProgress[file.name];
          return newProgress;
        });
      }, 3000);

    } catch (error: any) {
      console.error('❌ Upload error:', error);
      const errorMessage = error.message || 'Failed to upload file';
      setError(errorMessage);
      setUploadProgress(prev => {
        const newProgress = { ...prev };
        delete newProgress[file.name];
        return newProgress;
      });
    } finally {
      setIsUploading(false);
      setIsLoading(false);
      console.log('🏁 Upload process completed');
    }
  }, [agentId, loadKnowledgeSources, onUploadComplete]);

  // Handle URL scraping
  const handleUrlScrape = useCallback(async () => {
    if (!urlInput.trim()) {
      setError('Please enter a valid URL');
      return;
    }

    try {
      setIsUploading(true);
      setIsLoading(true);
      setError(null);
      setSuccessMessage(null);

      const formData = new FormData();
      formData.append('url', urlInput.trim());

      const response = await fetch(
        `${getApiUrl()}/api/agents/${agentId}/knowledge/url`,
        {
          method: 'POST',
          body: formData
        }
      );

      if (!response.ok) {
        let errorMessage = 'Failed to scrape URL';
        try {
          const errorData = await response.json();
          errorMessage = errorData.detail || errorData.message || `Failed to scrape URL: ${response.status} ${response.statusText}`;
        } catch (e) {
          errorMessage = `Failed to scrape URL: ${response.status} ${response.statusText}`;
        }
        throw new Error(errorMessage);
      }

      const result = await response.json();
      
      // Check if scrape actually succeeded
      if (!result.success) {
        throw new Error(result.error || 'URL scrape failed - no chunks were stored. Check backend logs and Supabase connection.');
      }
      
      // Show success message
      const successMsg = `URL scraped successfully! ${result.chunks_created || 0} chunks created.`;
      setSuccessMessage(successMsg);
      setTimeout(() => setSuccessMessage(null), 5000);
      
      setUrlInput('');
      
      // CRITICAL: Wait a moment for backend to finish processing, then reload
      setTimeout(async () => {
        console.log('🔄 Reloading knowledge sources after URL scrape...');
        await loadKnowledgeSources();
      }, 1000);
      
      onUploadComplete?.();

    } catch (error: any) {
      console.error('URL scrape error:', error);
      const errorMessage = error.message || 'Failed to scrape URL';
      setError(errorMessage);
    } finally {
      setIsUploading(false);
      setIsLoading(false);
    }
  }, [agentId, urlInput, loadKnowledgeSources, onUploadComplete]);

  // Handle FAQ addition
  const handleFaqAdd = useCallback(async () => {
    if (!agentId) {
      setError('Agent ID is missing. Please create the agent first.');
      return;
    }
    
    if (!faqQuestion.trim() || !faqAnswer.trim()) {
      setError('Please fill in both question and answer');
      return;
    }

    try {
      setIsUploading(true);
      setIsLoading(true);
      setError(null);
      setSuccessMessage(null);

      const formData = new FormData();
      formData.append('question', faqQuestion.trim());
      formData.append('answer', faqAnswer.trim());

      const apiUrl = getApiUrl();
      const url = `${apiUrl}/api/agents/${agentId}/knowledge/faq`;
      console.log('Adding FAQ:', url);
      
      const response = await fetch(url, {
        method: 'POST',
        body: formData
      });
      
      console.log('FAQ response:', response.status, response.statusText);
      
      if (!response.ok) {
        let errorMessage = 'Failed to add FAQ';
        try {
          const errorData = await response.json();
          console.error('FAQ error data:', errorData);
          errorMessage = errorData.detail || errorData.message || `Failed to add FAQ: ${response.status} ${response.statusText}`;
        } catch (e) {
          const text = await response.text();
          console.error('FAQ error text:', text);
          errorMessage = `Failed to add FAQ: ${response.status} ${response.statusText}. ${text.substring(0, 100)}`;
        }
        throw new Error(errorMessage);
      }

      const result = await response.json();
      
      // Check if FAQ was actually added
      if (!result.success) {
        throw new Error(result.error || 'FAQ addition failed - not stored. Check backend logs and Supabase connection.');
      }
      
      // Show success message
      setSuccessMessage('FAQ added successfully!');
      setTimeout(() => setSuccessMessage(null), 5000);
      
      setFaqQuestion('');
      setFaqAnswer('');
      
      // CRITICAL: Wait a moment for backend to finish processing, then reload
      setTimeout(async () => {
        console.log('🔄 Reloading knowledge sources after FAQ add...');
        await loadKnowledgeSources();
      }, 1000);
      
      onUploadComplete?.();

    } catch (error: any) {
      console.error('FAQ add error:', error);
      const errorMessage = error.message || 'Failed to add FAQ';
      setError(errorMessage);
    } finally {
      setIsUploading(false);
      setIsLoading(false);
    }
  }, [agentId, faqQuestion, faqAnswer, loadKnowledgeSources, onUploadComplete]);

  // Handle delete
  const handleDelete = useCallback(async (sourceId: string) => {
    if (!confirm('Are you sure you want to delete this knowledge source? This action cannot be undone.')) {
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      setSuccessMessage(null);
      
      const apiUrl = getApiUrl();
      const url = `${apiUrl}/api/agents/${agentId}/knowledge/${sourceId}`;
      console.log('🗑️ Deleting knowledge source:', url);
      
      const response = await fetch(url, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || 'Failed to delete knowledge source');
      }

      const result = await response.json();
      console.log('✅ Delete result:', result);
      
      // Show success message
      setSuccessMessage('Knowledge source deleted successfully!');
      setTimeout(() => setSuccessMessage(null), 3000);
      
      // Reload knowledge sources immediately
      await loadKnowledgeSources();
      
    } catch (error: any) {
      console.error('❌ Delete error:', error);
      setError(`Failed to delete: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  }, [agentId, loadKnowledgeSources]);

  // Drag and drop handlers
  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current++;
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDragging(true);
    }
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current--;
    if (dragCounter.current === 0) {
      setIsDragging(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    dragCounter.current = 0;

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileUpload(e.dataTransfer.files);
    }
  }, [handleFileUpload]);

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Tabs */}
      <div className="flex space-x-2 border-b border-slate-700">
        <button
          onClick={() => setActiveTab('document')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'document'
              ? 'text-purple-400 border-b-2 border-purple-400'
              : 'text-slate-400 hover:text-slate-300'
          }`}
        >
          <FileText className="w-4 h-4 inline mr-2" />
          Documents
        </button>
        <button
          onClick={() => setActiveTab('url')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'url'
              ? 'text-purple-400 border-b-2 border-purple-400'
              : 'text-slate-400 hover:text-slate-300'
          }`}
        >
          <Globe className="w-4 h-4 inline mr-2" />
          URLs
        </button>
        <button
          onClick={() => setActiveTab('faq')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'faq'
              ? 'text-purple-400 border-b-2 border-purple-400'
              : 'text-slate-400 hover:text-slate-300'
          }`}
        >
          <HelpCircle className="w-4 h-4 inline mr-2" />
          FAQs
        </button>
      </div>

      {/* Success Message */}
      {successMessage && (
        <div className="bg-green-900/30 border border-green-500/50 rounded-lg p-4 flex items-start justify-between animate-in fade-in slide-in-from-top-2">
          <div className="flex items-start flex-1">
            <CheckCircle2 className="w-5 h-5 text-green-400 mr-2 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <span className="text-green-300 block">{successMessage}</span>
            </div>
          </div>
          <button
            onClick={() => setSuccessMessage(null)}
            className="ml-4 text-green-400 hover:text-green-300 flex-shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-red-900/30 border border-red-500/50 rounded-lg p-4 flex items-start justify-between animate-in fade-in slide-in-from-top-2">
          <div className="flex items-start flex-1">
            <AlertCircle className="w-5 h-5 text-red-400 mr-2 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <span className="text-red-300 block">{error}</span>
              {(error.includes('connect') || error.includes('backend')) && (
                <p className="text-xs text-red-400 mt-2">
                  Make sure the backend server is running at {getApiUrl()}
                </p>
              )}
            </div>
          </div>
          <button
            onClick={() => setError(null)}
            className="ml-4 text-red-400 hover:text-red-300 flex-shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Document Upload Tab */}
      {activeTab === 'document' && (
        <div
          onDragEnter={handleDragEnter}
          onDragOver={(e) => e.preventDefault()}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`
            border-2 border-dashed rounded-xl p-8 text-center transition-all
            ${isDragging
              ? 'border-purple-500 bg-purple-500/10'
              : 'border-slate-600 bg-slate-800/30 hover:border-slate-500'
            }
          `}
        >
          <Upload className={`w-12 h-12 mx-auto mb-4 ${isDragging ? 'text-purple-400' : 'text-slate-400'}`} />
          <h3 className="text-lg font-semibold text-white mb-2">
            {isDragging ? 'Drop file here' : 'Upload Document'}
          </h3>
          <p className="text-slate-400 mb-4">
            Drag and drop a file here, or click to browse
          </p>
          <p className="text-xs text-slate-500 mb-4">
            Supported: PDF, DOCX, TXT, CSV (Max 10MB)
          </p>
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.docx,.doc,.txt,.csv"
            onChange={(e) => {
              console.log('📁 File input changed:', e.target.files);
              if (e.target.files && e.target.files.length > 0) {
                handleFileUpload(e.target.files);
              }
            }}
            className="hidden"
          />
          <button
            onClick={() => {
              console.log('🔘 Browse button clicked, agentId:', agentId);
              if (!agentId) {
                setError('Agent ID is missing. Please create the agent first.');
                return;
              }
              fileInputRef.current?.click();
            }}
            disabled={isUploading || isLoading || !agentId}
            className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {isUploading ? (
              <>
                <Loader2 className="w-4 h-4 inline animate-spin mr-2" />
                Uploading...
              </>
            ) : (
              <>
                <File className="w-4 h-4 inline mr-2" />
                Browse Files
              </>
            )}
          </button>
        </div>
      )}

      {/* URL Scraping Tab */}
      {activeTab === 'url' && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Website URL
            </label>
            <div className="flex space-x-2">
              <input
                type="url"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder="https://example.com/page"
                className="flex-1 px-4 py-3 bg-slate-800/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
              <button
                onClick={handleUrlScrape}
                disabled={isUploading || isLoading || !urlInput.trim()}
                className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Scraping...
                  </>
                ) : (
                  <>
                    <LinkIcon className="w-4 h-4 mr-2" />
                    Scrape
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FAQ Tab */}
      {activeTab === 'faq' && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Question
            </label>
            <input
              type="text"
              value={faqQuestion}
              onChange={(e) => setFaqQuestion(e.target.value)}
              placeholder="What is your return policy?"
              className="w-full px-4 py-3 bg-slate-800/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Answer
            </label>
            <textarea
              value={faqAnswer}
              onChange={(e) => setFaqAnswer(e.target.value)}
              placeholder="We accept returns within 30 days of purchase..."
              rows={4}
              className="w-full px-4 py-3 bg-slate-800/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
            />
          </div>
          <button
            onClick={handleFaqAdd}
            disabled={isUploading || isLoading || !faqQuestion.trim() || !faqAnswer.trim()}
            className="w-full px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {isUploading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                Adding...
              </>
            ) : (
              <>
                <HelpCircle className="w-4 h-4 mr-2" />
                Add FAQ
              </>
            )}
          </button>
        </div>
      )}

      {/* Knowledge Sources List */}
      <div className="mt-8">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">
            Knowledge Sources ({knowledgeSources.length})
          </h3>
          <button
            onClick={() => loadKnowledgeSources()}
            disabled={isLoading}
            className="text-sm text-purple-400 hover:text-purple-300 disabled:opacity-50 flex items-center"
            title="Refresh list"
          >
            <Loader2 className={`w-4 h-4 mr-1 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
        
        {isLoading && knowledgeSources.length === 0 ? (
          <div className="text-center py-8">
            <Loader2 className="w-8 h-8 animate-spin text-slate-400 mx-auto" />
            <p className="text-slate-400 mt-2">Loading knowledge sources...</p>
          </div>
        ) : knowledgeSources.length === 0 ? (
          <div className="text-center py-8 text-slate-400 border border-slate-700 rounded-lg bg-slate-800/30">
            <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg mb-2">No knowledge sources yet</p>
            <p className="text-sm">Upload documents, scrape URLs, or add FAQs above to get started.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {knowledgeSources.map((source) => (
              <div
                key={source.id}
                className="bg-slate-800/50 border border-slate-700 rounded-lg p-4 flex items-start justify-between hover:border-slate-600 transition-colors group"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-2 flex-wrap">
                    {source.content_type === 'document' && <FileText className="w-5 h-5 text-blue-400 flex-shrink-0" />}
                    {source.content_type === 'url' && <Globe className="w-5 h-5 text-green-400 flex-shrink-0" />}
                    {source.content_type === 'faq' && <HelpCircle className="w-5 h-5 text-purple-400 flex-shrink-0" />}
                    <h4 className="font-medium text-white truncate">{source.source}</h4>
                    <span className="text-xs px-2 py-1 bg-slate-700 rounded text-slate-300 flex-shrink-0">
                      {source.content_type}
                    </span>
                    {source.chunk_count !== undefined && source.chunk_count > 0 && (
                      <span className="text-xs px-2 py-1 bg-purple-600/30 rounded text-purple-300 flex-shrink-0">
                        {source.chunk_count} {source.chunk_count === 1 ? 'chunk' : 'chunks'}
                      </span>
                    )}
                  </div>
                  {source.preview && (
                    <p className="text-sm text-slate-400 line-clamp-2 mb-2">{source.preview}...</p>
                  )}
                  <p className="text-xs text-slate-500">
                    Added {new Date(source.created_at).toLocaleDateString()} at {new Date(source.created_at).toLocaleTimeString()}
                  </p>
                </div>
                <div className="ml-4 flex items-center space-x-2 flex-shrink-0">
                  <button
                    onClick={() => handleDelete(source.id)}
                    className="p-2 text-red-400 hover:text-red-300 hover:bg-red-900/20 rounded transition-colors opacity-0 group-hover:opacity-100"
                    title="Delete knowledge source"
                    disabled={isLoading}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
