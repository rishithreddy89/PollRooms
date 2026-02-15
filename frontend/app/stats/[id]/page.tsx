'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getPollStats, Poll } from '@/lib/api';
import { initSocket, getSocket } from '@/lib/socket';
import { formatDistanceToNow, format } from 'date-fns';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import Link from 'next/link';

export default function StatsPage() {
  const params = useParams();
  const router = useRouter();
  const pollId = params.id as string;

  const [poll, setPoll] = useState<Poll | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!pollId) return;

    const fetchStats = async () => {
      try {
        const stats = await getPollStats(pollId);
        setPoll(stats);
      } catch (err: any) {
        if (err.response?.status === 404) {
          setError('Poll not found');
        } else {
          setError('Failed to load stats');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchStats();

    const socket = initSocket();
    socket.emit('join-poll', pollId);

    socket.on('poll-update', (updatedPoll: Poll) => {
      setPoll(updatedPoll);
    });

    socket.on('poll-closed', () => {
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

  const copyLink = () => {
    const url = `${window.location.origin}/poll/${pollId}`;
    navigator.clipboard.writeText(url);
  };

  if (loading) {
    return (
      <main className="min-h-screen py-12 px-4 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-700">Loading statistics...</p>
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
            Go back home
          </Link>
        </div>
      </main>
    );
  }

  if (!poll) return null;

  const isExpired = new Date(poll.expiresAt) < new Date();
  const timeRemaining = isExpired
    ? 'Expired'
    : formatDistanceToNow(new Date(poll.expiresAt), { addSuffix: true });

  const chartData = poll.options.map((option) => ({
    name: option.text.length > 20 ? option.text.substring(0, 20) + '...' : option.text,
    votes: option.voteCount,
    percentage: poll.totalVotes > 0 ? ((option.voteCount / poll.totalVotes) * 100).toFixed(1) : '0'
  }));

  const COLORS = ['#8b5cf6', '#ec4899', '#06b6d4', '#10b981', '#f59e0b', '#ef4444'];

  return (
    <main className="min-h-screen py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <Link
            href="/dashboard"
            className="text-purple-600 hover:text-purple-700 text-sm font-medium transition"
          >
            ← Back to Dashboard
          </Link>
        </div>

        <div className="glass-light rounded-2xl shadow-xl border border-gray-200 p-8 backdrop-blur-xl mb-6">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-6">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 mb-3">{poll.question}</h1>
              <div className="flex flex-wrap gap-3">
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                  poll.isActive && !isExpired
                    ? 'bg-green-100 text-green-700 border border-green-300'
                    : 'bg-gray-100 text-gray-700 border border-gray-300'
                }`}>
                  {poll.isActive && !isExpired ? 'Active' : 'Closed'}
                </span>
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-purple-100 text-purple-700 border border-purple-300">
                  {poll.totalVotes} {poll.totalVotes === 1 ? 'Vote' : 'Votes'}
                </span>
              </div>
            </div>
            <button
              onClick={copyLink}
              className="px-6 py-3 bg-purple-100 hover:bg-purple-200 text-purple-700 border border-purple-300 font-medium rounded-xl transition"
            >
              📋 Share Poll
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
              <p className="text-gray-600 text-sm mb-1">Total Votes</p>
              <p className="text-3xl font-bold text-gray-900">{poll.totalVotes}</p>
            </div>
            <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
              <p className="text-gray-600 text-sm mb-1">Created</p>
              <p className="text-lg font-semibold text-gray-900">
                {format(new Date(poll.createdAt), 'MMM d, yyyy')}
              </p>
            </div>
            <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
              <p className="text-gray-600 text-sm mb-1">Status</p>
              <p className={`text-lg font-semibold ${isExpired ? 'text-gray-700' : 'text-green-700'}`}>
                {timeRemaining}
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="glass-light rounded-2xl shadow-xl border border-gray-200 p-8 backdrop-blur-xl">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Vote Distribution</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="name" stroke="#64748b" />
                <YAxis stroke="#64748b" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    color: '#1e293b'
                  }}
                />
                <Bar dataKey="votes" radius={[8, 8, 0, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="glass-light rounded-2xl shadow-xl border border-gray-200 p-8 backdrop-blur-xl">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Detailed Results</h2>
            <div className="space-y-4">
              {poll.options.map((option, index) => {
                const percentage = poll.totalVotes > 0
                  ? ((option.voteCount / poll.totalVotes) * 100)
                  : 0;

                return (
                  <div key={option.id} className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-semibold text-gray-900">{option.text}</span>
                      <span className="text-purple-600 font-bold">{percentage.toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500 ease-out"
                        style={{
                          width: `${percentage}%`,
                          background: COLORS[index % COLORS.length]
                        }}
                      />
                    </div>
                    <p className="text-sm text-gray-600 mt-2">
                      {option.voteCount} {option.voteCount === 1 ? 'vote' : 'votes'}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="mt-6 text-center">
          <Link
            href={`/poll/${poll.id}`}
            className="inline-block text-purple-600 hover:text-purple-700 transition font-medium"
          >
            View voting page →
          </Link>
        </div>
      </div>
    </main>
  );
}
