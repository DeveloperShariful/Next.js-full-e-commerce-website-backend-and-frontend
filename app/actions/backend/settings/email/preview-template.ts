// app/actions/backend/settings/email/preview-template.ts

'use server';

import { db } from '@/lib/prisma';
import { generateEmailHtml } from './email-generator';

export async function previewEmailTemplate(templateId: string) {
  try {
    const [template, config] = await Promise.all([
      db.emailTemplate.findUnique({ where: { id: templateId } }),
      db.emailConfiguration.findFirst(),
    ]);

    if (!template) return { success: false, html: '<p style="color:red;padding:20px">Template not found</p>' };

    const fakeConfig = config || {
      senderName: 'GoBike',
      senderEmail: 'gobike@gobike.au',
      headerImage: '',
      baseColor: '#2271b1',
      backgroundColor: '#f0f0f1',
      bodyBackgroundColor: '#ffffff',
      footerText: '© 2025 GoBike. All rights reserved.',
    };

    // Order-type templates কিনা চেক করা
    const triggerEvent = template.triggerEvent ?? '';
    const nonOrderTriggers = [
      'WARRANTY', 'PASSWORD_RESET', 'NEWSLETTER_SUBSCRIPTION',
      'CONTACT_FORM', 'AFFILIATE', 'COMMISSION', 'KYC',
      'REFERRAL', 'PAYOUT', 'TIER', 'FRAUD',
    ];
    const isOrderTemplate = !nonOrderTriggers.some(t => triggerEvent.includes(t));

    const sampleOrder = isOrderTemplate ? {
      orderNumber: '19809',
      total: 1005.65,
      subtotal: 999.00,
      shippingTotal: 6.65,
      discountTotal: 0,
      taxTotal: 0,
      refundedAmount: 0,
      paymentMethod: 'afterpay_clearpay',
      shippingMethod: 'Couriers Please (1 Day) Dis-50%',
      currency: '$',
      createdAt: new Date(),
      items: [
        {
          productName: 'GoBike 12 Inch Ebike for Kids With Training Wheels — Perfect First Ride for Ages 2–5',
          sku: 'GOBIKE 12"',
          variantName: null,
          quantity: 1,
          price: 999.00,
        }
      ],
      billingAddress: {
        firstName: 'Benson', lastName: 'Toms',
        address1: '18 Ellsworth Drive', city: 'TREGEAR',
        state: 'New South Wales', postcode: '2770', country: 'AU',
        phone: '0483821059', email: 'bensontoms89@gmail.com',
      },
      shippingAddress: {
        firstName: 'Benson', lastName: 'Toms',
        address1: '18 Ellsworth Drive', city: 'TREGEAR',
        state: 'New South Wales', postcode: '2770', country: 'AU',
      },
      user: { name: 'Benson Toms', email: 'bensontoms89@gmail.com' },
      guestEmail: null,
      shippingTrackingNumber: 'CON123456789',
      shippingTrackingUrl: 'https://tracking.couriersplease.com.au/track/CON123456789',
      shippingProvider: 'Couriers Please',
    } : null;

    const sampleMetadata = {
      customer_name: 'Benson Toms',
      order_number: '19809',
      shop_purchased: 'GoBike Australia',
      description: 'Battery not charging properly after 3 months of use.',
      replacement_part: 'Battery Pack (48V)',
      tracking_number: 'CON123456789',
      tracking_url: 'https://tracking.couriersplease.com.au/track/CON123456789',
      courier: 'COURIERS PLEASE',
      claim_id: 'preview-claim-id-123',
      media_urls: 'https://gobike.au/sample-warranty-photo.jpg',
      reset_link: 'https://gobike.au/reset-password?token=preview-token-xyz',
      message: 'Hi, I have a question about my recent order. Could you please help me out?',
      customer_email: 'bensontoms89@gmail.com',
      customer_phone: '0483 821 059',
    };

    const html = generateEmailHtml({
      order: sampleOrder ?? undefined,
      config: fakeConfig,
      template,
      metadata: sampleMetadata,
    });

    return { success: true, html };
  } catch (error) {
    console.error('[PreviewTemplate] Error:', error);
    return { success: false, html: '<p style="color:red;padding:20px">Error generating preview</p>' };
  }
}

export async function previewEmailTemplateWithOverrides(
  templateId: string,
  overrides: { content?: string; heading?: string; subject?: string }
) {
  try {
    const [template, config] = await Promise.all([
      db.emailTemplate.findUnique({ where: { id: templateId } }),
      db.emailConfiguration.findFirst(),
    ]);

    if (!template) return { success: false, html: '<p style="color:red;padding:20px">Template not found</p>' };

    const mergedTemplate = { ...template, ...overrides };

    const fakeConfig = config || {
      senderName: 'GoBike',
      senderEmail: 'gobike@gobike.au',
      headerImage: '',
      baseColor: '#2271b1',
      backgroundColor: '#f0f0f1',
      bodyBackgroundColor: '#ffffff',
      footerText: '© 2025 GoBike. All rights reserved.',
    };

    const triggerEvent = template.triggerEvent ?? '';
    const nonOrderTriggers = [
      'WARRANTY', 'PASSWORD_RESET', 'NEWSLETTER_SUBSCRIPTION',
      'CONTACT_FORM', 'AFFILIATE', 'COMMISSION', 'KYC',
      'REFERRAL', 'PAYOUT', 'TIER', 'FRAUD',
    ];
    const isOrderTemplate = !nonOrderTriggers.some(t => triggerEvent.includes(t));

    const sampleOrder = isOrderTemplate ? {
      orderNumber: '19809',
      total: 1005.65,
      subtotal: 999.00,
      shippingTotal: 6.65,
      discountTotal: 0,
      taxTotal: 0,
      refundedAmount: 0,
      paymentMethod: 'afterpay_clearpay',
      shippingMethod: 'Couriers Please (1 Day) Dis-50%',
      currency: '$',
      createdAt: new Date(),
      items: [
        {
          productName: 'GoBike 12 Inch Ebike for Kids With Training Wheels — Perfect First Ride for Ages 2–5',
          sku: 'GOBIKE 12"',
          variantName: null,
          quantity: 1,
          price: 999.00,
        }
      ],
      billingAddress: {
        firstName: 'Benson', lastName: 'Toms',
        address1: '18 Ellsworth Drive', city: 'TREGEAR',
        state: 'New South Wales', postcode: '2770', country: 'AU',
        phone: '0483821059', email: 'bensontoms89@gmail.com',
      },
      shippingAddress: {
        firstName: 'Benson', lastName: 'Toms',
        address1: '18 Ellsworth Drive', city: 'TREGEAR',
        state: 'New South Wales', postcode: '2770', country: 'AU',
      },
      user: { name: 'Benson Toms', email: 'bensontoms89@gmail.com' },
      guestEmail: null,
      shippingTrackingNumber: 'CON123456789',
      shippingTrackingUrl: 'https://tracking.couriersplease.com.au/track/CON123456789',
      shippingProvider: 'Couriers Please',
    } : null;

    const sampleMetadata = {
      customer_name: 'Benson Toms',
      order_number: '19809',
      shop_purchased: 'GoBike Australia',
      description: 'Battery not charging properly after 3 months of use.',
      replacement_part: 'Battery Pack (48V)',
      tracking_number: 'CON123456789',
      tracking_url: 'https://tracking.couriersplease.com.au/track/CON123456789',
      courier: 'COURIERS PLEASE',
      claim_id: 'preview-claim-id-123',
      media_urls: 'https://gobike.au/sample-warranty-photo.jpg',
      reset_link: 'https://gobike.au/reset-password?token=preview-token-xyz',
      message: 'Hi, I have a question about my recent order. Could you please help me out?',
      customer_email: 'bensontoms89@gmail.com',
      customer_phone: '0483 821 059',
    };

    const html = generateEmailHtml({
      order: sampleOrder ?? undefined,
      config: fakeConfig,
      template: mergedTemplate,
      metadata: sampleMetadata,
    });

    return { success: true, html };
  } catch (error) {
    console.error('[PreviewTemplateWithOverrides] Error:', error);
    return { success: false, html: '<p style="color:red;padding:20px">Error generating preview</p>' };
  }
}
