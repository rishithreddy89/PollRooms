'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getPoll, votePoll, checkVoteStatus, Poll } from '@/lib/api';
import { initSocket } from '@/lib/socket';
import { formatDistanceToNow } from 'date-fns';
import Link from 'next/link';

export default function PollPage() {
  const params = useParams();
  const router = useRouter();
  const pollId = params.id as string;

  const [poll, setPoll] = useState<Poll | null>(null);
  const [loading, setLoading] = useState(true);
  const [voting, setVoting] = useState(false);
  const [error, setError] = useState('');
  const [hasVoted, setHasVoted] = useState(false);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [pollClosed, setPollClosed] = useState(false);

  useEffect(() => {
    if (!pollId) return;

    const fetchPoll = async () => {
      try {
        const [pollData, voteStatus] = await Promise.all([
          getPoll(pollId),
          checkVoteStatus(pollId)
        ]);
        setPoll(pollData);
        setHasVoted(voteStatus.hasVoted);

        const localVoted = localStorage.getItem(`voted_${pollId}`);
        if (localVoted) {
          setHasVoted(true);
        }

        const isExpired = new Date(pollData.expiresAt) < new Date();
        if (isExpired || !pollData.isActive) {
          setPollClosed(true);
        }
      } catch (err: any) {
        if (err.response?.status === 404) {
          setError('Poll not found');
        } else {
          setError('Failed to load poll');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchPoll();

    const socket = initSocket();
    socket.emit('join-poll', pollId);

    socket.on('poll-update', (updatedPoll: Poll) => {
      setPoll(updatedPoll);
    });

    socket.on('poll-closed', () => {
      setPollClosed(true);
      if (poll) {
        setPoll({ ...poll, isActive: false });
      }
    });

    return () => {
      socket.emit('leave-poll', pollId);
      socket.off('poll-update');
      socket.off('poll-closed');
    };
  }, [pollId]);

  const handleVote = async (optionId: string) => {
    if (hasVoted || voting || pollClosed) return;

    setVoting(true);
    setError('');

    try {
      const updatedPoll = await votePoll(pollId, optionId);
      setPoll(updatedPoll);
      setHasVoted(true);
      setSelectedOption(optionId);
      localStorage.setItem(`voted_${pollId}`, 'true');
    } catch (err: any) {
      if (err.response?.status === 409) {
        setError('You have already voted in this poll');
        setHasVoted(true);
      } else if (err.response?.status === 403) {
        setError('This poll has ended');
        setPollClosed(true);
      } else {
        setError(err.response?.data?.error || 'Failed to cast vote');
      }
    } finally {
      setVoting(false);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen py-12 px-4 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-700">Loading poll...</p>
        </div>
      </main>
    );
  }

  if (error && !poll) {
    return (
      <main className="min-h-screen py-12 px-4 flex items-center justify-center">
        <div className="text-center">
          <div className="bg-red-50 border border-red-300 text-red-700 px-6 py-4 rounded-xl inline-block mb-4">
            {error}
          </div>
          <br />
          <Link href="/" className="text-purple-600 hover:text-purple-700 font-medium">
            Create a new poll
          </Link>
        </div>
      </main>
    );
  }

  if (!poll) return null;

  const totalVotes = poll.totalVotes || poll.options.reduce((sum, opt) => sum + opt.voteCount, 0);
  const isExpired = new Date(poll.expiresAt) < new Date();
  const timeRemaining = isExpired
    ? 'Expired'
    : formatDistanceToNow(new Date(poll.expiresAt), { addSuffix: true });

  return (
    <main className="min-h-screen py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="mb-6">
          <Link
            href="/"
            className="text-purple-600 hover:text-purple-700 text-sm font-medium transition"
          >
            ← Create New Poll
          </Link>
        </div>

        <div className="glass-light rounded-2xl shadow-xl border border-gray-200 p-8 backdrop-blur-xl">
          <div className="flex items-start justify-between mb-4">
            <h1 className="text-3xl font-bold text-gray-900 flex-1">{poll.question}</h1>
            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
              poll.isActive && !isExpired && !pollClosed
                ? 'bg-green-100 text-green-700 border border-green-300'
                : 'bg-gray-100 text-gray-700 border border-gray-300'
            }`}>
              {poll.isActive && !isExpired && !pollClosed ? 'Active' : 'Closed'}
            </span>
          </div>
          
          <p className="text-gray-600 text-sm mb-6">
            {totalVotes} {totalVotes === 1 ? 'vote' : 'votes'} · {timeRemaining}
          </p>

          {(hasVoted || pollClosed) && (
            <div className={`border px-4 py-3 rounded-xl mb-6 ${
              pollClosed
                ? 'bg-gray-100 border-gray-300 text-gray-700'
                : 'bg-blue-50 border-blue-300 text-blue-700'
            }`}>
              {pollClosed ? 'This poll has ended' : "You've already voted in this poll"}
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-300 text-red-700 px-4 py-3 rounded-xl mb-6">
              {error}
            </div>
          )}

          <div className="space-y-4">
            {poll.options.map((option) => {
              const percentage = totalVotes > 0 ? (option.voteCount / totalVotes) * 100 : 0;
              const isSelected = selectedOption === option.id;

              return (
                <div key={option.id}>
                  {hasVoted || pollClosed ? (
                    <div className={`relative border-2 rounded-xl p-4 overflow-hidden ${
                      isSelected 
                        ? 'border-purple-400 bg-purple-50' 
                        : 'border-gray-300 bg-gray-50'
                    }`}>
                      <div className="relative z-10 flex justify-between items-center mb-2">
                        <span className="font-semibold text-gray-900">{option.text}</span>
                        <span className="text-sm font-bold text-purple-600">
                          {percentage.toFixed(1)}%
                        </span>
                      </div>
                      <div className="relative z-10 text-sm text-gray-600 mb-2">
                        {option.voteCount} {option.voteCount === 1 ? 'vote' : 'votes'}
                      </div>
                      <div 
                        className="absolute inset-0 bg-gradient-to-r from-purple-200 to-pink-200 transition-all duration-500 ease-out"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  ) : (
                    <button
                      onClick={() => handleVote(option.id)}
                      disabled={voting}
                      className="w-full text-left border-2 border-gray-300 hover:border-purple-400 bg-white hover:bg-purple-50 rounded-xl p-4 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02]"
                    >
                      <span className="font-semibold text-gray-900">{option.text}</span>
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          {!hasVoted && !pollClosed && (
            <p className="text-center text-gray-600 text-sm mt-6">
              Select an option to vote
            </p>
          )}
        </div>

        <div className="mt-6 text-center space-x-6">
          <button
            onClick={() => {
              const url = window.location.href;
              navigator.clipboard.writeText(url);
            }}
            className="text-sm text-gray-600 hover:text-gray-800 transition"
          >
            📋 Copy poll link
          </button>
        </div>
      </div>
    </main>
  );
}
