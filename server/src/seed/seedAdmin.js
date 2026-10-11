import { assertEnv } from '../config/env.js';
import { connectDB, disconnectDB } from '../config/db.js';
import User from '../models/User.js';

assertEnv(['MONGODB_URI', 'ADMIN_EMAIL', 'ADMIN_PASSWORD']);

const email = process.env.ADMIN_EMAIL.trim().toLowerCase();
const password = process.env.ADMIN_PASSWORD;
const name = process.env.ADMIN_NAME?.trim() || 'Admin';

const strong = password.length >= 10 && /[a-z]/.test(password) && /[A-Z]/.test(password) && /\d/.test(password);
if (!/^\S+@\S+\.\S+$/.test(email)) {
  console.error('ADMIN_EMAIL is not a valid email address.');
  process.exit(1);
}
if (!strong) {
  console.error('ADMIN_PASSWORD must be at least 10 characters and include upper case, lower case and a number.');
  process.exit(1);
}

async function run() {
  await connectDB();
  let user = await User.findOne({ email }).select('+password');
  const isNew = !user;
  if (!user) user = new User({ email });
  user.name = name;
  user.password = password;
  user.role = 'admin';
  await user.save();
  console.log(`${isNew ? 'Created' : 'Updated'} administrator: ${email}`);
  console.log('Remove ADMIN_PASSWORD from your .env once you have signed in, if you prefer not to keep it on disk.');
}

run()
  .catch((error) => {
    console.error('Admin seeding failed:', error.message);
    process.exitCode = 1;
  })
  .finally(disconnectDB);
