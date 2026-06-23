//app/(frontend)/action/subscription/subscribe-action.ts

'use server';

import { db } from '@/lib/prisma';
import { sendNotification } from '@/app/api/email/send-notification';
import { subscribeUserToKlaviyo } from '@/app/actions/backend/marketing/klaviyo.actions';

export async function subscribeNewsletter(formData: FormData) {
  const email = formData.get('email') as string;

  if (!email || !email.includes('@')) {
    return { success: false, message: 'Please provide a valid email address.' };
  }

  const cleanEmail = email.toLowerCase().trim();

  try {
    const existingUser = await db.user.findUnique({
      where: { email: cleanEmail }
    });

    if (existingUser) {
      // Already in DB — still try to sync to Klaviyo in case they weren't added before
      await subscribeUserToKlaviyo(cleanEmail);
      return { success: true, message: 'You are already subscribed to our newsletter! 🎉' };
    }

    // New subscriber — save to DB
    await db.user.create({
      data: {
        email: cleanEmail,
        name: 'Subscriber',
        role: 'SUBSCRIBER',
        isActive: true,
      }
    });

    // Welcome email + Klaviyo sync — parallel
    await Promise.all([
      sendNotification({
        trigger: "NEWSLETTER_SUBSCRIPTION",
        recipient: cleanEmail,
        data: { customer_name: "Subscriber" },
      }),
      subscribeUserToKlaviyo(cleanEmail),
    ]);

    return { success: true, message: 'Thank you for subscribing! Check your inbox for a welcome gift. 🎉' };

  } catch (error: unknown) {
    console.error('Newsletter Subscription Error:', error);
    return { success: false, message: 'Something went wrong. Please try again later.' };
  }
}
