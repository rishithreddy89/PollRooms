'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createPoll } from '@/lib/api';
import Link from 'next/link';

export default function Home() {
  const router = useRouter();
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState(['', '']);
  const [expiresAt, setExpiresAt] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const addOption = () => {
    if (options.length < 10) {
      setOptions([...options, '']);
    }
  };

  const removeOption = (index: number) => {
    if (options.length > 2) {
      setOptions(options.filter((_, i) => i !== index));
    }
  };

  const updateOption = (index: number, value: string) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!question.trim()) {
      setError('Question is required');
      return;
    }

    const validOptions = options.filter(opt => opt.trim());
    if (validOptions.length < 2) {
      setError('At least 2 options are required');
      return;
    }

    if (!expiresAt) {
      setError('Expiration date is required');
      return;
    }

    const expirationDate = new Date(expiresAt);
    if (expirationDate <= new Date()) {
      setError('Expiration date must be in the future');
      return;
    }

    setLoading(true);

    try {
      const poll = await createPoll({
        question: question.trim(),
        options: validOptions,
        expiresAt: expirationDate.toISOString()
      });
      
      if (poll.creatorToken) {
        const tokens = JSON.parse(localStorage.getItem('creatorTokens') || '[]');
        tokens.push({ pollId: poll.id, token: poll.creatorToken, question: poll.question });
        localStorage.setItem('creatorTokens', JSON.stringify(tokens));
      }
      
      router.push(`/poll/${poll.id}`);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to create poll');
      setLoading(false);
    }
  };

  const minDateTime = new Date(Date.now() + 60000).toISOString().slice(0, 16);

  return (
    <main className="min-h-screen py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold mb-3 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            PollRooms
          </h1>
          <p className="text-gray-700 text-lg">Create real-time polls with live analytics</p>
          <Link 
            href="/dashboard" 
            className="inline-block mt-4 text-purple-600 hover:text-purple-700 text-sm transition font-medium"
          >
            View My Polls →
          </Link>
        </div>

        <div className="glass-light rounded-2xl shadow-xl border border-gray-200 p-8 backdrop-blur-xl">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="question" className="block text-sm font-medium text-gray-700 mb-2">
                Poll Question
              </label>
              <input
                id="question"
                type="text"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="What's your question?"
                className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
                disabled={loading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Options
              </label>
              <div className="space-y-3">
                {options.map((option, index) => (
                  <div key={index} className="flex gap-2">
                    <input
                      type="text"
                      value={option}
                      onChange={(e) => updateOption(index, e.target.value)}
                      placeholder={`Option ${index + 1}`}
                      className="flex-1 px-4 py-3 bg-white border border-gray-300 rounded-xl text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
                      disabled={loading}
                    />
                    {options.length > 2 && (
                      <button
                        type="button"
                        onClick={() => removeOption(index)}
                        className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-xl transition"
                        disabled={loading}
                      >
                        Remove
                      </button>
                    )}
                  </div>
                ))}
              </div>
              {options.length < 10 && (
                <button
                  type="button"
                  onClick={addOption}
                  className="mt-3 px-4 py-2 text-purple-600 hover:bg-purple-50 rounded-xl transition text-sm font-medium"
                  disabled={loading}
                >
                  + Add Option
                </button>
              )}
            </div>

            <div>
              <label htmlFor="expiresAt" className="block text-sm font-medium text-gray-700 mb-2">
                Expiration Date & Time
              </label>
              <input
                id="expiresAt"
                type="datetime-local"
                value={expiresAt}
                onChange={(e) => setExpiresAt(e.target.value)}
                min={minDateTime}
                className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl text-gray-900 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
                disabled={loading}
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-300 text-red-700 px-4 py-3 rounded-xl">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold py-3 px-4 rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02] shadow-lg"
            >
              {loading ? 'Creating...' : 'Create Poll'}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
