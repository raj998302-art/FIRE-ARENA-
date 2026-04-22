export class HttpError extends Error {
  constructor(public status: number, message: string, public code?: string, public meta?: any) {
    super(message);
  }
}

export const badRequest = (m: string, code = 'BAD_REQUEST') => new HttpError(400, m, code);
export const unauthorized = (m = 'Unauthorized') => new HttpError(401, m, 'UNAUTHORIZED');
export const forbidden = (m = 'Forbidden') => new HttpError(403, m, 'FORBIDDEN');
export const notFound = (m = 'Not found') => new HttpError(404, m, 'NOT_FOUND');
export const conflict = (m: string) => new HttpError(409, m, 'CONFLICT');
export const tooMany = (m = 'Too many requests') => new HttpError(429, m, 'RATE_LIMITED');
export const serverError = (m = 'Server error') => new HttpError(500, m, 'SERVER_ERROR');
