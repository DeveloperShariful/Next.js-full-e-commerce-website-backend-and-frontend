// app/(frontend)/action/contact-action.ts

'use server';

import { sendNotification } from '@/app/api/email/send-notification';

export async function submitContactForm(formData: FormData) {
  const name = formData.get('name') as string;
  const email = formData.get('email') as string;
  const phone = formData.get('phone') as string;
  const message = formData.get('message') as string;

  if (!name || !email || !message) {
    return { success: false, message: 'Please fill in all required fields.' };
  }

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

  } catch (error: any) {
    console.error('Contact form submission error:', error);
    return { success: false, message: 'Failed to send message. Please try again later.' };
  }
}