import jwt from 'jsonwebtoken';

const generateToken = (id, name) => {
  return jwt.sign({ id, name }, process.env.JWT_SECRET, {
    expiresIn: '60m',
  });
};

export default generateToken;
