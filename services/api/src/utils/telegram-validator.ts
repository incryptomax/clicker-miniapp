import * as crypto from 'crypto';

export interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
  is_premium?: boolean;
}

export interface TelegramWebAppData {
  user?: TelegramUser;
  query_id?: string;
  auth_date: number;
  hash: string;
}

export class TelegramWebAppValidator {
  private static readonly BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '';

  /**
   * Validates Telegram WebApp initData
   * @param initData Raw init data from Telegram WebApp
   * @returns Parsed and validated data or null if invalid
   */
  static validateInitData(initData: string): TelegramWebAppData | null {
    try {
      if (!initData) {
        return null;
      }

      // Parse the init data
      const urlParams = new URLSearchParams(initData);
      const hash = urlParams.get('hash');
      
      if (!hash) {
        return null;
      }

      // Remove hash from params for validation
      urlParams.delete('hash');
      
      // Sort parameters alphabetically
      const sortedParams = Array.from(urlParams.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, value]) => `${key}=${value}`)
        .join('\n');

      // Create secret key
      const secretKey = crypto
        .createHmac('sha256', 'WebAppData')
        .update(this.BOT_TOKEN)
        .digest();

      // Calculate hash
      const calculatedHash = crypto
        .createHmac('sha256', secretKey)
        .update(sortedParams)
        .digest('hex');

      // Verify hash
      if (calculatedHash !== hash) {
        console.log('Hash verification failed');
        return null;
      }

      // Parse user data
      const userParam = urlParams.get('user');
      let user: TelegramUser | undefined;
      
      if (userParam) {
        try {
          user = JSON.parse(userParam);
        } catch (e) {
          console.log('Failed to parse user data:', e);
          return null;
        }
      }

      // Check auth_date (should be within last 24 hours)
      const authDate = parseInt(urlParams.get('auth_date') || '0', 10);
      const now = Math.floor(Date.now() / 1000);
      
      if (now - authDate > 86400) { // 24 hours
        console.log('Auth date too old');
        return null;
      }

      return {
        user,
        query_id: urlParams.get('query_id') || undefined,
        auth_date: authDate,
        hash
      };
    } catch (error) {
      console.log('Error validating init data:', error);
      return null;
    }
  }

  /**
   * Extracts user data from validated init data
   * @param validatedData Validated Telegram WebApp data
   * @returns User data or null
   */
  static extractUser(validatedData: TelegramWebAppData | null): TelegramUser | null {
    return validatedData?.user || null;
  }
}
