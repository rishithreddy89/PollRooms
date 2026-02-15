import { Request, Response, NextFunction } from 'express';

interface CustomError extends Error {
  status?: number;
  code?: string;
}

export const errorHandler = (
  err: CustomError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (res.headersSent) {
    return next(err);
  }

  const status = err.status || 500;
  const message = err.message || 'Internal server error';

  if (process.env.NODE_ENV === 'production') {
    res.status(status).json({
      error: status === 500 ? 'Internal server error' : message
    });
  } else {
    res.status(status).json({
      error: message,
      stack: err.stack
    });
  }
};
