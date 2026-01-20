import { randomBytes } from 'crypto';

export function generateUId(companyName = 'FABS'): string {
  const getPrefix = (name: string): string => {
    const clean = name.replace(/[^a-zA-Z]/g, '');
    return clean.slice(0, 4).toUpperCase() || 'FABS';
  };

  const prefix = getPrefix(companyName);
  const random = randomBytes(4).toString('hex').slice(0, 8).toUpperCase();

  return `${random}${prefix}`;
}
