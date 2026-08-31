'use client';

import { useState, useEffect } from 'react';
import { ArrowRight, X } from 'lucide-react';

interface GoalSetupProps {
  initialGoal?: string;
  onGoalSet: (goal: string) => void;
  isOpen: boolean;
}

const SUGGESTED_GOALS = [
  'Become a frontend developer',
  'Master React and JavaScript',
  'Learn full-stack development',
  'Build iOS apps',
  'Master Python for data science',
  'Learn web design',
  'Become a DevOps engineer',
  'Master machine learning',
];

export default function GoalSetup({ initialGoal = '', onGoalSet, isOpen }: GoalSetupProps) {
  const [goal, setGoal] = useState(initialGoal);
  const [customGoal, setCustomGoal] = useState('');
  const [selectedGoal, setSelectedGoal] = useState<string | null>(null);
  const [showCustomInput, setShowCustomInput] = useState(false);

  useEffect(() => {
    if (initialGoal) {
      setGoal(initialGoal);
      setSelectedGoal(initialGoal);
    }
  }, [initialGoal]);

  const handleSelectGoal = (g: string) => {
    setSelectedGoal(g);
    setGoal(g);
    setShowCustomInput(false);
  };

  const handleCustomGoal = () => {
    setShowCustomInput(true);
  };

  const handleSubmitCustom = () => {
    if (customGoal.trim()) {
      setGoal(customGoal);
      setSelectedGoal(customGoal);
      setShowCustomInput(false);
      setCustomGoal('');
    }
  };

  const handleConfirm = () => {
    if (goal.trim()) {
      onGoalSet(goal);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
        <div className="mb-4">
          <h2 className="text-2xl font-bold text-slate-900">What's your learning goal?</h2>
          <p className="text-slate-600 text-sm mt-1">Choose a goal to get personalized recommendations</p>
        </div>

        {/* Suggested Goals Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4 max-h-48 overflow-y-auto">
          {SUGGESTED_GOALS.map((g) => (
            <button
              key={g}
              onClick={() => handleSelectGoal(g)}
              className={`p-3 rounded-lg border-2 text-left transition-all text-sm ${
                selectedGoal === g
                  ? 'border-trail-teal bg-trail-teal/10'
                  : 'border-slate-200 hover:border-trail-teal hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className={`font-medium ${
                  selectedGoal === g ? 'text-trail-teal' : 'text-slate-700'
                }`}>
                  {g}
                </span>
                {selectedGoal === g && (
                  <div className="w-4 h-4 bg-trail-teal rounded-full flex items-center justify-center">
                    <div className="w-1.5 h-1.5 bg-white rounded-full" />
                  </div>
                )}
              </div>
            </button>
          ))}
        </div>

        {/* Custom Goal Input */}
        <div className="mb-4">
          {!showCustomInput ? (
            <button
              onClick={handleCustomGoal}
              className="w-full py-2 px-3 border-2 border-dashed border-slate-300 rounded-lg text-slate-600 hover:border-trail-teal hover:text-trail-teal transition-colors font-medium text-sm"
            >
              + Create a custom goal
            </button>
          ) : (
            <div className="space-y-2">
              <input
                type="text"
                value={customGoal}
                onChange={(e) => setCustomGoal(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSubmitCustom()}
                placeholder="Enter your custom learning goal..."
                className="w-full px-3 py-2 border-2 border-slate-300 rounded-lg focus:outline-none focus:border-trail-teal text-sm"
                autoFocus
              />
              <div className="flex gap-2">
                <button
                  onClick={handleSubmitCustom}
                  className="flex-1 bg-trail-teal text-white py-2 rounded-lg hover:bg-trail-teal/90 transition-colors font-medium text-sm"
                >
                  Set Goal
                </button>
                <button
                  onClick={() => {
                    setShowCustomInput(false);
                    setCustomGoal('');
                  }}
                  className="flex-1 bg-slate-200 text-slate-700 py-2 rounded-lg hover:bg-slate-300 transition-colors font-medium text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Current Selection Display */}
        {goal && (
          <div className="mb-4 p-3 bg-trail-teal/5 border border-trail-teal/20 rounded-lg">
            <p className="text-xs text-slate-600 mb-1">Your goal:</p>
            <p className="text-base font-semibold text-trail-teal">{goal}</p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2">
          <button
            onClick={handleConfirm}
            disabled={!goal.trim()}
            className={`flex-1 py-2 px-3 rounded-lg font-medium transition-all flex items-center justify-center gap-2 text-sm ${
              goal.trim()
                ? 'bg-trail-teal text-white hover:bg-trail-teal/90'
                : 'bg-slate-200 text-slate-500 cursor-not-allowed'
            }`}
          >
            Continue <ArrowRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
