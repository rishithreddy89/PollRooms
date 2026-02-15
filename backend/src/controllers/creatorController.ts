import { Request, Response, NextFunction } from 'express';
import { getPollsByCreator, getPollStats } from '../services/creatorService';

export const getCreatorDashboard = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { creatorToken } = req.params;
    
    if (!creatorToken) {
      return res.status(400).json({ error: 'Creator token required' });
    }

    const polls = await getPollsByCreator(creatorToken);
    res.json(polls);
  } catch (error) {
    next(error);
  }
};

export const getPollStatsController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id: pollId } = req.params;
    const stats = await getPollStats(pollId);
    res.json(stats);
  } catch (error: any) {
    if (error.message === 'POLL_NOT_FOUND') {
      return res.status(404).json({ error: 'Poll not found' });
    }
    next(error);
  }
};
