import { Request } from 'express';

declare global {
  namespace Express {
    interface Request {
      user?: {
        tgUserId: bigint;
        username: string;
      };
    }
  }
}
