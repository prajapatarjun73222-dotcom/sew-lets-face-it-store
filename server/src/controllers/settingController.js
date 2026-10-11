import Setting from '../models/Setting.js';

const FIELDS = ['brandName', 'brandDescription', 'contactEmail', 'announcement'];
const SOCIAL_FIELDS = ['instagram', 'facebook', 'etsy', 'website'];
const IMAGE_FIELDS = ['story', 'custom', 'banner'];
const IMAGE_LIST_FIELDS = ['hero', 'instagram'];

export async function getSettings(_req, res) {
  const settings = await Setting.getSingleton();
  res.json({ settings });
}

export async function updateSettings(req, res) {
  const settings = await Setting.getSingleton();
  for (const field of FIELDS) {
    if (req.body[field] !== undefined) settings[field] = req.body[field];
  }
  if (req.body.social && typeof req.body.social === 'object') {
    for (const field of SOCIAL_FIELDS) {
      if (req.body.social[field] !== undefined) settings.social[field] = req.body.social[field];
    }
  }
  if (req.body.images && typeof req.body.images === 'object') {
    for (const field of IMAGE_FIELDS) {
      if (req.body.images[field] !== undefined) settings.images[field] = req.body.images[field];
    }
    for (const field of IMAGE_LIST_FIELDS) {
      if (Array.isArray(req.body.images[field])) settings.images[field] = req.body.images[field].filter(Boolean);
    }
  }
  await settings.save();
  res.json({ settings });
}
