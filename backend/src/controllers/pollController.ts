import { Request, Response, NextFunction } from 'express';
import { createPoll, getPollById } from '../services/pollService';
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
