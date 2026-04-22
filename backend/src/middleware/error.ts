import { ErrorRequestHandler } from 'express';
import { ZodError } from 'zod';
import { HttpError } from '../lib/errors';
import { logger } from '../lib/logger';

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof ZodError) {
    res.status(400).json({ error: 'VALIDATION_ERROR', issues: err.flatten() });
    return;
  }
  if (err instanceof HttpError) {
    res.status(err.status).json({ error: err.code ?? 'ERROR', message: err.message, meta: err.meta });
    return;
  }
  logger.error({ err }, 'unhandled error');
  res.status(500).json({ error: 'SERVER_ERROR', message: 'Something went wrong' });
};
