const KENYAN_PHONE = /^254[17][0-9]{8}$/;

/* 254712345678 becomes 0712 345 678. Anything else is shown as it is. */
export function formatPhone(phone: string): string {
  if (!KENYAN_PHONE.test(phone)) {
    return phone;
  }
  const local = `0${phone.slice(3)}`;
  return `${local.slice(0, 4)} ${local.slice(4, 7)} ${local.slice(7)}`;
}

/* A WhatsApp chat link, only for a phone number that has the standard form */
export function whatsappLink(phone: string): string | null {
  return KENYAN_PHONE.test(phone) ? `https://wa.me/${phone}` : null;
}

/* Dates are shown in Kenyan time until shops get their own time zone */
export function formatWhen(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return 'Unknown time';
  }
  return date.toLocaleString('en-KE', {
    timeZone: 'Africa/Nairobi',
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}
