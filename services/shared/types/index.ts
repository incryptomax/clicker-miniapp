export interface ClickResponse {
  myClicks: number;
  globalClicks: number;
}

export interface LeaderboardEntry {
  rank: number;
  username: string;
  clicks: number;
  tgUserId: string;
}

export class RateLimitError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'RateLimitError';
  }
}
