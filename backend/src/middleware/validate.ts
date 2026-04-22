import { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';

export const validate = (schema: ZodSchema, source: 'body' | 'query' | 'params' = 'body') =>
  (req: Request, _res: Response, next: NextFunction): void => {
    const parsed = schema.safeParse((req as any)[source]);
    if (!parsed.success) return next(parsed.error);
    (req as any)[source] = parsed.data;
    next();
  };
