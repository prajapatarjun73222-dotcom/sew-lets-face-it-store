import User from '../models/User.js';
import { signToken } from '../middleware/auth.js';
import { ApiError } from '../utils/ApiError.js';

export async function login(req, res) {
  const { email, password } = req.body;
  const user = await User.findOne({ email }).select('+password');
  const valid = user ? await user.comparePassword(password) : false;
  if (!valid) throw ApiError.unauthorized('Incorrect email or password');

  res.json({ token: signToken(user), user: user.toJSON() });
}

export async function me(req, res) {
  res.json({ user: req.user.toJSON() });
}
