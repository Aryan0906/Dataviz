import React, { useState } from 'react';
import { BookOpen, ChevronDown, ChevronUp, Sparkles, X } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

export default function StorySummaryCard({ story, onClose }) {
  const { darkMode } = useTheme();
  const [isExpanded, setIsExpanded] = useState(true);

  if (!story) return null;

  return (
    <div
      className={`mb-6 p-5 rounded-xl border relative shadow-sm transition-all duration-300 ${
        darkMode
          ? 'bg-gradient-to-br from-indigo-900/40 to-slate-900/60 border-indigo-500/30 text-indigo-50'
          : 'bg-gradient-to-br from-indigo-50 to-white border-indigo-100 text-slate-800'
      }`}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2 mb-2">
          <div
            className={`p-1.5 rounded-lg ${
              darkMode ? 'bg-indigo-500/20 text-indigo-300' : 'bg-indigo-100 text-indigo-600'
            }`}
          >
            <Sparkles className="w-4 h-4" />
          </div>
          <h3 className="font-semibold text-sm tracking-wide uppercase opacity-80 flex items-center gap-2">
            AI Data Story
          </h3>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className={`p-1.5 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors`}
            aria-label={isExpanded ? 'Collapse story' : 'Expand story'}
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
          {onClose && (
            <button
              onClick={onClose}
              className={`p-1.5 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors`}
              aria-label="Close story"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {isExpanded && (
        <div className={`mt-2 leading-relaxed text-sm md:text-base ${darkMode ? 'text-indigo-100/90' : 'text-slate-700'}`}>
          <div className="flex gap-3">
            <BookOpen className={`w-5 h-5 flex-shrink-0 mt-0.5 opacity-60 ${darkMode ? 'text-indigo-300' : 'text-indigo-500'}`} />
            <div className="space-y-2">
              {story.split(/(?<=\.)\s+/).map((sentence, idx) => (
                <p key={idx}>{sentence}</p>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
