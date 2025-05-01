import { verifyToken } from '../auth.js'; // pastikan ada .js jika tidak pakai TypeScript

export const withAuth = (handler) => {
  return async (req, res) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Unauthorized: No token' });
    }

    const token = authHeader.split(' ')[1];

    try {
      const decoded = verifyToken(token);
      req.user = decoded;
      return handler(req, res);
    } catch (err) {
      const isExpired = err.message === 'Token sudah kedaluwarsa';
      const isInvalid = err.message === 'Token tidak valid';

      return res.status(401).json({
        message: isExpired || isInvalid ? `Unauthorized: ${err.message}` : 'Unauthorized: Invalid token',
      });
    }
  };
};
