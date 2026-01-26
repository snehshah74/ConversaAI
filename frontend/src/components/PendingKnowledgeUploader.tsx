"use client";

import { useState, useCallback, useRef } from 'react';
import {
  Upload,
  FileText,
  Link as LinkIcon,
  HelpCircle,
  X,
  Trash2,
  Globe,
  File,
  AlertCircle
} from 'lucide-react';

export interface PendingKnowledgeItem {
  id: string;
  type: 'document' | 'url' | 'faq';
  name: string;
  file?: File;
  url?: string;
  question?: string;
  answer?: string;
}

interface PendingKnowledgeUploaderProps {
  pendingItems: PendingKnowledgeItem[];
  onAddItem: (item: PendingKnowledgeItem) => void;
  onRemoveItem: (id: string) => void;
  className?: string;
}

export default function PendingKnowledgeUploader({
  pendingItems,
  onAddItem,
  onRemoveItem,
  className = ''
}: PendingKnowledgeUploaderProps) {
  const [activeTab, setActiveTab] = useState<'document' | 'url' | 'faq'>('document');
  const [urlInput, setUrlInput] = useState('');
  const [faqQuestion, setFaqQuestion] = useState('');
  const [faqAnswer, setFaqAnswer] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragCounter = useRef(0);

  const handleFileUpload = useCallback((files: FileList | null) => {
    if (!files || files.length === 0) return;

    const file = files[0];

    // Validate file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      alert('File size exceeds 10MB limit');
      return;
    }

    // Validate file type
    const allowedTypes = ['.pdf', '.docx', '.doc', '.txt', '.csv'];
    const fileExt = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!allowedTypes.includes(fileExt)) {
      alert(`Unsupported file type. Allowed: ${allowedTypes.join(', ')}`);
      return;
    }

    const newItem: PendingKnowledgeItem = {
      id: `pending-${Date.now()}-${Math.random()}`,
      type: 'document',
      name: file.name,
      file: file
    };

    onAddItem(newItem);
  }, [onAddItem]);

  const handleUrlAdd = useCallback(() => {
    if (!urlInput.trim()) {
      alert('Please enter a valid URL');
      return;
    }

    try {
      new URL(urlInput.trim()); // Validate URL
    } catch {
      alert('Please enter a valid URL');
      return;
    }

    const newItem: PendingKnowledgeItem = {
      id: `pending-${Date.now()}-${Math.random()}`,
      type: 'url',
      name: urlInput.trim(),
      url: urlInput.trim()
    };

    onAddItem(newItem);
    setUrlInput('');
  }, [urlInput, onAddItem]);

  const handleFaqAdd = useCallback(() => {
    if (!faqQuestion.trim() || !faqAnswer.trim()) {
      alert('Please fill in both question and answer');
      return;
    }

    const newItem: PendingKnowledgeItem = {
      id: `pending-${Date.now()}-${Math.random()}`,
      type: 'faq',
      name: `FAQ: ${faqQuestion.substring(0, 50)}${faqQuestion.length > 50 ? '...' : ''}`,
      question: faqQuestion.trim(),
      answer: faqAnswer.trim()
    };

    onAddItem(newItem);
    setFaqQuestion('');
    setFaqAnswer('');
  }, [faqQuestion, faqAnswer, onAddItem]);

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

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    dragCounter.current = 0;
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileUpload(e.dataTransfer.files);
      e.dataTransfer.clearData();
    }
  }, [handleFileUpload]);

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Tabs */}
      <div className="flex border-b border-slate-700">
        <button
          className={`py-2 px-4 text-sm font-medium flex items-center ${
            activeTab === 'document' ? 'text-purple-400 border-b-2 border-purple-400' : 'text-slate-400 hover:text-white'
          }`}
          onClick={() => setActiveTab('document')}
        >
          <FileText className="w-4 h-4 mr-2" /> Documents
        </button>
        <button
          className={`py-2 px-4 text-sm font-medium flex items-center ${
            activeTab === 'url' ? 'text-purple-400 border-b-2 border-purple-400' : 'text-slate-400 hover:text-white'
          }`}
          onClick={() => setActiveTab('url')}
        >
          <Globe className="w-4 h-4 mr-2" /> URLs
        </button>
        <button
          className={`py-2 px-4 text-sm font-medium flex items-center ${
            activeTab === 'faq' ? 'text-purple-400 border-b-2 border-purple-400' : 'text-slate-400 hover:text-white'
          }`}
          onClick={() => setActiveTab('faq')}
        >
          <HelpCircle className="w-4 h-4 mr-2" /> FAQs
        </button>
      </div>

      {/* Document Upload Tab */}
      {activeTab === 'document' && (
        <div
          className={`border-2 border-dashed ${isDragging ? 'border-blue-500 bg-blue-900/20' : 'border-slate-700'} rounded-xl p-8 text-center transition-all duration-200`}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        >
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            onChange={(e) => handleFileUpload(e.target.files)}
            accept=".pdf,.docx,.doc,.txt,.csv"
          />
          <Upload className="w-16 h-16 text-purple-400 mx-auto mb-4" />
          <p className="text-white text-lg font-semibold mb-2">Drag and drop a file here, or click to browse.</p>
          <p className="text-slate-400 text-sm mb-4">Supported: PDF, DOCX, TXT, CSV (Max 10MB)</p>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition-all duration-200 flex items-center mx-auto"
          >
            <FileText className="w-5 h-5 mr-2" /> Browse Files
          </button>
        </div>
      )}

      {/* URL Scrape Tab */}
      {activeTab === 'url' && (
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <input
              type="url"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              placeholder="Enter URL to scrape (e.g., https://example.com/faq)"
              className="flex-grow px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            <button
              onClick={handleUrlAdd}
              className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-all duration-200 flex items-center"
              disabled={!urlInput.trim()}
            >
              <Globe className="w-5 h-5 mr-2" /> Add URL
            </button>
          </div>
          <p className="text-slate-400 text-sm">Content from the URL will be extracted and added to your agent's knowledge after creation.</p>
        </div>
      )}

      {/* FAQ Tab */}
      {activeTab === 'faq' && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Question</label>
            <input
              type="text"
              value={faqQuestion}
              onChange={(e) => setFaqQuestion(e.target.value)}
              placeholder="e.g., What are your business hours?"
              className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Answer</label>
            <textarea
              value={faqAnswer}
              onChange={(e) => setFaqAnswer(e.target.value)}
              rows={4}
              placeholder="e.g., Our business hours are Monday to Friday, 9 AM to 5 PM."
              className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
            />
          </div>
          <button
            onClick={handleFaqAdd}
            className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-all duration-200 flex items-center justify-center"
            disabled={!faqQuestion.trim() || !faqAnswer.trim()}
          >
            <HelpCircle className="w-5 h-5 mr-2" /> Add FAQ
          </button>
        </div>
      )}

      {/* Pending Items List */}
      {pendingItems.length > 0 && (
        <div>
          <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
            <FileText className="w-5 h-5 mr-2 text-purple-400" /> Pending Knowledge Sources ({pendingItems.length})
          </h3>
          <div className="space-y-3">
            {pendingItems.map((item) => (
              <div key={item.id} className="flex items-center justify-between bg-slate-800/50 p-3 rounded-lg border border-slate-700">
                <div className="flex items-center">
                  {item.type === 'document' && <FileText className="w-5 h-5 mr-3 text-blue-400" />}
                  {item.type === 'url' && <LinkIcon className="w-5 h-5 mr-3 text-green-400" />}
                  {item.type === 'faq' && <HelpCircle className="w-5 h-5 mr-3 text-purple-400" />}
                  <div>
                    <p className="text-white font-medium">{item.name}</p>
                    <p className="text-slate-400 text-xs">
                      {item.type.toUpperCase()} | Will be uploaded after agent creation
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => onRemoveItem(item.id)}
                  className="text-red-400 hover:text-red-500 transition-colors p-1 rounded-full hover:bg-slate-700"
                  title="Remove"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {pendingItems.length === 0 && (
        <div className="text-center text-slate-400 py-8 border border-slate-800 rounded-xl bg-slate-900/50">
          <File className="w-12 h-12 mx-auto mb-4 text-slate-600" />
          <p>No knowledge sources added yet. Add documents, URLs, or FAQs above.</p>
        </div>
      )}
    </div>
  );
}
