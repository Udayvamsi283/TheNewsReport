import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { apiClient } from '../services/apiClient';
import { Settings, Globe, Check, AlertCircle, Sparkles } from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const { user, isLoading: authLoading, refreshUser } = useAuth();
  const [preferredLanguage, setPreferredLanguage] = useState<string>('');
  const [interests, setInterests] = useState<string[]>([]);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { data: languages = [] } = useQuery({
    queryKey: ['languages'],
    queryFn: () => apiClient.getLanguages()
  });

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: () => apiClient.getCategories()
  });

  useEffect(() => {
    if (user) {
      if (user.preferredLanguage) {
        setPreferredLanguage(
          typeof user.preferredLanguage === 'string'
            ? user.preferredLanguage
            : (user.preferredLanguage as any)._id
        );
      }
      if (user.interests && Array.isArray(user.interests)) {
        setInterests(
          user.interests.map((cat: any) => (typeof cat === 'string' ? cat : cat._id))
        );
      }
    }
  }, [user]);

  const updateMutation = useMutation({
    mutationFn: () =>
      apiClient.updatePreferences({
        preferredLanguage: preferredLanguage || undefined,
        interests
      }),
    onSuccess: async () => {
      setSuccessMessage('Your reading preferences and feed topics have been updated.');
      setErrorMessage(null);
      if (refreshUser) {
        await refreshUser();
      }
    },
    onError: (err: any) => {
      setErrorMessage(err?.message || 'Failed to update preferences.');
      setSuccessMessage(null);
    }
  });

  if (authLoading) {
    return <div className="py-20 text-center text-gray-500">Loading settings...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const toggleInterest = (categoryId: string) => {
    setInterests((prev) =>
      prev.includes(categoryId)
        ? prev.filter((id) => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate();
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="pb-6 border-b border-gray-200 dark:border-gray-800 mb-8">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-editorial-red dark:text-editorial-red-dark mb-2">
          <Settings className="w-4 h-4" />
          <span>Reader Preferences</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black font-serif text-gray-950 dark:text-white">
          Reading & Feed Settings
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Customize your default edition language and personalized feed topic topics.
        </p>
      </div>

      {successMessage && (
        <div className="mb-6 p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex items-center gap-3 text-sm text-emerald-800 dark:text-emerald-300">
          <Check className="w-5 h-5 flex-shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="mb-6 p-4 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 flex items-center gap-3 text-sm text-red-800 dark:text-red-300">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-8">
        {/* Preferred Language */}
        <div className="rounded-2xl p-6 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-sm space-y-4">
          <div className="flex items-center gap-2 text-base font-bold text-gray-900 dark:text-white">
            <Globe className="w-5 h-5 text-editorial-red" />
            <span>Default Reading Language</span>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            When available, articles and headlines will automatically display in your chosen language.
          </p>

          <select
            value={preferredLanguage}
            onChange={(e) => setPreferredLanguage(e.target.value)}
            className="w-full sm:w-80 px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm font-medium text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-editorial-red focus:outline-none"
          >
            <option value="">System Default (English)</option>
            {languages.map((lang) => (
              <option key={lang._id} value={lang._id}>
                {lang.name} ({lang.code.toUpperCase()})
              </option>
            ))}
          </select>
        </div>

        {/* Category Interests for Personalization */}
        <div className="rounded-2xl p-6 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-sm space-y-4">
          <div className="flex items-center gap-2 text-base font-bold text-gray-900 dark:text-white">
            <Sparkles className="w-5 h-5 text-amber-500" />
            <span>Topic Interests (Feed Personalization)</span>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Select the journalistic beats that matter most to you. Your &quot;For You&quot; feed will prioritize dispatches matching these categories.
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
            {categories.map((cat) => {
              const catId = cat._id || cat.id || '';
              const isSelected = interests.includes(catId);
              return (
                <button
                  key={catId}
                  type="button"
                  onClick={() => toggleInterest(catId)}
                  className={`p-3 rounded-xl border text-xs font-semibold flex items-center justify-between transition-all select-none ${
                    isSelected
                      ? 'border-editorial-red bg-editorial-red/10 text-navy-900 dark:bg-editorial-red/20 dark:text-white dark:border-editorial-red-dark shadow-sm'
                      : 'border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/40 text-gray-700 dark:text-gray-300 hover:border-gray-300'
                  }`}
                >
                  <span className="truncate">{cat.name}</span>
                  {isSelected && <Check className="w-4 h-4 text-editorial-red dark:text-editorial-red-dark flex-shrink-0 ml-1" />}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex justify-end pt-4">
          <button
            type="submit"
            disabled={updateMutation.isPending}
            className="px-6 py-2.5 rounded-xl font-bold text-sm text-white bg-navy-900 hover:bg-navy-800 dark:bg-white dark:text-navy-950 dark:hover:bg-slate-100 active:scale-95 disabled:opacity-50 transition-all shadow-md"
          >
            {updateMutation.isPending ? 'Saving Preferences...' : 'Save Preferences'}
          </button>
        </div>
      </form>
    </div>
  );
};
