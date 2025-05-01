import jwt from 'jsonwebtoken';

const SECRET = process.env.JWT_SECRET;

export const generateToken = (payload) => {
  return jwt.sign(payload, SECRET, { expiresIn: '24h' });
};

export const verifyToken = (token) => {
  try {
    return jwt.verify(token, SECRET);
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      throw new Error('Token sudah kedaluwarsa');
    }
    if (err.name === 'JsonWebTokenError') {
      throw new Error('Token tidak valid');
    }
    throw new Error('Token tidak dapat diverifikasi');
  }
};
