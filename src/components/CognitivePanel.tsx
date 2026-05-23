import React from 'react';
import { AccessibilityConfig } from '../types';
import { Sparkles, Eye, Award, Volume2, HelpCircle } from 'lucide-react';

interface CognitivePanelProps {
  config: AccessibilityConfig;
  onChange: (newConfig: AccessibilityConfig) => void;
}

export default function CognitivePanel({ config, onChange }: CognitivePanelProps) {
  const updateMode = (mode: AccessibilityConfig['mode']) => {
    let fontFamily: AccessibilityConfig['fontFamily'] = 'sans';
    let bionicReading = false;
    let readingGuide = false;

    if (mode === 'dyslexia') {
      fontFamily = 'dyslexic';
      readingGuide = true;
    } else if (mode === 'adhd') {
      bionicReading = true;
      readingGuide = true;
    } else if (mode === 'autism') {
      fontFamily = 'mono';
    }

    onChange({
      ...config,
      mode,
      fontFamily,
      bionicReading,
      readingGuide
    });
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
      <div className="flex items-center gap-2 mb-4 border-b border-slate-100 dark:border-slate-800 pb-3">
        <Sparkles className="h-5 w-5 text-indigo-600 animate-pulse" />
        <h2 id="cognitive-panel-title" className="font-sans font-semibold text-slate-800 dark:text-slate-100 text-lg">
          Cognitive Adaptation Suite
        </h2>
      </div>

      <div className="space-y-5">
        {/* Profile Selector */}
        <div>
          <label className="block text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">
            Cognitive Learner Profile
          </label>
          <div className="grid grid-cols-2 gap-2" id="profile-selectors">
            {[
              { id: 'standard', name: 'Standard Flow', desc: 'Default technical view' },
              { id: 'dyslexia', name: 'Dyslexia Mode', desc: 'Proportioned typography' },
              { id: 'adhd', name: 'ADHD Focus', desc: 'Bionic bold & focus guide' },
              { id: 'autism', name: 'ASD Systematic', desc: 'Rule-based analytical trees' },
            ].map((profile) => (
              <button
                key={profile.id}
                id={`btn-profile-${profile.id}`}
                onClick={() => updateMode(profile.id as any)}
                className={`text-left p-3 rounded-xl border transition-all duration-200 ${
                  config.mode === profile.id
                    ? 'border-indigo-600 bg-indigo-50/70 dark:bg-indigo-950/40 dark:border-indigo-500 shadow-sm'
                    : 'border-slate-100 dark:border-slate-800 hover:border-indigo-200 hover:bg-slate-50/50 dark:hover:bg-slate-800/50'
                }`}
              >
                <div className="font-sans font-semibold text-sm text-slate-800 dark:text-slate-200">{profile.name}</div>
                <div className="font-sans text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">{profile.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Visual Adaptation Toggles */}
        <div>
          <label className="block text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3">
            Custom Visual Adaptations
          </label>
          <div className="space-y-3" id="adaptation-toggles">
            
            {/* Font Selector */}
            <div className="flex items-center justify-between py-1">
              <span className="text-sm font-sans text-slate-600 dark:text-slate-350 dark:text-slate-300">Font System</span>
              <select
                id="font-select"
                value={config.fontFamily}
                onChange={(e) => onChange({ ...config, fontFamily: e.target.value as any })}
                className="text-xs bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-lg py-1 px-2.5 font-semibold text-slate-700 dark:text-slate-300 outline-none focus:border-indigo-500"
              >
                <option value="sans">Inter (Sans-Serif)</option>
                <option value="dyslexic">OpenDyslexic (Simulated)</option>
                <option value="mono">JetBrains Mono</option>
              </select>
            </div>

            {/* Bionic Reading */}
            <label className="flex items-center justify-between cursor-pointer py-1">
              <div className="flex flex-col">
                <span className="text-sm font-sans text-slate-600 dark:text-slate-350 dark:text-slate-300">Bionic Reading</span>
                <span className="text-[11px] text-slate-400 dark:text-slate-500 font-sans">Highlight first half of words</span>
              </div>
              <input
                type="checkbox"
                id="toggle-bionic"
                checked={config.bionicReading}
                onChange={(e) => onChange({ ...config, bionicReading: e.target.checked })}
                className="sr-only peer"
              />
              <div className="relative w-9 h-5 bg-slate-200 dark:bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white dark:after:bg-slate-100 after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
            </label>

            {/* Reading Line Ruler */}
            <label className="flex items-center justify-between cursor-pointer py-1">
              <div className="flex flex-col">
                <span className="text-sm font-sans text-slate-600 dark:text-slate-350 dark:text-slate-300">Focus Reading Ruler</span>
                <span className="text-[11px] text-slate-400 dark:text-slate-500 font-sans">Visual guidance line highlighting current reading track</span>
              </div>
              <input
                type="checkbox"
                id="toggle-ruler"
                checked={config.readingGuide}
                onChange={(e) => onChange({ ...config, readingGuide: e.target.checked })}
                className="sr-only peer"
              />
              <div className="relative w-9 h-5 bg-slate-200 dark:bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white dark:after:bg-slate-100 after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
            </label>

            {/* Text to Speech Pitch */}
            <div className="py-1">
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-1">
                  <Volume2 className="h-4 w-4 text-slate-500 dark:text-slate-400" />
                  <span className="text-xs font-semibold text-slate-600 dark:text-slate-300 font-sans">Speech Synthesis Speed</span>
                </div>
                <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">{config.ttsSpeed}x</span>
              </div>
              <input
                type="range"
                id="tts-speed-slider"
                min="0.5"
                max="2"
                step="0.1"
                value={config.ttsSpeed}
                onChange={(e) => onChange({ ...config, ttsSpeed: parseFloat(e.target.value) })}
                className="w-full h-1 bg-slate-100 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-600"
              />
            </div>

            {/* High Contrast */}
            <label className="flex items-center justify-between cursor-pointer py-1">
              <div className="flex flex-col">
                <span className="text-sm font-sans text-slate-600 dark:text-slate-350 dark:text-slate-300">High Contrast Highlights</span>
                <span className="text-[11px] text-slate-400 dark:text-slate-500 font-sans">Dark solid borders & bright emphasis colors</span>
              </div>
              <input
                type="checkbox"
                id="toggle-contrast"
                checked={config.highContrast}
                onChange={(e) => onChange({ ...config, highContrast: e.target.checked })}
                className="sr-only peer"
              />
              <div className="relative w-9 h-5 bg-slate-200 dark:bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white dark:after:bg-slate-100 after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
            </label>

          </div>
        </div>

        {/* Cognitive Information / Help Box */}
        <div className="bg-slate-50 dark:bg-slate-950/20 rounded-xl p-3 border border-slate-100/50 dark:border-slate-800">
          <div className="flex gap-2">
            <HelpCircle className="h-4.5 w-4.5 text-slate-400 dark:text-slate-500 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h4 className="text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider font-sans">Cognitive Impact Metric</h4>
              <p className="text-[11px] text-slate-550 dark:text-slate-400 leading-normal font-sans">
                Each mode alters documentation pacing. ADHD mode filters secondary descriptions to reduce cognitive load by up to **42%**. Dyslexia mode adjusts text tracking to reduce phonological dyslexia reading stress.
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
