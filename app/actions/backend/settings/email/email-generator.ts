// app/actions/backend/settings/email/email-generator.ts

import { format } from "date-fns";

interface EmailOrderItem {
  productName: string;
  sku: string | null;
  variantName: string | null;
  quantity: number;
  price: number;
}

interface EmailOrder {
  id?: string;
  orderNumber: string;
  createdAt: string | Date;
  currency: string;
  total: number;
  subtotal: number;
  shippingTotal: number;
  taxTotal: number;
  refundedAmount: number;
  discountTotal: number;
  couponCode?: string | null;
  shippingMethod: string | null;
  shippingTrackingNumber: string | null;
  paymentMethod: string | null;
  billingAddress: Record<string, string>;
  shippingAddress: Record<string, string>;
  user: { name: string | null; email: string } | null;
  guestEmail: string | null;
  items: EmailOrderItem[];
  shippingTrackingUrl?: string | null;
}

interface EmailConfig {
  baseColor: string | null;
  backgroundColor: string | null;
  bodyBackgroundColor: string | null;
  headerImage: string | null;
  senderName: string;
  senderEmail: string;
  footerText: string | null;
}

interface EmailTemplate {
  triggerEvent: string | null;
  subject: string;
  heading: string | null;
  content: string;
}

interface EmailGeneratorProps {
  order?: EmailOrder;
  config: EmailConfig;
  template: EmailTemplate;
  metadata?: Record<string, unknown>;
}

const getReadablePaymentMethod = (method: string | null) => {
  if (!method) return "N/A";

  const formattedMap: Record<string, string> = {
    "stripe": "Credit / Debit Card (Stripe)",
    "paypal": "PayPal",
    "cod": "Cash on Delivery",
    "bank_transfer": "Direct Bank Transfer",
    "cheque": "Cheque Payment",
    "afterpay": "Afterpay / Clearpay",
    "afterpay_clearpay": "Afterpay / Clearpay",
  };

  return formattedMap[method] || method.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
};

const safeReplace = (text: string, variables: Record<string, string | number | null | undefined>) => {
    if (!text) return "";
    let result = text;
    Object.keys(variables).forEach(key => {
        const value = variables[key];
        const safeValue = value === null || value === undefined ? "" : String(value);
        const regex = new RegExp(`{${key}}`, "g");
        result = result.replace(regex, safeValue);
    });
    return result;
};

export const generateEmailHtml = ({ order, config, template, metadata }: EmailGeneratorProps) => {
  const baseColor = config.baseColor || "#2271b1";
  const bgColor = config.backgroundColor || "#f0f0f1";
  const bodyColor = config.bodyBackgroundColor || "#ffffff";

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://gobike.au";

  type TemplateVars = Record<string, string | number | null | undefined>;
  let variables: TemplateVars = {};

  const metaStr = (key: string, fallback = "") =>
    typeof metadata?.[key] === "string" ? (metadata[key] as string) : fallback;

  if (template.triggerEvent?.includes("WARRANTY")) {
      variables = {
          customer_name: metaStr("customer_name", "Customer"),
          order_number: metaStr("order_number", "N/A"),
          shop_purchased: metaStr("shop_purchased", "GoBike Australia"),
          description: metaStr("description", "No description provided."),
          replacement_part: metaStr("replacement_part", "Replacement Part"),
          tracking_number: metaStr("tracking_number", "N/A"),
          courier: metaStr("courier", "Courier"),
      };
  } else if (template.triggerEvent === "PASSWORD_RESET") {
      variables = {
          customer_name: metaStr("customer_name", "Customer"),
          reset_link: metaStr("reset_link", `${appUrl}/reset-password`),
      };
  } else if (template.triggerEvent === "NEWSLETTER_SUBSCRIPTION") {
      variables = {
          customer_name: metaStr("customer_name", "Subscriber"),
      };
  } else if (template.triggerEvent === "CONTACT_FORM_SUBMISSION" || template.triggerEvent === "CONTACT_FORM_CUSTOMER") {
      variables = {
          customer_name: metaStr("customer_name", "Customer"),
          customer_email: metaStr("customer_email", "Not Provided"),
          customer_phone: metaStr("customer_phone", "Not Provided"),
          message: metaStr("message", "No message content"),
      };
  } else if (template.triggerEvent === 'ABANDONED_CHECKOUT') {
      variables = {
          customer_name: metaStr('customer_name', 'Valued Customer'),
          checkout_url: metaStr('checkout_url', `${appUrl}/checkout`),
      };
  } else if (order) {
      const currency = order.currency || "$";
      const formatMoney = (amount: number) => {
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount).replace('USD', currency);
      };
      const billing = order.billingAddress || {};
      const shipping = order.shippingAddress || {};
      variables = {
          customer_name: order.user?.name || billing.firstName || "Customer",
          order_number: order.orderNumber,
          total_amount: formatMoney(order.total),
          payment_method: getReadablePaymentMethod(order.paymentMethod),
          tracking_number: order.shippingTrackingNumber || "N/A",
          courier: order.shippingMethod || "Standard Shipping",
          order_date: format(new Date(order.createdAt), "MMMM do, yyyy"),
          shipping_address: `${shipping.address1 || ''} ${shipping.city || ''}`,
          billing_address: `${billing.address1 || ''} ${billing.city || ''}`
      };
  } else if (metadata) {
      // Generic fallback: affiliate events, custom templates, etc.
      // Replace all metadata keys as template variables in email body
      for (const [key, value] of Object.entries(metadata)) {
          if (key !== "_replyTo" && value !== null && value !== undefined) {
              variables[key] = String(value);
          }
      }
  }

  let introText = safeReplace(template.content, variables);

  // ============================================================
  // ORDER DETAILS TABLE (2-column totals — no colspan wrapping)
  // ============================================================
  let orderDetailsHtml = "";

  if (order && !template.triggerEvent?.includes("WARRANTY") && template.triggerEvent !== "PASSWORD_RESET" && template.triggerEvent !== "NEWSLETTER_SUBSCRIPTION" && !template.triggerEvent?.includes("CONTACT_FORM")) {
      const currency = order.currency || "$";
      const formatMoney = (amount: number) => {
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount).replace('USD', currency);
      };

      const productRows = order.items.map((item) => `
        <tr style="border-bottom: 1px solid #ebebeb;">
          <td class="ptd" style="padding: 14px 16px; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #333; vertical-align: top;">
            <div class="pname" style="font-size: 15px; font-weight: 600; line-height: 1.4;">${item.productName}</div>
            ${item.sku ? `<div style="font-size: 12px; color: #888; margin-top: 3px;">SKU: ${item.sku}</div>` : ''}
            ${item.variantName ? `<div style="font-size: 12px; color: #888;">Variant: ${item.variantName}</div>` : ''}
          </td>
          <td class="ptd" style="padding: 14px 16px; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #333; text-align: center; font-size: 14px; white-space: nowrap; vertical-align: top;">
            ${item.quantity}
          </td>
          <td class="ptd" style="padding: 14px 16px; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #333; text-align: right; font-size: 14px; white-space: nowrap; vertical-align: top;">
            ${formatMoney(item.price)}
          </td>
        </tr>
      `).join("");

      // 2-column totals — avoids the 3-col colspan that breaks on mobile
      let totalsHtml = `
        <tr>
          <td colspan="2" class="ttd" style="padding: 11px 16px; border-top: 1px solid #ebebeb; color: #555; font-size: 14px;">Subtotal:</td>
          <td class="ttd" style="padding: 11px 16px; border-top: 1px solid #ebebeb; text-align: right; color: #333; font-size: 14px; white-space: nowrap;">${formatMoney(order.subtotal)}</td>
        </tr>
        <tr>
          <td colspan="2" class="ttd" style="padding: 11px 16px; color: #555; font-size: 14px;">Shipping:</td>
          <td class="ttd" style="padding: 11px 16px; text-align: right; color: #333; font-size: 14px;">
            ${formatMoney(order.shippingTotal)}<br/>
            <span style="font-size: 11px; color: #888; font-weight: normal;">via ${order.shippingMethod || 'Standard'}</span>
          </td>
        </tr>
      `;

      if (order.discountTotal > 0) {
        totalsHtml += `
        <tr>
          <td colspan="2" class="ttd" style="padding: 11px 16px; color: #555; font-size: 14px;">
            Discount:
            ${order.couponCode ? `<span style="display: inline-block; margin-left: 6px; padding: 2px 7px; background: #fff3cd; color: #856404; border: 1px solid #ffc107; border-radius: 4px; font-size: 11px; font-weight: 600; letter-spacing: 0.5px;">${order.couponCode}</span>` : ''}
          </td>
          <td class="ttd" style="padding: 11px 16px; text-align: right; color: #d9534f; font-size: 14px; white-space: nowrap;">-${formatMoney(order.discountTotal)}</td>
        </tr>`;
      }

      if (order.taxTotal > 0) {
        totalsHtml += `
        <tr>
          <td colspan="2" class="ttd" style="padding: 11px 16px; color: #555; font-size: 14px;">Tax:</td>
          <td class="ttd" style="padding: 11px 16px; text-align: right; color: #333; font-size: 14px; white-space: nowrap;">${formatMoney(order.taxTotal)}</td>
        </tr>`;
      }

      if (order.refundedAmount > 0) {
        totalsHtml += `
        <tr>
          <td colspan="2" class="ttd" style="padding: 11px 16px; color: #d9534f; font-size: 14px;">Refunded:</td>
          <td class="ttd" style="padding: 11px 16px; text-align: right; color: #d9534f; font-size: 14px; white-space: nowrap;">-${formatMoney(order.refundedAmount)}</td>
        </tr>`;
      }

      totalsHtml += `
        <tr>
          <td colspan="2" class="ttd" style="padding: 11px 16px; color: #555; font-size: 14px;">Payment method:</td>
          <td class="ttd" style="padding: 11px 16px; text-align: right; color: #333; font-size: 14px; word-break: break-word;">${getReadablePaymentMethod(order.paymentMethod)}</td>
        </tr>
        <tr>
          <td colspan="2" class="ttr" style="padding: 14px 16px; font-weight: 700; color: ${baseColor}; font-size: 18px; border-top: 2px solid #ddd;">Total:</td>
          <td class="ttr" style="padding: 14px 16px; text-align: right; font-weight: 700; color: ${baseColor}; font-size: 18px; border-top: 2px solid #ddd; white-space: nowrap;">${formatMoney(order.total - (order.refundedAmount || 0))}</td>
        </tr>
      `;

      const billing = order.billingAddress || {};
      const shipping = order.shippingAddress || {};

      orderDetailsHtml = `
        <h2 class="sec-h2" style="color: ${baseColor}; font-size: 20px; margin-bottom: 16px; margin-top: 36px; text-align: center;">Order Details</h2>
        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="border: 1px solid #e5e5e5; border-radius: 6px; border-collapse: collapse; overflow: hidden;">
            <thead style="background-color: #f7f7f7;">
                <tr>
                    <th class="th" style="text-align: left; padding: 12px 16px; border-bottom: 1px solid #e5e5e5; color: #666; font-size: 12px; text-transform: uppercase; letter-spacing: 0.8px;">Product</th>
                    <th class="th" style="text-align: center; padding: 12px 16px; border-bottom: 1px solid #e5e5e5; color: #666; font-size: 12px; text-transform: uppercase; letter-spacing: 0.8px;">Qty</th>
                    <th class="th" style="text-align: right; padding: 12px 16px; border-bottom: 1px solid #e5e5e5; color: #666; font-size: 12px; text-transform: uppercase; letter-spacing: 0.8px;">Price</th>
                </tr>
            </thead>
            <tbody>
                ${productRows}
            </tbody>
            <tfoot style="background-color: #fafafa;">
                ${totalsHtml}
            </tfoot>
        </table>

        <br/>
        <table border="0" cellpadding="0" cellspacing="0" width="100%">
            <tr>
                <td class="addr-col" valign="top" width="50%" style="padding-right: 4px; border: 1px solid #e5e5e5; background-color: #fafafa; border-radius: 6px;">
                    <table border="0" cellpadding="0" cellspacing="0" width="100%">
                        <tr>
                            <td style="padding: 10px; vertical-align: top; font-size: 12px; line-height: 1.6; color: #444;">
                                <strong style="color: ${baseColor}; font-size: 12px; display: block; margin-bottom: 6px;">Billing Address</strong>
                                <strong style="color: #1a1a1a;">${billing.firstName || ""} ${billing.lastName || ""}</strong><br/>
                                ${billing.address1 || ""}<br/>
                                ${billing.city || ""} ${billing.state || ""} ${billing.postcode || ""}<br/>
                                ${billing.country || ""}<br/>
                                ${billing.phone ? `<a href="tel:${billing.phone}" style="color: ${baseColor};">${billing.phone}</a><br/>` : ''}
                                <a href="mailto:${billing.email || order.user?.email || order.guestEmail || ""}" style="color: ${baseColor};">${billing.email || order.user?.email || order.guestEmail || ""}</a>
                            </td>
                        </tr>
                    </table>
                </td>
                <td class="addr-col" valign="top" width="50%" style="padding-left: 4px; border: 1px solid #e5e5e5; background-color: #fafafa; border-radius: 6px;">
                    <table border="0" cellpadding="0" cellspacing="0" width="100%">
                        <tr>
                            <td style="padding: 10px; vertical-align: top; font-size: 12px; line-height: 1.6; color: #444;">
                                <strong style="color: ${baseColor}; font-size: 12px; display: block; margin-bottom: 6px;">Shipping Address</strong>
                                <strong style="color: #1a1a1a;">${shipping.firstName || ""} ${shipping.lastName || ""}</strong><br/>
                                ${shipping.address1 || ""}<br/>
                                ${shipping.city || ""} ${shipping.state || ""} ${shipping.postcode || ""}<br/>
                                ${shipping.country || ""}
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>
        </table>
      `;
  }

  // ==========================================
  // WARRANTY MEDIA
  // ==========================================
  let mediaHtml = "";
  if (template.triggerEvent === "WARRANTY_CLAIM_ADMIN" && typeof metadata?.media_urls === "string") {
      const links = (metadata.media_urls as string).split(',').map((url: string) => url.trim());
      mediaHtml = `
        <h2 class="sec-h2" style="color: ${baseColor}; font-size: 20px; margin-top: 32px; margin-bottom: 14px; border-top: 1px solid #eee; padding-top: 24px; text-align: center;">Customer Uploaded Media</h2>
        <div style="background: #f8f9fa; padding: 16px; border-radius: 6px; border: 1px solid #e0e0e0; text-align: center;">
            <p style="margin: 0 0 10px 0; font-size: 14px; color: #444;">The customer has uploaded the following files:</p>
            <ul style="list-style: none; padding: 0; margin: 0; color: #444; font-size: 14px; line-height: 1.9;">
                ${links.map((link: string, i: number) => `
                  <li>
                    <a href="${link}" target="_blank" style="color: ${baseColor}; font-weight: 600;">View Attached File ${i + 1}</a>
                  </li>
                `).join('')}
            </ul>
        </div>
      `;
  }

  // ==========================================
  // ACTION BUTTONS
  // ==========================================
  let actionButton = "";

  if (template.triggerEvent === "ORDER_SHIPPED" && order?.shippingTrackingUrl) {
    actionButton = `
      <div style="text-align: center; margin: 32px 0;">
        <a href="${order.shippingTrackingUrl}" class="btn" style="background-color: ${baseColor}; color: #ffffff; padding: 14px 28px; text-decoration: none; font-weight: 700; border-radius: 6px; display: inline-block; font-size: 16px;">Track Your Order</a>
      </div>
    `;
  }

  if (template.triggerEvent === "PAYMENT_FAILED" && order?.id) {
    const payLink = `${appUrl}/checkout/pay/${order.id}`;
    actionButton = `
      <div style="text-align: center; margin: 32px 0;">
        <a href="${payLink}" class="btn" style="background-color: #d9534f; color: #ffffff; padding: 14px 28px; text-decoration: none; font-weight: 700; border-radius: 6px; display: inline-block; font-size: 16px;">Complete Payment Now</a>
      </div>
    `;
  }

  if (template.triggerEvent === "WARRANTY_PART_SHIPPED" && metadata?.tracking_url) {
    actionButton = `
      <div style="text-align: center; margin: 32px 0;">
        <a href="${metadata.tracking_url}" target="_blank" class="btn" style="background-color: ${baseColor}; color: #ffffff; padding: 14px 28px; text-decoration: none; font-weight: 700; border-radius: 6px; display: inline-block; font-size: 16px;">Track Your Package</a>
      </div>
    `;
  }

  if ((template.triggerEvent === "WARRANTY_CLAIM_ADMIN" || template.triggerEvent === "ADMIN_WARRANTY_SHIPPED") && metadata?.claim_id) {
    const dashboardLink = `${appUrl}/admin/warranty-claims/${metadata.claim_id}`;
    actionButton = `
      <div style="text-align: center; margin: 32px 0;">
        <a href="${dashboardLink}" class="btn" style="background-color: ${baseColor}; color: #ffffff; padding: 14px 28px; text-decoration: none; font-weight: 700; border-radius: 6px; display: inline-block; font-size: 16px;">View Claim in Dashboard</a>
      </div>
    `;
  }

  if (template.triggerEvent === "PASSWORD_RESET" && metadata?.reset_link) {
    actionButton = `
      <div style="text-align: center; margin: 32px 0;">
        <a href="${metadata.reset_link}" class="btn" style="background-color: ${baseColor}; color: #ffffff; padding: 14px 28px; text-decoration: none; font-weight: 700; border-radius: 6px; display: inline-block; font-size: 16px;">Reset Password</a>
      </div>
      <p style="text-align: center; font-size: 12px; color: #999; margin-top: 12px;">If the button doesn't work, copy this link:<br/><a href="${metadata.reset_link}" style="color: ${baseColor}; word-break: break-all; font-size: 12px;">${metadata.reset_link}</a></p>
    `;
    introText = introText.replace(`{reset_link}`, "");
  }

  if (template.triggerEvent === "NEWSLETTER_SUBSCRIPTION") {
    actionButton = `
      <div style="text-align: center; margin: 32px 0;">
        <a href="${appUrl}/shop" class="btn" style="background-color: ${baseColor}; color: #ffffff; padding: 14px 28px; text-decoration: none; font-weight: 700; border-radius: 6px; display: inline-block; font-size: 16px;">Shop Now</a>
      </div>
    `;
  }

  if (template.triggerEvent === 'ABANDONED_CHECKOUT') {
    const checkoutUrl = metaStr('checkout_url', `${appUrl}/checkout`);
    const currency    = metaStr('currency', 'AUD');
    const subtotal    = metaStr('subtotal', '0');
    const sym         = currency === 'AUD' ? 'A$' : '$';
    const subtotalNum = parseFloat(subtotal);

    type CartItemMeta = {
      name: string;
      price: string | number;
      quantity: number;
      image?: string | null;
      slug?: string;
      attributes?: Array<{ label: string; value: string }>;
    };
    const cartItems = Array.isArray(metadata?.items)
      ? (metadata!.items as CartItemMeta[])
      : [];

    const itemRows = cartItems.map(item => {
      const rawPrice   = typeof item.price === 'number' ? item.price : parseFloat(String(item.price).replace(/[^0-9.]/g, ''));
      const unitPrice  = isNaN(rawPrice) ? '' : `${sym}${rawPrice.toFixed(2)}`;
      const lineTotal  = isNaN(rawPrice) ? '' : `${sym}${(rawPrice * item.quantity).toFixed(2)}`;
      const attrText   = item.attributes?.length
        ? item.attributes.map(a => `${a.label}: ${a.value}`).join(' · ')
        : '';

      return `
      <tr style="border-bottom: 1px solid #f0f0f0;">
        <td style="padding: 14px 12px; vertical-align: middle;">
          <table cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;">
            <tr>
              ${item.image ? `
              <td style="padding-right:14px; vertical-align:middle; width:84px;">
                <a href="${appUrl}/product/${item.slug || ''}" style="display:block; border-radius:8px; overflow:hidden; line-height:0;">
                  <img src="${item.image}" alt="${item.name}" width="80" height="80"
                    style="display:block;width:80px;height:80px;object-fit:cover;border-radius:8px;border:1px solid #eee;">
                </a>
              </td>` : ''}
              <td style="vertical-align:middle;">
                <a href="${appUrl}/product/${item.slug || ''}"
                   style="font-size:14px;font-weight:700;color:#1a1a1a;text-decoration:none;line-height:1.4;display:block;">
                  ${item.name}
                </a>
                ${attrText ? `<div style="font-size:12px;color:#999;margin-top:4px;">${attrText}</div>` : ''}
                <div style="font-size:12px;color:#777;margin-top:5px;">
                  Qty: <strong>${item.quantity}</strong>
                  ${unitPrice ? ` &nbsp;·&nbsp; ${unitPrice} each` : ''}
                </div>
              </td>
            </tr>
          </table>
        </td>
        <td style="padding:14px 12px;text-align:right;vertical-align:middle;font-size:15px;font-weight:700;color:#1a1a1a;white-space:nowrap;min-width:70px;">
          ${lineTotal}
        </td>
      </tr>`;
    }).join('');

    actionButton = `
      <h2 style="color:${baseColor};font-size:19px;margin:28px 0 14px 0;text-align:center;font-weight:700;">
        Your Saved Cart Items
      </h2>

      <table border="0" cellpadding="0" cellspacing="0" width="100%"
             style="border:1px solid #e8e8e8;border-radius:10px;overflow:hidden;border-collapse:collapse;">
        <thead>
          <tr style="background-color:#f7f7f7;border-bottom:1px solid #e8e8e8;">
            <th style="text-align:left;padding:10px 12px;font-size:11px;color:#999;font-weight:600;text-transform:uppercase;letter-spacing:0.6px;">Product</th>
            <th style="text-align:right;padding:10px 12px;font-size:11px;color:#999;font-weight:600;text-transform:uppercase;letter-spacing:0.6px;white-space:nowrap;">Total</th>
          </tr>
        </thead>
        <tbody>
          ${itemRows || '<tr><td colspan="2" style="padding:20px;text-align:center;color:#bbb;">No items found</td></tr>'}
        </tbody>
        <tfoot>
          <tr style="background-color:#fafafa;border-top:2px solid #e8e8e8;">
            <td style="padding:13px 12px;font-size:14px;color:#555;font-weight:600;">Cart Subtotal</td>
            <td style="padding:13px 12px;text-align:right;font-size:20px;font-weight:800;color:${baseColor};white-space:nowrap;">
              ${!isNaN(subtotalNum) ? `${sym}${subtotalNum.toFixed(2)}` : `${sym}${subtotal}`}
            </td>
          </tr>
        </tfoot>
      </table>

      <p style="font-size:11px;color:#bbb;text-align:right;margin:4px 0 24px 0;">
        *Shipping &amp; taxes calculated at checkout
      </p>

      <div style="text-align:center;margin:28px 0 20px 0;">
        <a href="${checkoutUrl}"
           style="background-color:${baseColor};color:#ffffff;padding:16px 40px;text-decoration:none;
                  font-weight:700;border-radius:8px;display:inline-block;font-size:17px;letter-spacing:0.3px;">
          Complete My Order &rarr;
        </a>
        <p style="margin:12px 0 0 0;font-size:12px;color:#bbb;">
          Your cart is saved and ready. Click above to finish your purchase.
        </p>
      </div>

      <table border="0" cellpadding="0" cellspacing="0" width="100%"
             style="margin:20px 0;border-top:1px solid #f0f0f0;padding-top:20px;">
        <tr>
          <td style="text-align:center;padding:8px;vertical-align:top;width:33%;">
            <div style="font-size:24px;margin-bottom:5px;">&#128274;</div>
            <div style="font-size:12px;font-weight:700;color:#333;">Secure Checkout</div>
            <div style="font-size:11px;color:#aaa;margin-top:2px;">SSL encrypted</div>
          </td>
          <td style="text-align:center;padding:8px;vertical-align:top;width:34%;">
            <div style="font-size:24px;margin-bottom:5px;">&#128666;</div>
            <div style="font-size:12px;font-weight:700;color:#333;">Fast Delivery</div>
            <div style="font-size:11px;color:#aaa;margin-top:2px;">Australia-wide</div>
          </td>
          <td style="text-align:center;padding:8px;vertical-align:top;width:33%;">
            <div style="font-size:24px;margin-bottom:5px;">&#11088;</div>
            <div style="font-size:12px;font-weight:700;color:#333;">Top Rated</div>
            <div style="font-size:11px;color:#aaa;margin-top:2px;">500+ happy families</div>
          </td>
        </tr>
      </table>

      <div style="background-color:#fff8e6;border:1px solid #ffe082;border-radius:8px;padding:13px 16px;text-align:center;">
        <p style="margin:0;font-size:13px;color:#856404;">
          &#9201; <strong>Stock is limited!</strong> We cannot guarantee availability.
          Complete your order now to avoid disappointment.
        </p>
      </div>
    `;
  }

  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${template.subject}</title>
    <style type="text/css">
        /* ── Mobile-first responsive overrides ── */
        @media only screen and (max-width: 600px) {
            /* Outer wrapper — zero side padding on mobile */
            .ew  { padding: 0 !important; }
            /* Main card — full width, no rounded corners */
            .ec  { border-radius: 0 !important; }
            /* Header band */
            .eh  { padding: 12px 3px !important; }
            .eh h1 { font-size: 19px !important; }
            .eh p  { font-size: 12px !important; }
            /* Body content */
            .eb  { padding: 12px 3px !important; }
            /* Logo */
            .logo img { max-width: 120px !important; }
            /* Intro text */
            .intro { font-size: 13px !important; line-height: 1.65 !important; }
            /* Section headings */
            .sec-h2 { font-size: 16px !important; margin-top: 24px !important; }
            .sec-h3 { font-size: 14px !important; }
            /* Product table cells */
            .th   { padding: 8px 8px !important; font-size: 11px !important; }
            .ptd  { padding: 10px 8px !important; font-size: 12px !important; }
            .pname { font-size: 12px !important; }
            /* Totals rows */
            .ttd  { padding: 8px !important; font-size: 12px !important; }
            .ttr  { font-size: 15px !important; padding: 10px 8px !important; }
            /* Address columns — keep side by side, reduce padding */
            .addr-col { padding: 0 3px 8px 3px !important; }
            .addr-box { padding: 8px !important; font-size: 11px !important; }
            /* CTA button */
            .btn { padding: 12px 20px !important; font-size: 14px !important; }
            /* Footer */
            .ef { padding: 0 8px !important; font-size: 11px !important; }
        }
    </style>
</head>
<body style="margin: 0; padding: 0; background-color: ${bgColor}; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased;">
    <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: ${bgColor};">
        <tr>
            <td align="center" class="ew" style="padding: 16px 0;">

                ${config.headerImage ? `
                <div class="logo" style="margin-bottom: 8px; text-align: center;">
                    <img src="${config.headerImage}" alt="${config.senderName}" style="max-width: 180px; height: auto; display: inline-block;">
                </div>` : `<h1 style="color: ${baseColor}; margin: 0 0 8px 0; font-size: 28px;">${config.senderName}</h1>`}

                <!-- Main card -->
                <table border="0" cellpadding="0" cellspacing="0" width="100%" class="ec" style="max-width: 680px; background-color: ${bodyColor}; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.06);">

                    <!-- Coloured header band -->
                    <tr>
                        <td class="eh" style="background-color: ${baseColor}; padding: 16px 6px; text-align: center; color: #ffffff;">
                            <h1 style="margin: 0; font-size: 26px; font-weight: 600; letter-spacing: 0.3px;">${template.heading || "Notification"}</h1>
                            <p style="margin: 10px 0 0 0; font-size: 14px; opacity: 0.85; font-weight: 300;">
                                ${variables.order_number && variables.order_number !== "N/A"
                                  ? template.triggerEvent?.includes("ADMIN")
                                    ? `<a href="${appUrl}/admin/orders/${order?.id || ''}" style="color: #ffffff; text-decoration: underline;">Order #${variables.order_number}</a>`
                                    : `<a href="${appUrl}/orders" style="color: #ffffff; text-decoration: underline;">Order #${variables.order_number}</a>`
                                  : format(new Date(), "MMMM do, yyyy")}
                            </p>
                        </td>
                    </tr>

                    <!-- Body -->
                    <tr>
                        <td class="eb" style="padding: 16px 6px;">

                            <div class="intro" style="color: #444; font-size: 15px; line-height: 1.85; margin-bottom: 24px; text-align: center;">
                                ${introText}
                            </div>

                            ${mediaHtml}
                            ${actionButton}
                            ${orderDetailsHtml}

                        </td>
                    </tr>

                </table>

                <!-- Footer -->
                <div class="ef" style="margin-top: 8px; text-align: center; color: #999; font-size: 12px; line-height: 1.6; padding: 0 8px;">
                    <p style="margin: 0;">${config.footerText}</p>
                </div>

            </td>
        </tr>
    </table>
</body>
</html>
  `;
};
