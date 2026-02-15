'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getCreatorPolls, Poll } from '@/lib/api';
import { formatDistanceToNow } from 'date-fns';
import Link from 'next/link';

export default function DashboardPage() {
  const router = useRouter();
  const [polls, setPolls] = useState<Poll[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadPolls = async () => {
      try {
        const tokens = JSON.parse(localStorage.getItem('creatorTokens') || '[]');
        
        if (tokens.length === 0) {
          setLoading(false);
          return;
        }

        const uniqueTokens = [...new Set(tokens.map((t: any) => t.token))];
        const allPolls: Poll[] = [];

        for (const token of uniqueTokens) {
          try {
            const creatorPolls = await getCreatorPolls(token);
            allPolls.push(...creatorPolls);
          } catch (err) {
            // Token might be invalid, skip
          }
        }

        setPolls(allPolls);
      } catch (err) {
        setError('Failed to load polls');
      } finally {
        setLoading(false);
      }
    };

    loadPolls();
  }, []);

  if (loading) {
    return (
      <main className="min-h-screen py-12 px-4 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-700">Loading dashboard...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">My Polls</h1>
            <p className="text-gray-600">Manage and track your created polls</p>
          </div>
          <Link
            href="/"
            className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg"
          >
            Create New Poll
          </Link>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-300 text-red-700 px-4 py-3 rounded-xl mb-6">
            {error}
          </div>
        )}

        {polls.length === 0 ? (
          <div className="glass-light rounded-2xl shadow-xl border border-gray-200 p-12 text-center backdrop-blur-xl">
            <p className="text-gray-700 text-lg mb-4">You haven't created any polls yet</p>
            <Link
              href="/"
              className="inline-block text-purple-600 hover:text-purple-700 transition font-medium"
            >
              Create your first poll →
            </Link>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {polls.map((poll) => {
              const isExpired = new Date(poll.expiresAt) < new Date();
              const timeRemaining = isExpired
                ? 'Expired'
                : `Expires ${formatDistanceToNow(new Date(poll.expiresAt), { addSuffix: true })}`;

              return (
                <div
                  key={poll.id}
                  className="glass-light rounded-2xl shadow-lg border border-gray-200 p-6 backdrop-blur-xl hover:scale-105 transition-all duration-300 cursor-pointer"
                  onClick={() => router.push(`/stats/${poll.id}`)}
                >
                  <div className="flex justify-between items-start mb-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      poll.isActive && !isExpired
                        ? 'bg-green-100 text-green-700 border border-green-300'
                        : 'bg-gray-100 text-gray-700 border border-gray-300'
                    }`}>
                      {poll.isActive && !isExpired ? 'Active' : 'Closed'}
                    </span>
                  </div>

                  <h3 className="text-xl font-bold text-gray-900 mb-3 line-clamp-2">
                    {poll.question}
                  </h3>

                  <div className="space-y-2 text-sm text-gray-600">
                    <div className="flex justify-between">
                      <span>Total Votes:</span>
                      <span className="font-semibold text-purple-600">{poll.totalVotes}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Options:</span>
                      <span className="font-semibold">{poll.options.length}</span>
                    </div>
                    <div className="text-xs text-gray-500 mt-3">
                      {timeRemaining}
                    </div>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      router.push(`/stats/${poll.id}`);
                    }}
                    className="mt-4 w-full py-2 text-purple-600 hover:text-purple-700 border border-purple-300 hover:bg-purple-50 rounded-lg transition text-sm font-medium"
                  >
                    View Analytics
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
