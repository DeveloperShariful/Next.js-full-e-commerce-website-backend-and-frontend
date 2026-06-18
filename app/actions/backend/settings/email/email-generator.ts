// app/actions/backend/settings/email/email-generator.ts

import { format } from "date-fns";

interface EmailGeneratorProps {
  order?: any;
  config: any;
  template: any;
  metadata?: any;
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

  let variables: any = {};

  if (template.triggerEvent.includes("WARRANTY")) {
      variables = {
          customer_name: metadata?.customer_name || "Customer",
          order_number: metadata?.order_number || "N/A",
          shop_purchased: metadata?.shop_purchased || "GoBike Australia",
          description: metadata?.description || "No description provided.",
          replacement_part: metadata?.replacement_part || "Replacement Part",
          tracking_number: metadata?.tracking_number || "N/A",
          courier: metadata?.courier || "Courier",
      };
  } else if (template.triggerEvent === "PASSWORD_RESET") {
      variables = {
          customer_name: metadata?.customer_name || "Customer",
          reset_link: metadata?.reset_link || `${appUrl}/reset-password`,
      };
  } else if (template.triggerEvent === "NEWSLETTER_SUBSCRIPTION") {
      variables = {
          customer_name: metadata?.customer_name || "Subscriber",
      };
  } else if (template.triggerEvent === "CONTACT_FORM_SUBMISSION" || template.triggerEvent === "CONTACT_FORM_CUSTOMER") {
      variables = {
          customer_name: metadata?.customer_name || "Customer",
          customer_email: metadata?.customer_email || "Not Provided",
          customer_phone: metadata?.customer_phone || "Not Provided",
          message: metadata?.message || "No message content",
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
          courier: order.shippingProvider || "Courier",
          order_date: format(new Date(order.createdAt), "MMMM do, yyyy"),
          shipping_address: `${shipping.address1 || ''} ${shipping.city || ''}`,
          billing_address: `${billing.address1 || ''} ${billing.city || ''}`
      };
  }

  let introText = safeReplace(template.content, variables);

  // ============================================================
  // ORDER DETAILS TABLE (2-column totals — no colspan wrapping)
  // ============================================================
  let orderDetailsHtml = "";

  if (order && !template.triggerEvent.includes("WARRANTY") && template.triggerEvent !== "PASSWORD_RESET" && template.triggerEvent !== "NEWSLETTER_SUBSCRIPTION" && !template.triggerEvent.includes("CONTACT_FORM")) {
      const currency = order.currency || "$";
      const formatMoney = (amount: number) => {
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount).replace('USD', currency);
      };

      const productRows = order.items.map((item: any) => `
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
          <td colspan="2" class="ttd" style="padding: 11px 16px; color: #555; font-size: 14px;">Discount:</td>
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
        <h2 class="sec-h2" style="color: ${baseColor}; font-size: 20px; margin-bottom: 16px; margin-top: 36px;">Order Details</h2>
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
                <td class="addr-col" valign="top" width="50%" style="padding-right: 10px;">
                    <h3 class="sec-h3" style="color: ${baseColor}; font-size: 16px; margin: 0 0 10px 0;">Billing Address</h3>
                    <div class="addr-box" style="border: 1px solid #e5e5e5; padding: 16px; border-radius: 6px; color: #444; font-size: 14px; line-height: 1.7; background-color: #fafafa;">
                        <strong style="color: #1a1a1a;">${billing.firstName || ""} ${billing.lastName || ""}</strong><br/>
                        ${billing.address1 || ""}<br/>
                        ${billing.city || ""} ${billing.state || ""} ${billing.postcode || ""}<br/>
                        ${billing.country || ""}<br/>
                        ${billing.phone ? `<a href="tel:${billing.phone}" style="color: ${baseColor};">${billing.phone}</a><br/>` : ''}
                        <a href="mailto:${billing.email || order.user?.email || order.guestEmail || ""}" style="color: ${baseColor};">${billing.email || order.user?.email || order.guestEmail || ""}</a>
                    </div>
                </td>
                <td class="addr-col" valign="top" width="50%" style="padding-left: 10px;">
                    <h3 class="sec-h3" style="color: ${baseColor}; font-size: 16px; margin: 0 0 10px 0;">Shipping Address</h3>
                    <div class="addr-box" style="border: 1px solid #e5e5e5; padding: 16px; border-radius: 6px; color: #444; font-size: 14px; line-height: 1.7; background-color: #fafafa;">
                        <strong style="color: #1a1a1a;">${shipping.firstName || ""} ${shipping.lastName || ""}</strong><br/>
                        ${shipping.address1 || ""}<br/>
                        ${shipping.city || ""} ${shipping.state || ""} ${shipping.postcode || ""}<br/>
                        ${shipping.country || ""}
                    </div>
                </td>
            </tr>
        </table>
      `;
  }

  // ==========================================
  // WARRANTY MEDIA
  // ==========================================
  let mediaHtml = "";
  if (template.triggerEvent === "WARRANTY_CLAIM_ADMIN" && metadata?.media_urls) {
      const links = metadata.media_urls.split(',').map((url: string) => url.trim());
      mediaHtml = `
        <h2 class="sec-h2" style="color: ${baseColor}; font-size: 20px; margin-top: 32px; margin-bottom: 14px; border-top: 1px solid #eee; padding-top: 24px;">Customer Uploaded Media</h2>
        <div style="background: #f8f9fa; padding: 16px; border-radius: 6px; border: 1px solid #e0e0e0;">
            <p style="margin: 0 0 10px 0; font-size: 14px; color: #444;">The customer has uploaded the following files:</p>
            <ul style="padding-left: 18px; margin: 0; color: #444; font-size: 14px; line-height: 1.9;">
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
            .eh  { padding: 12px 8px !important; }
            .eh h1 { font-size: 19px !important; }
            .eh p  { font-size: 12px !important; }
            /* Body content */
            .eb  { padding: 12px 8px !important; }
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
            /* Address columns — stack vertically */
            .addr-col { display: block !important; width: 100% !important; padding: 0 0 14px 0 !important; }
            .addr-box { padding: 12px !important; font-size: 13px !important; }
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
                        <td class="eh" style="background-color: ${baseColor}; padding: 16px 12px; text-align: center; color: #ffffff;">
                            <h1 style="margin: 0; font-size: 26px; font-weight: 600; letter-spacing: 0.3px;">${template.heading || "Notification"}</h1>
                            <p style="margin: 10px 0 0 0; font-size: 14px; opacity: 0.85; font-weight: 300;">
                                ${variables.order_number && variables.order_number !== "N/A" ? `Order #${variables.order_number}` : format(new Date(), "MMMM do, yyyy")}
                            </p>
                        </td>
                    </tr>

                    <!-- Body -->
                    <tr>
                        <td class="eb" style="padding: 16px 12px;">

                            <div class="intro" style="color: #444; font-size: 15px; line-height: 1.85; margin-bottom: 24px;">
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
