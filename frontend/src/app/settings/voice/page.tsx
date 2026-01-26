"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeft, 
  Volume2, 
  Mic, 
  Play, 
  Square,
  RotateCcw,
  Settings,
  Accessibility,
  Save,
  Check
} from 'lucide-react';
import { useVoiceSettings } from '@/contexts/VoiceSettingsContext';
import Navigation from '@/components/Navigation';

export default function VoiceSettingsPage() {
  const router = useRouter();
  const { 
    settings, 
    updateSettings, 
    resetSettings, 
    availableVoices, 
    testVoice, 
    isTestingVoice 
  } = useVoiceSettings();
  
  const [saved, setSaved] = useState(false);
  const [activeTab, setActiveTab] = useState<'voice' | 'behavior' | 'accessibility'>('voice');

  // Filter English voices
  const englishVoices = availableVoices.filter(v => v.lang.startsWith('en'));

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const stopTestVoice = () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      speechSynthesis.cancel();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950">
      <Navigation />
      
      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link 
            href="/dashboard" 
            className="inline-flex items-center text-slate-400 hover:text-white mb-4 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Link>
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">Voice Settings</h1>
              <p className="text-slate-400">Customize your voice AI experience</p>
            </div>
            
            <button
              onClick={handleSave}
              className={`px-6 py-2.5 rounded-xl font-medium transition-all duration-300 flex items-center space-x-2 ${
                saved 
                  ? 'bg-emerald-500 text-white' 
                  : 'bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white'
              }`}
            >
              {saved ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>Saved!</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Save Settings</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex space-x-1 bg-slate-800/50 p-1 rounded-xl mb-8">
          {[
            { id: 'voice', label: 'Voice', icon: Volume2 },
            { id: 'behavior', label: 'Behavior', icon: Settings },
            { id: 'accessibility', label: 'Accessibility', icon: Accessibility },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 flex items-center justify-center space-x-2 px-4 py-3 rounded-lg font-medium transition-all duration-200 ${
                activeTab === tab.id
                  ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-lg'
                  : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Voice Tab */}
        {activeTab === 'voice' && (
          <div className="space-y-6">
            {/* Voice Selection */}
            <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 border border-slate-700/50">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                <Volume2 className="w-5 h-5 mr-2 text-violet-400" />
                Voice Selection
              </h3>
              
              <div className="grid gap-4">
                {/* Gender Preference */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Voice Gender Preference
                  </label>
                  <div className="flex space-x-3">
                    {['female', 'male', 'neutral'].map(gender => (
                      <button
                        key={gender}
                        onClick={() => updateSettings({ voiceGender: gender as any, preferredVoice: 'default' })}
                        className={`flex-1 py-3 px-4 rounded-xl font-medium transition-all duration-200 capitalize ${
                          settings.voiceGender === gender
                            ? 'bg-violet-600 text-white'
                            : 'bg-slate-700/50 text-slate-300 hover:bg-slate-600/50'
                        }`}
                      >
                        {gender}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Specific Voice */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Specific Voice (Optional)
                  </label>
                  <select
                    value={settings.preferredVoice}
                    onChange={(e) => updateSettings({ preferredVoice: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-xl text-white focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                  >
                    <option value="default">Use gender preference</option>
                    {englishVoices.map(voice => (
                      <option key={voice.name} value={voice.name}>
                        {voice.name} ({voice.lang})
                      </option>
                    ))}
                  </select>
                  {englishVoices.length === 0 && (
                    <p className="text-sm text-slate-500 mt-2">Loading voices...</p>
                  )}
                </div>

                {/* Test Voice Button */}
                <div className="flex space-x-3">
                  <button
                    onClick={() => isTestingVoice ? stopTestVoice() : testVoice()}
                    className={`flex-1 py-3 px-4 rounded-xl font-medium transition-all duration-200 flex items-center justify-center space-x-2 ${
                      isTestingVoice
                        ? 'bg-red-600 hover:bg-red-500 text-white'
                        : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                    }`}
                  >
                    {isTestingVoice ? (
                      <>
                        <Square className="w-4 h-4" />
                        <span>Stop</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4" />
                        <span>Test Voice</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Speech Settings */}
            <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 border border-slate-700/50">
              <h3 className="text-lg font-semibold text-white mb-4">Speech Settings</h3>
              
              <div className="space-y-6">
                {/* Speech Rate */}
                <div>
                  <div className="flex justify-between mb-2">
                    <label className="text-sm font-medium text-slate-300">Speech Speed</label>
                    <span className="text-sm text-violet-400">{settings.speechRate.toFixed(1)}x</span>
                  </div>
                  <input
                    type="range"
                    min="0.5"
                    max="2"
                    step="0.1"
                    value={settings.speechRate}
                    onChange={(e) => updateSettings({ speechRate: parseFloat(e.target.value) })}
                    className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-violet-500"
                  />
                  <div className="flex justify-between text-xs text-slate-500 mt-1">
                    <span>Slower</span>
                    <span>Normal</span>
                    <span>Faster</span>
                  </div>
                </div>

                {/* Speech Pitch */}
                <div>
                  <div className="flex justify-between mb-2">
                    <label className="text-sm font-medium text-slate-300">Voice Pitch</label>
                    <span className="text-sm text-violet-400">{settings.speechPitch.toFixed(1)}</span>
                  </div>
                  <input
                    type="range"
                    min="0.5"
                    max="2"
                    step="0.1"
                    value={settings.speechPitch}
                    onChange={(e) => updateSettings({ speechPitch: parseFloat(e.target.value) })}
                    className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-violet-500"
                  />
                  <div className="flex justify-between text-xs text-slate-500 mt-1">
                    <span>Lower</span>
                    <span>Normal</span>
                    <span>Higher</span>
                  </div>
                </div>

                {/* Volume */}
                <div>
                  <div className="flex justify-between mb-2">
                    <label className="text-sm font-medium text-slate-300">Volume</label>
                    <span className="text-sm text-violet-400">{Math.round(settings.speechVolume * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={settings.speechVolume}
                    onChange={(e) => updateSettings({ speechVolume: parseFloat(e.target.value) })}
                    className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-violet-500"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Behavior Tab */}
        {activeTab === 'behavior' && (
          <div className="space-y-6">
            <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 border border-slate-700/50">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                <Mic className="w-5 h-5 mr-2 text-violet-400" />
                Microphone Settings
              </h3>
              
              <div className="space-y-6">
                {/* Microphone Sensitivity */}
                <div>
                  <div className="flex justify-between mb-2">
                    <label className="text-sm font-medium text-slate-300">Microphone Sensitivity</label>
                    <span className="text-sm text-violet-400">{settings.microphoneSensitivity}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="5"
                    value={settings.microphoneSensitivity}
                    onChange={(e) => updateSettings({ microphoneSensitivity: parseInt(e.target.value) })}
                    className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-violet-500"
                  />
                  <p className="text-xs text-slate-500 mt-2">
                    Higher sensitivity picks up quieter sounds. Lower if there's background noise.
                  </p>
                </div>

                {/* Voice Activity Detection */}
                <div className="flex items-center justify-between py-3">
                  <div>
                    <p className="font-medium text-white">Voice Activity Detection</p>
                    <p className="text-sm text-slate-400">Automatically detect when you start/stop speaking</p>
                  </div>
                  <button
                    onClick={() => updateSettings({ voiceActivityDetection: !settings.voiceActivityDetection })}
                    className={`relative w-14 h-7 rounded-full transition-colors duration-200 ${
                      settings.voiceActivityDetection ? 'bg-violet-600' : 'bg-slate-600'
                    }`}
                  >
                    <span 
                      className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full transition-transform duration-200 ${
                        settings.voiceActivityDetection ? 'translate-x-7' : ''
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>

            <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 border border-slate-700/50">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                <Settings className="w-5 h-5 mr-2 text-violet-400" />
                Response Settings
              </h3>
              
              <div className="space-y-4">
                {/* Auto-play Responses */}
                <div className="flex items-center justify-between py-3 border-b border-slate-700/50">
                  <div>
                    <p className="font-medium text-white">Auto-play Voice Responses</p>
                    <p className="text-sm text-slate-400">Automatically speak agent responses</p>
                  </div>
                  <button
                    onClick={() => updateSettings({ autoPlayResponses: !settings.autoPlayResponses })}
                    className={`relative w-14 h-7 rounded-full transition-colors duration-200 ${
                      settings.autoPlayResponses ? 'bg-violet-600' : 'bg-slate-600'
                    }`}
                  >
                    <span 
                      className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full transition-transform duration-200 ${
                        settings.autoPlayResponses ? 'translate-x-7' : ''
                      }`}
                    />
                  </button>
                </div>

                {/* Show Transcriptions */}
                <div className="flex items-center justify-between py-3 border-b border-slate-700/50">
                  <div>
                    <p className="font-medium text-white">Show Transcriptions</p>
                    <p className="text-sm text-slate-400">Display text version of all speech</p>
                  </div>
                  <button
                    onClick={() => updateSettings({ showTranscriptions: !settings.showTranscriptions })}
                    className={`relative w-14 h-7 rounded-full transition-colors duration-200 ${
                      settings.showTranscriptions ? 'bg-violet-600' : 'bg-slate-600'
                    }`}
                  >
                    <span 
                      className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full transition-transform duration-200 ${
                        settings.showTranscriptions ? 'translate-x-7' : ''
                      }`}
                    />
                  </button>
                </div>

                {/* Text-only Mode */}
                <div className="flex items-center justify-between py-3">
                  <div>
                    <p className="font-medium text-white">Text-only Mode</p>
                    <p className="text-sm text-slate-400">Disable all voice features</p>
                  </div>
                  <button
                    onClick={() => updateSettings({ prefersTextOnly: !settings.prefersTextOnly })}
                    className={`relative w-14 h-7 rounded-full transition-colors duration-200 ${
                      settings.prefersTextOnly ? 'bg-violet-600' : 'bg-slate-600'
                    }`}
                  >
                    <span 
                      className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full transition-transform duration-200 ${
                        settings.prefersTextOnly ? 'translate-x-7' : ''
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Accessibility Tab */}
        {activeTab === 'accessibility' && (
          <div className="space-y-6">
            <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 border border-slate-700/50">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                <Accessibility className="w-5 h-5 mr-2 text-violet-400" />
                Accessibility Options
              </h3>
              
              <div className="space-y-4">
                {/* Reduce Animations */}
                <div className="flex items-center justify-between py-3 border-b border-slate-700/50">
                  <div>
                    <p className="font-medium text-white">Reduce Animations</p>
                    <p className="text-sm text-slate-400">Minimize motion for vestibular disorders</p>
                  </div>
                  <button
                    onClick={() => updateSettings({ reduceAnimations: !settings.reduceAnimations })}
                    className={`relative w-14 h-7 rounded-full transition-colors duration-200 ${
                      settings.reduceAnimations ? 'bg-violet-600' : 'bg-slate-600'
                    }`}
                  >
                    <span 
                      className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full transition-transform duration-200 ${
                        settings.reduceAnimations ? 'translate-x-7' : ''
                      }`}
                    />
                  </button>
                </div>

                {/* High Contrast */}
                <div className="flex items-center justify-between py-3">
                  <div>
                    <p className="font-medium text-white">High Contrast Mode</p>
                    <p className="text-sm text-slate-400">Increase contrast for better visibility</p>
                  </div>
                  <button
                    onClick={() => updateSettings({ highContrastMode: !settings.highContrastMode })}
                    className={`relative w-14 h-7 rounded-full transition-colors duration-200 ${
                      settings.highContrastMode ? 'bg-violet-600' : 'bg-slate-600'
                    }`}
                  >
                    <span 
                      className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full transition-transform duration-200 ${
                        settings.highContrastMode ? 'translate-x-7' : ''
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>

            {/* Keyboard Shortcuts */}
            <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 border border-slate-700/50">
              <h3 className="text-lg font-semibold text-white mb-4">Keyboard Shortcuts</h3>
              
              <div className="space-y-3">
                {[
                  { key: 'Space', action: 'Start/stop voice recording' },
                  { key: 'Escape', action: 'Stop current speech' },
                  { key: 'M', action: 'Toggle mute' },
                  { key: 'Enter', action: 'Send text message' },
                ].map(shortcut => (
                  <div key={shortcut.key} className="flex items-center justify-between py-2">
                    <span className="text-slate-300">{shortcut.action}</span>
                    <kbd className="px-3 py-1.5 bg-slate-700 rounded-lg text-sm font-mono text-violet-400 border border-slate-600">
                      {shortcut.key}
                    </kbd>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Reset Button */}
        <div className="mt-8 flex justify-center">
          <button
            onClick={resetSettings}
            className="flex items-center space-x-2 px-6 py-3 text-slate-400 hover:text-white transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Reset to Defaults</span>
          </button>
        </div>
      </main>
    </div>
  );
}
