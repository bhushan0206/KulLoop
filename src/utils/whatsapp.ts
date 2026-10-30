/**
 * Formats and launches direct WhatsApp web/app links with pre-filled recipient and message
 */

export function cleanPhoneNumber(phone: string): string {
  if (!phone) return '';
  // Keep only numeric characters
  let digits = phone.replace(/[^0-9]/g, '');
  
  // If 10 digits (e.g. Indian mobile number without country code), default to country code 91
  if (digits.length === 10) {
    digits = '91' + digits;
  }
  
  return digits;
}

export function getWhatsAppShareUrl(phone: string, text: string): string {
  const digits = cleanPhoneNumber(phone);
  const encodedText = encodeURIComponent(text);
  
  if (digits) {
    return `https://wa.me/${digits}?text=${encodedText}`;
  }
  return `https://wa.me/?text=${encodedText}`;
}

export function openWhatsAppDirect(phone: string, text: string): void {
  const url = getWhatsAppShareUrl(phone, text);
  window.open(url, '_blank', 'noopener,noreferrer');
}
