import bcrypt from 'bcryptjs';

const users = [
  {
    name: 'Admin User',
    email: 'admin@example.com',
    phone:'9716438285',
    password: bcrypt.hashSync('123456', 10),
    isAdmin: true,
  },
  {
    name: 'dg',
    email: 'dg@example.com',
    phone:'9716438286',
    password: bcrypt.hashSync('123456', 10),
  },
  {
    name: 'dg2',
    email: 'dg2@example.com',
    phone:'9716438287',
    password: bcrypt.hashSync('123456', 10),
  },
];

export default users;
