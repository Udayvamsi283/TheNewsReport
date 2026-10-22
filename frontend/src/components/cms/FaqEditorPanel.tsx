import React from 'react';
import { FaqItem } from '../../types';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { HelpCircle, Plus, Trash2 } from 'lucide-react';

interface FaqEditorPanelProps {
  faq: FaqItem[];
  onChange: (faq: FaqItem[]) => void;
}

export const FaqEditorPanel: React.FC<FaqEditorPanelProps> = ({ faq, onChange }) => {
  const handleAddFaq = () => {
    onChange([...faq, { question: '', answer: '' }]);
  };

  const handleRemoveFaq = (index: number) => {
    onChange(faq.filter((_, i) => i !== index));
  };

  const handleChange = (index: number, field: keyof FaqItem, value: string) => {
    const updated = [...faq];
    updated[index] = { ...updated[index], [field]: value };
    onChange(updated);
  };

  return (
    <div className="space-y-4 p-4 rounded-lg border border-slate-200 dark:border-navy-750 bg-slate-50 dark:bg-navy-900">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <HelpCircle className="w-4 h-4 text-editorial-red" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Structured Article FAQ ({faq.length})
            </h3>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Add questions and answers to power structured Google FAQ schema and reader clarification accordions.
          </p>
        </div>

        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={handleAddFaq}
          leftIcon={<Plus className="w-3.5 h-3.5" />}
        >
          Add FAQ
        </Button>
      </div>

      {faq.length === 0 ? (
        <div
          onClick={handleAddFaq}
          className="border-2 border-dashed border-slate-300 dark:border-navy-700 rounded-lg p-5 text-center cursor-pointer hover:border-editorial-red transition-colors"
        >
          <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
            No FAQ entries attached to this post
          </p>
          <p className="text-[11px] text-slate-400 mt-1">
            Click here to add frequently asked reader questions.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {faq.map((item, index) => (
            <div
              key={index}
              className="p-3 rounded border border-slate-200 dark:border-navy-700 bg-white dark:bg-navy-850 space-y-2"
            >
              <div className="flex items-center justify-between gap-2">
                <Input
                  label={`Question #${index + 1}`}
                  placeholder="e.g. When will the revised policy take effect?"
                  value={item.question}
                  onChange={(e) => handleChange(index, 'question', e.target.value)}
                  className="flex-1"
                />
                <button
                  type="button"
                  onClick={() => handleRemoveFaq(index)}
                  className="mt-5 p-2 rounded text-slate-400 hover:text-rose-500"
                  title="Remove Question"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Answer
                </label>
                <textarea
                  rows={2}
                  className="w-full p-2 text-xs rounded border border-slate-200 dark:border-navy-700 bg-slate-50 dark:bg-navy-900 text-slate-900 dark:text-white focus:outline-none focus:border-editorial-red"
                  placeholder="Clear, factual editorial explanation..."
                  value={item.answer}
                  onChange={(e) => handleChange(index, 'answer', e.target.value)}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
