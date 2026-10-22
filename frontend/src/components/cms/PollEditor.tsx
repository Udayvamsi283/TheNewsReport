import React from 'react';
import { PollDetails, PollOption } from '../../types';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { BarChart3, Plus, Trash2 } from 'lucide-react';

interface PollEditorProps {
  details: PollDetails;
  onChange: (details: PollDetails) => void;
}

export const PollEditor: React.FC<PollEditorProps> = ({ details, onChange }) => {
  const options = details.options || [];

  const handleQuestionChange = (question: string) => {
    onChange({ ...details, question });
  };

  const handleAddOption = () => {
    const newOption: PollOption = {
      id: `opt_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      text: '',
      votes: 0
    };
    onChange({ ...details, options: [...options, newOption] });
  };

  const handleOptionTextChange = (id: string, text: string) => {
    const updated = options.map((opt) => (opt.id === id ? { ...opt, text } : opt));
    onChange({ ...details, options: updated });
  };

  const handleRemoveOption = (id: string) => {
    if (options.length <= 2) return;
    const updated = options.filter((opt) => opt.id !== id);
    onChange({ ...details, options: updated });
  };

  return (
    <div className="space-y-4 p-4 rounded-lg border border-slate-200 dark:border-navy-750 bg-slate-50 dark:bg-navy-900">
      <div className="flex items-center gap-2">
        <BarChart3 className="w-4 h-4 text-editorial-red" />
        <h3 className="text-sm font-bold text-slate-900 dark:text-white">
          Poll Content & Options
        </h3>
      </div>
      <p className="text-xs text-slate-500">
        Create an audience opinion poll. A minimum of 2 choices is required.
      </p>

      <Input
        label="Poll Question / Inquiry"
        placeholder="e.g. Should the proposed climate subsidy be indexed to inflation?"
        value={details.question || ''}
        onChange={(e) => handleQuestionChange(e.target.value)}
      />

      <div className="space-y-2 pt-2">
        <div className="flex items-center justify-between">
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
            Poll Options ({options.length})
          </label>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={handleAddOption}
            leftIcon={<Plus className="w-3.5 h-3.5" />}
          >
            Add Option
          </Button>
        </div>

        <div className="space-y-2">
          {options.map((opt, idx) => (
            <div key={opt.id} className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-400 w-5 text-right">
                {idx + 1}.
              </span>
              <Input
                placeholder={`Option ${idx + 1}`}
                value={opt.text}
                onChange={(e) => handleOptionTextChange(opt.id, e.target.value)}
                className="flex-1"
              />
              <button
                type="button"
                onClick={() => handleRemoveOption(opt.id)}
                disabled={options.length <= 2}
                className="p-2 rounded text-slate-400 hover:text-rose-500 disabled:opacity-20"
                title={options.length <= 2 ? 'Poll requires at least 2 options' : 'Remove option'}
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
