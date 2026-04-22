import { customAlphabet } from 'nanoid';

const alphaNum = '0123456789ABCDEFGHJKLMNPQRSTUVWXYZ'; // no I/O
export const newReferralCode = customAlphabet(alphaNum, 8);
export const newShortId = customAlphabet(alphaNum, 10);
