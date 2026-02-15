import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  },
  withCredentials: true
});

export interface Poll {
  id: string;
  question: string;
  creatorToken?: string;
  expiresAt: string;
  isActive: boolean;
  totalVotes: number;
  createdAt: string;
  options: Option[];
}

export interface Option {
  id: string;
  pollId: string;
  text: string;
  voteCount: number;
}

export interface CreatePollData {
  question: string;
  options: string[];
  expiresAt: string;
}

export const createPoll = async (data: CreatePollData): Promise<Poll> => {
  const response = await api.post('/api/polls', data);
  return response.data;
};

export const getPoll = async (id: string): Promise<Poll> => {
  const response = await api.get(`/api/polls/${id}`);
  return response.data;
};

export const votePoll = async (pollId: string, optionId: string): Promise<Poll> => {
  const response = await api.post(`/api/polls/${pollId}/vote`, { optionId });
  return response.data;
};

export const checkVoteStatus = async (pollId: string): Promise<{ hasVoted: boolean }> => {
  const response = await api.get(`/api/polls/${pollId}/vote-status`);
  return response.data;
};

export const getCreatorPolls = async (creatorToken: string): Promise<Poll[]> => {
  const response = await api.get(`/api/creator/${creatorToken}`);
  return response.data;
};

export const getPollStats = async (pollId: string): Promise<Poll> => {
  const response = await api.get(`/api/polls/${pollId}/stats`);
  return response.data;
};
