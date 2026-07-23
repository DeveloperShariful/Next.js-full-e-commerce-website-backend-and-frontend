// app/(frontend)/action/contact-action.ts

'use server';

import { headers } from 'next/headers';
import { db } from '@/lib/prisma';
import { sendNotification } from '@/app/api/email/send-notification';
import { stripHtml } from '@/lib/sanitize';

const RATE_LIMIT = 3;
const WINDOW_MS = 30 * 60 * 1000; // 30 minutes

export async function submitContactForm(formData: FormData) {
  const headersList = await headers();
  const ip = headersList.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
  const rateKey = `contact_${ip}`;
  const windowStart = new Date(Date.now() - WINDOW_MS);

  try {
    const recentCount = await db.systemLog.count({
      where: { source: 'CONTACT_RATE_LIMIT', message: rateKey, createdAt: { gte: windowStart } },
    });
    if (recentCount >= RATE_LIMIT) {
      return { success: false, message: 'Too many messages. Please wait 30 minutes before trying again.' };
    }
  } catch { /* DB check fail হলেও form submit হবে */ }

  const name = stripHtml(formData.get('name') as string);
  const email = (formData.get('email') as string)?.toLowerCase().trim();
  const phone = stripHtml(formData.get('phone') as string);
  const message = stripHtml(formData.get('message') as string);

  if (!name || !email || !message) {
    return { success: false, message: 'Please fill in all required fields.' };
  }

  try {
    await db.systemLog.create({
      data: { level: 'INFO', source: 'CONTACT_RATE_LIMIT', message: rateKey, context: { ip, email } },
    });
  } catch { /* log failure is non-critical */ }

  try {
    const formattedMessage = message.replace(/\n/g, '<br>');

    // ১. অ্যাডমিনকে ইমেইল পাঠানো হচ্ছে (replyTo যুক্ত করা হলো)
    await sendNotification({
      trigger: "CONTACT_FORM_SUBMISSION",
      recipient: "",
      replyTo: email,
      data: {
        customer_name: name,
        customer_email: email,
        customer_phone: phone || 'Not provided',
        message: formattedMessage
      }
    });

    // ২. কাস্টমারকে অটো-রিপ্লাই পাঠানো হচ্ছে
    await sendNotification({
      trigger: "CONTACT_FORM_CUSTOMER",
      recipient: email,
      data: {
        customer_name: name,
        message: formattedMessage
      }
    });

    return { success: true, message: 'Message sent successfully! We will get back to you soon.' };

  } catch (error: unknown) {
    console.error('Contact form submission error:', error);
    return { success: false, message: 'Failed to send message. Please try again later.' };
  }
}
