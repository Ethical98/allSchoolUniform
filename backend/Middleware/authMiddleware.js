import jwt from 'jsonwebtoken';
import expressAsyncHandler from 'express-async-handler';
import User from '../models/UserModel.js';

function getTokenFromCookie(cookieString) {
  if (!cookieString) return null;
  const match = cookieString.match(/(?:^|;\s*)token=([^;]*)/);
  return match ? match[1] : null;
}

const protect = expressAsyncHandler(async (req, res, next) => {
  let token;

  // Get token from cookies
  if (req.headers.cookie) {
    try {
      token = getTokenFromCookie(req.headers.cookie);

      if (token) {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = await User.findById(decoded.id).select('-password');

        if (!req.user) {
          // User no longer exists - clear cookie
          res.clearCookie('token', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            path: '/',
          });
          res.status(401);
          throw new Error('User not found, please login again');
        }

        next();
      } else {
        throw new Error('Not Authorized, please login again!');
      }
    } catch (error) {
      console.log('[Auth] Token verification failed:', error.name, error.message);

      // Clear the invalid/expired cookie - options must match how cookie was set
      res.clearCookie('token', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        path: '/',
      });

      res.status(401);

      // Return specific error for expired tokens
      if (error.name === 'TokenExpiredError') {
        throw new Error('Session expired, please login again');
      }

      throw new Error('Not Authorized, please login again!');
    }
  } else {
    res.status(401);
    throw new Error('Not Authorized');
  }
});

// Optional auth - captures user if logged in, but doesn't require auth
const optionalAuth = expressAsyncHandler(async (req, res, next) => {
  let token;

  if (req.headers.cookie) {
    try {
      token = getTokenFromCookie(req.headers.cookie);

      if (token) {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = await User.findById(decoded.id).select('-password');
      }
    } catch (error) {
      // Token invalid or expired - continue without user
      req.user = null;
    }
  }

  next();
});

const isAdmin = (req, res, next) => {
  if (req.user && req.user.isAdmin) {
    next();
  } else {
    res.status(401);
    throw new Error('Not authorized as an Admin');
  }
};

// Export with both names for compatibility
export { protect, isAdmin, isAdmin as admin, optionalAuth };

