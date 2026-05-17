//app/(frontend)/action/subscription/subscribe-action.ts

'use server';

import { db } from '@/lib/prisma';
import { sendNotification } from '@/app/api/email/send-notification';

export async function subscribeNewsletter(formData: FormData) {
  const email = formData.get('email') as string;

  if (!email || !email.includes('@')) {
    return { success: false, message: 'Please provide a valid email address.' };
  }

  const cleanEmail = email.toLowerCase().trim();

  try {
    // 1. চেক করা হচ্ছে ইউজার আগে থেকেই ডাটাবেসে আছে কি না
    const existingUser = await db.user.findUnique({
      where: { email: cleanEmail }
    });

    if (existingUser) {
      // যদি আগে থেকেই কাস্টমার বা সাবস্ক্রাইবার হিসেবে থাকে, তবে শুধু সাকসেস মেসেজ দেখাবে (ডাবল সেভ করবে না)
      return { success: true, message: 'You are already subscribed to our newsletter! 🎉' };
    }

    // 2. নতুন ইউজার হিসেবে ডাটাবেসে সেভ করা হচ্ছে (Role: SUBSCRIBER)
    await db.user.create({
      data: {
        email: cleanEmail,
        name: 'Subscriber', // যেহেতু ফর্মে শুধু ইমেইল থাকে, তাই ডিফল্ট নাম দেওয়া হলো
        role: 'SUBSCRIBER',
        isActive: true,
        // password ফাঁকা থাকবে, কারণ সে কোনো অ্যাকাউন্ট তৈরি করেনি
      }
    });

    // 3. ওয়েলকাম ইমেইল ট্রিগার করা হচ্ছে
    await sendNotification({
      trigger: "NEWSLETTER_SUBSCRIPTION",
      recipient: cleanEmail,
      data: {
        customer_name: "Subscriber"
      }
    });

    return { success: true, message: 'Thank you for subscribing! Check your inbox for a welcome gift. 🎉' };

  } catch (error: any) {
    console.error('Newsletter Subscription Error:', error);
    return { success: false, message: 'Something went wrong. Please try again later.' };
  }
}