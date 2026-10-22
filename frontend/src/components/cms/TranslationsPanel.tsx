import React, { useState } from 'react';
import { Translation, Language } from '../../types';
import { Input } from '../ui/Input';
import { Languages } from 'lucide-react';
import { slugify } from '../../lib/utils';

interface TranslationsPanelProps {
  translations: Translation[];
  onChange: (translations: Translation[]) => void;
  availableLanguages: Language[];
  currentLanguageId?: string;
}

export const TranslationsPanel: React.FC<TranslationsPanelProps> = ({
  translations,
  onChange,
  availableLanguages,
  currentLanguageId
}) => {
  const [activeTab, setActiveTab] = useState<number>(0);

  // Filter languages that aren't already translated or primary
  const existingLangIds = translations.map(t => typeof t.language === 'object' ? t.language._id : t.language);
  const eligibleLanguages = availableLanguages.filter(
    l => l._id !== currentLanguageId && !existingLangIds.includes(l._id)
  );

  const handleAddTranslation = (lang: Language) => {
    const newTrans: Translation = {
      language: lang._id || '',
      languageCode: lang.code,
      title: '',
      slug: '',
      summary: '',
      content: '',
      seo: { metaTitle: '', metaDescription: '' }
    };
    onChange([...translations, newTrans]);
    setActiveTab(translations.length);
  };

  const handleRemoveTranslation = (index: number) => {
    const updated = translations.filter((_, i) => i !== index);
    onChange(updated);
    if (activeTab >= updated.length) {
      setActiveTab(Math.max(0, updated.length - 1));
    }
  };

  const handleUpdate = (index: number, field: keyof Translation, value: any) => {
    const updated = [...translations];
    updated[index] = { ...updated[index], [field]: value };
    if (field === 'title' && !updated[index].slug) {
      updated[index].slug = slugify(value);
    }
    onChange(updated);
  };

  return (
    <div className="space-y-4 p-4 rounded-lg border border-slate-200 dark:border-navy-750 bg-slate-50 dark:bg-navy-900">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <Languages className="w-4 h-4 text-editorial-red" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Multilingual Translations ({translations.length})
            </h3>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Add localized article versions for Telugu, Hindi, or other supported locales.
          </p>
        </div>

        {eligibleLanguages.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500">Add locale:</span>
            <div className="flex gap-1">
              {eligibleLanguages.map((l) => (
                <button
                  key={l._id}
                  type="button"
                  onClick={() => handleAddTranslation(l)}
                  className="px-2 py-1 rounded bg-white dark:bg-navy-800 border border-slate-200 dark:border-navy-700 hover:border-editorial-red text-xs font-semibold text-slate-700 dark:text-slate-300"
                >
                  +{l.name} ({l.code})
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {translations.length === 0 ? (
        <div className="border-2 border-dashed border-slate-300 dark:border-navy-700 rounded-lg p-5 text-center">
          <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
            No localized translations added yet
          </p>
          <p className="text-[11px] text-slate-400 mt-1">
            This article will appear in its primary language. Use the buttons above to add localized variants.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {/* Tabs for each locale */}
          <div className="flex border-b border-slate-200 dark:border-navy-750 gap-2 overflow-x-auto">
            {translations.map((t, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setActiveTab(idx)}
                className={`px-3 py-1.5 text-xs font-bold uppercase tracking-wider border-b-2 flex items-center gap-1.5 transition-colors ${
                  activeTab === idx
                    ? 'border-editorial-red text-editorial-red'
                    : 'border-transparent text-slate-500 hover:text-slate-900'
                }`}
              >
                <span>{t.languageCode}</span>
                <span
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemoveTranslation(idx);
                  }}
                  className="hover:text-rose-500 p-0.5 rounded"
                  title="Remove translation"
                >
                  ×
                </span>
              </button>
            ))}
          </div>

          {/* Active Translation Form */}
          {translations[activeTab] && (
            <div className="p-3 bg-white dark:bg-navy-850 rounded border border-slate-200 dark:border-navy-700 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Input
                  label={`Localized Title (${translations[activeTab].languageCode.toUpperCase()})`}
                  placeholder="Translated headline..."
                  value={translations[activeTab].title}
                  onChange={(e) => handleUpdate(activeTab, 'title', e.target.value)}
                />
                <Input
                  label="Localized Slug"
                  placeholder="translated-slug"
                  value={translations[activeTab].slug}
                  onChange={(e) => handleUpdate(activeTab, 'slug', e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Localized Summary
                </label>
                <textarea
                  rows={2}
                  className="w-full p-2 text-xs rounded border border-slate-200 dark:border-navy-700 bg-slate-50 dark:bg-navy-900 text-slate-900 dark:text-white focus:outline-none focus:border-editorial-red"
                  placeholder="Brief summary in this locale..."
                  value={translations[activeTab].summary || ''}
                  onChange={(e) => handleUpdate(activeTab, 'summary', e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Localized Full Article Content
                </label>
                <textarea
                  rows={6}
                  className="w-full p-2 text-xs font-mono rounded border border-slate-200 dark:border-navy-700 bg-slate-50 dark:bg-navy-900 text-slate-900 dark:text-white focus:outline-none focus:border-editorial-red leading-relaxed"
                  placeholder="Enter full localized article text or HTML..."
                  value={translations[activeTab].content || ''}
                  onChange={(e) => handleUpdate(activeTab, 'content', e.target.value)}
                />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
