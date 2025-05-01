import { withAuth } from './withAuth.js'; // tambahkan .js jika tidak pakai TypeScript

export const withRole = (role) => {
  return (handler) => {
    return withAuth((req, res) => {
      if (req.user.role !== role) {
        return res.status(403).json({ message: 'Forbidden: Access denied' });
      }
      return handler(req, res);
    });
  };
};
