// Shop contact details shown in the footer.

import { WHATSAPP_NUMBER } from "./whatsapp";

/** Snapchat username (without @). */
export const SNAPCHAT_USERNAME = "s_diggins10";

export const snapchatUrl = `https://www.snapchat.com/add/${SNAPCHAT_USERNAME}`;

/** Opens a WhatsApp chat with the shop (no message prefilled). */
export const whatsappChatUrl = WHATSAPP_NUMBER ? `https://wa.me/${WHATSAPP_NUMBER}` : null;

/** Human-friendly number, e.g. 233501234567 → +233 50 123 4567. */
export function formatWhatsAppNumber(digits = WHATSAPP_NUMBER): string {
  if (digits.startsWith("233") && digits.length === 12) {
    return `+233 ${digits.slice(3, 5)} ${digits.slice(5, 8)} ${digits.slice(8)}`;
  }
  return digits ? `+${digits}` : "";
}
