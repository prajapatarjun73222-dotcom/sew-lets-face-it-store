import { effectivePrice, formatPrice } from './format';

/** Jackie's WhatsApp number (E.164 without +). */
export const WHATSAPP_NUMBER = '447359367551';

export function buildWhatsAppUrl(message) {
  const text = encodeURIComponent(message.trim());
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${text}`;
}

export function generalEnquiryMessage() {
  return `Hi Jackie! I'd like to make an enquiry.`;
}

export function productEnquiryMessage(product, { variant } = {}) {
  const lines = [
    `Hi Jackie! I'm enquiring about this piece:`,
    '',
    `Product: ${product.name}`,
    `Price: ${formatPrice(effectivePrice(product))}`,
  ];
  if (variant) lines.push(`Option: ${variant}`);
  lines.push('', 'Could you please help me with this?');
  return lines.join('\n');
}

export function whatsappGeneralUrl() {
  return buildWhatsAppUrl(generalEnquiryMessage());
}

export function whatsappProductUrl(product, options) {
  return buildWhatsAppUrl(productEnquiryMessage(product, options));
}
