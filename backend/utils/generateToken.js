import jwt from 'jsonwebtoken';

const generateToken = (id, name, isAdmin) => {
  if (isAdmin) {
    return jwt.sign({ id, name }, process.env.JWT_SECRET, {
      expiresIn: '1d',
    });
  } else {
    return jwt.sign({ id, name }, process.env.JWT_SECRET, {
      expiresIn: '60m',
    });
  }
};

export default generateToken;
