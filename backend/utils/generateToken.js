import jwt from 'jsonwebtoken';

const generateToken = (id, name, isAdmin) => {
  if (isAdmin) {
    return jwt.sign({ id, name, isAdmin }, process.env.JWT_SECRET, {
      expiresIn: '30d',
    });
  } else {
    return jwt.sign({ id, name }, process.env.JWT_SECRET, {
      expiresIn: '30d',
    });
  }
};

export default generateToken;
