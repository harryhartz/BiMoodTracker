import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { User } from '@shared/schema';

// JWT secret - in production, this should be in an environment variable
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

/**
 * Generate a JWT token for a user
 */
export const generateToken = (userId: number): string => {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '7d' });
};

/**
 * Verify a JWT token
 */
export const verifyToken = (token: string): { userId: number } | null => {
  try {
    return jwt.verify(token, JWT_SECRET) as { userId: number };
  } catch (error) {
    return null;
  }
};

/**
 * Hash a password
 */
export const hashPassword = async (password: string): Promise<string> => {
  return bcrypt.hash(password, 10);
};

/**
 * Compare a password with a hashed password
 */
export const comparePassword = async (password: string, hashedPassword: string): Promise<boolean> => {
  return bcrypt.compare(password, hashedPassword);
};

/**
 * Format user for response (omit sensitive data)
 */
export const formatUserResponse = (user: User, token: string) => {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    token
  };
};