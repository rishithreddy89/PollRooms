import { Request, Response, NextFunction } from 'express';
import { createPoll, getAllPolls, getPollById } from '../services/pollService';
import { createPollSchema } from '../validators/pollValidators';

export const createPollController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const validatedData = createPollSchema.parse(req.body);
    const poll = await createPoll(validatedData);
    res.status(201).json(poll);
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return res.status(400).json({ error: 'Validation error', details: error.errors });
    }
    next(error);
  }
};

export const getAllPollsController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const polls = await getAllPolls();
    res.json(polls);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch polls' });
  }
};

export const getPollController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const poll = await getPollById(id);
    
    if (!poll) {
      return res.status(404).json({ error: 'Poll not found' });
    }
    
    res.json(poll);
  } catch (error) {
    next(error);
  }
};
