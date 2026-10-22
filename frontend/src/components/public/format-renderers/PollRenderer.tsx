import React, { useState } from 'react';
import { useAuth } from '../../../hooks/useAuth';
import { apiClient } from '../../../services/apiClient';
import { PollDetails, PollOption, PollVoteResult } from '../../../types';
import { CheckCircle2, Clock, Vote, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

interface PollRendererProps {
  postId: string;
  pollDetails?: PollDetails;
}

export const PollRenderer: React.FC<PollRendererProps> = ({ postId, pollDetails }) => {
  const { user } = useAuth();
  const [selectedOption, setSelectedOption] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasVoted, setHasVoted] = useState(false);
  const [votedOptionId, setVotedOptionId] = useState<string | null>(null);
  const [pollResults, setPollResults] = useState<PollVoteResult | null>(null);
  const [showResultsOnly, setShowResultsOnly] = useState(false);

  if (!pollDetails || !pollDetails.options || pollDetails.options.length === 0) {
    return null;
  }

  const now = new Date();
  const isExpired = pollDetails.endTime ? new Date(pollDetails.endTime) < now : false;
  const isUpcoming = pollDetails.startTime ? new Date(pollDetails.startTime) > now : false;
  const isClosed = isExpired || isUpcoming;

  // Calculate total votes from options or pollResults
  const totalVotes = pollResults
    ? pollResults.totalVotes
    : pollDetails.options.reduce((sum, opt) => sum + (opt.votes || 0), 0);

  const handleVote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOption || isClosed || submitting) return;
    if (!user) {
      setError('Please sign in to cast your vote.');
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const result = await apiClient.votePoll(postId, selectedOption);
      setPollResults(result);
      setHasVoted(true);
      setVotedOptionId(selectedOption);
    } catch (err: any) {
      setError(err?.message || 'Failed to submit vote. You may have already voted.');
      // If user already voted, load results
      if (err?.status === 409 || err?.message?.includes('already')) {
        setHasVoted(true);
        loadResults();
      }
    } finally {
      setSubmitting(false);
    }
  };

  const loadResults = async () => {
    try {
      const res = await apiClient.getPollResults(postId);
      setPollResults(res);
      setShowResultsOnly(true);
    } catch (err: any) {
      setError('Could not load poll results.');
    }
  };

  const displayResults = hasVoted || isClosed || showResultsOnly;

  return (
    <div className="my-8 rounded-2xl border border-gray-200 dark:border-gray-800 bg-gradient-to-br from-gray-50 to-white dark:from-gray-900 dark:to-gray-950 p-6 md:p-8 shadow-sm">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary-600 dark:text-primary-400">
          <Vote className="w-4 h-4" />
          <span>Interactive Reader Poll</span>
        </div>
        {isExpired && (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-400">
            <Clock className="w-3 h-3" /> Closed
          </span>
        )}
        {isUpcoming && (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400">
            <Clock className="w-3 h-3" /> Opens Soon
          </span>
        )}
      </div>

      <h3 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white font-serif mb-6 leading-snug">
        {pollDetails.question}
      </h3>

      {error && (
        <div className="mb-6 p-4 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 flex items-start gap-3 text-sm text-red-700 dark:text-red-300">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <div>{error}</div>
        </div>
      )}

      {/* Voting Form vs Results View */}
      {!displayResults ? (
        <form onSubmit={handleVote} className="space-y-3">
          {pollDetails.options.map((option: PollOption) => {
            const isChecked = selectedOption === option.id;
            return (
              <label
                key={option.id}
                className={`relative flex items-center p-4 rounded-xl border cursor-pointer transition-all duration-200 select-none ${
                  isChecked
                    ? 'border-primary-600 bg-primary-50/60 dark:border-primary-500 dark:bg-primary-950/30 text-primary-900 dark:text-primary-100 shadow-sm'
                    : 'border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900/60 text-gray-800 dark:text-gray-200 hover:border-gray-300 dark:hover:border-gray-700'
                }`}
              >
                <input
                  type="radio"
                  name="poll-option"
                  value={option.id}
                  checked={isChecked}
                  onChange={() => setSelectedOption(option.id)}
                  disabled={isClosed || submitting}
                  className="w-4 h-4 text-primary-600 border-gray-300 focus:ring-primary-500"
                />
                <span className="ml-3 text-base font-medium">{option.text}</span>
              </label>
            );
          })}

          <div className="flex flex-wrap items-center justify-between gap-4 pt-4">
            {user ? (
              <button
                type="submit"
                disabled={!selectedOption || submitting || isClosed}
                className="inline-flex items-center justify-center px-6 py-2.5 rounded-xl font-medium text-sm text-white bg-primary-600 hover:bg-primary-700 active:scale-95 disabled:opacity-50 disabled:pointer-events-none transition-all shadow-sm"
              >
                {submitting ? 'Submitting Vote...' : 'Submit Vote'}
              </button>
            ) : (
              <Link
                to="/login"
                className="inline-flex items-center justify-center px-6 py-2.5 rounded-xl font-medium text-sm text-white bg-primary-600 hover:bg-primary-700 transition-all shadow-sm"
              >
                Sign in to Vote
              </Link>
            )}

            <button
              type="button"
              onClick={loadResults}
              className="text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              View Current Results
            </button>
          </div>
        </form>
      ) : (
        /* Current Results View */
        <div className="space-y-4">
          <div className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
            Current Results Breakdown
          </div>
          {(pollResults ? pollResults.results : pollDetails.options).map((option: any) => {
            const votes = option.votes || 0;
            const pct =
              option.percentage !== undefined
                ? option.percentage
                : totalVotes > 0
                ? Math.round((votes / totalVotes) * 100)
                : 0;
            const isUserPick = votedOptionId === option.id;

            return (
              <div
                key={option.id}
                className={`p-4 rounded-xl border relative overflow-hidden transition-all ${
                  isUserPick
                    ? 'border-primary-500/80 bg-primary-50/30 dark:border-primary-500/50 dark:bg-primary-950/20'
                    : 'border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900/60'
                }`}
              >
                {/* Progress bar background */}
                <div
                  className={`absolute top-0 bottom-0 left-0 transition-all duration-700 ease-out rounded-xl ${
                    isUserPick
                      ? 'bg-primary-100/70 dark:bg-primary-900/40'
                      : 'bg-gray-100 dark:bg-gray-800/60'
                  }`}
                  style={{ width: `${pct}%` }}
                />

                <div className="relative z-10 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-2">
                    {isUserPick && (
                      <CheckCircle2 className="w-4 h-4 text-primary-600 dark:text-primary-400 flex-shrink-0" />
                    )}
                    <span
                      className={`text-sm md:text-base font-medium ${
                        isUserPick
                          ? 'text-primary-950 dark:text-primary-100 font-semibold'
                          : 'text-gray-900 dark:text-gray-100'
                      }`}
                    >
                      {option.text}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm font-semibold">
                    <span className="text-gray-900 dark:text-white">{pct}%</span>
                    <span className="text-xs text-gray-500 font-normal">({votes} votes)</span>
                  </div>
                </div>
              </div>
            );
          })}

          <div className="flex items-center justify-between pt-2 text-xs text-gray-500 dark:text-gray-400">
            <span>Total responses: {totalVotes.toLocaleString()}</span>
            {hasVoted && <span className="text-primary-600 dark:text-primary-400 font-medium">Thank you for voting!</span>}
          </div>
        </div>
      )}
    </div>
  );
};
