import { Request, Response, NextFunction } from 'express';
import { castVote, hasVoted } from '../services/pollService';
import { voteSchema } from '../validators/pollValidators';
import { getClientIp } from '../utils/ipHelper';

export const voteController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id: pollId } = req.params;
    const validatedData = voteSchema.parse(req.body);
    const voterIp = getClientIp(req);

    const alreadyVoted = await hasVoted(pollId, voterIp);
    if (alreadyVoted) {
      return res.status(409).json({ error: 'You have already voted in this poll' });
    }

    const updatedPoll = await castVote(pollId, validatedData.optionId, voterIp);
    res.json(updatedPoll);
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return res.status(400).json({ error: 'Validation error', details: error.errors });
    }
    if (error.message === 'ALREADY_VOTED') {
      return res.status(409).json({ error: 'You have already voted in this poll' });
    }
    if (error.message === 'POLL_EXPIRED' || error.message === 'POLL_CLOSED') {
      return res.status(403).json({ error: 'This poll has ended' });
    }
    if (error.message === 'POLL_NOT_FOUND') {
      return res.status(404).json({ error: 'Poll not found' });
    }
    next(error);
  }
};

export const checkVoteStatusController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id: pollId } = req.params;
    const voterIp = getClientIp(req);
    const voted = await hasVoted(pollId, voterIp);
    res.json({ hasVoted: voted });
  } catch (error) {
    next(error);
  }
};
