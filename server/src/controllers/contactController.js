import ContactEnquiry from '../models/ContactEnquiry.js';
import { ApiError } from '../utils/ApiError.js';

export async function createEnquiry(req, res) {
  const { name, email, enquiryType, interest, productReference, message } = req.body;
  const enquiry = await ContactEnquiry.create({ name, email, enquiryType, interest, productReference, message });
  res.status(201).json({
    message: 'Thank you for getting in touch. Jackie will reply to you by email as soon as possible.',
    id: enquiry._id,
  });
}

export async function listEnquiries(req, res) {
  const filter = {};
  if (typeof req.query.status === 'string' && req.query.status) filter.status = req.query.status;
  const enquiries = await ContactEnquiry.find(filter).sort({ createdAt: -1 }).limit(500);
  res.json({ enquiries });
}

export async function getEnquiry(req, res) {
  const enquiry = await ContactEnquiry.findById(req.params.id);
  if (!enquiry) throw ApiError.notFound('Enquiry not found');
  res.json({ enquiry });
}

export async function updateEnquiry(req, res) {
  const enquiry = await ContactEnquiry.findById(req.params.id);
  if (!enquiry) throw ApiError.notFound('Enquiry not found');
  if (req.body.status !== undefined) enquiry.status = req.body.status;
  if (req.body.adminNotes !== undefined) enquiry.adminNotes = req.body.adminNotes;
  await enquiry.save();
  res.json({ enquiry });
}

export async function deleteEnquiry(req, res) {
  const enquiry = await ContactEnquiry.findByIdAndDelete(req.params.id);
  if (!enquiry) throw ApiError.notFound('Enquiry not found');
  res.status(204).end();
}
