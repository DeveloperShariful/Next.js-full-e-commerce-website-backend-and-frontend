// app/actions/(backend)/action/settings/email/email-generator.ts

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
    "stripe": "Credit/Debit Card (Stripe)",
    "paypal": "PayPal",
    "cod": "Cash on Delivery",
    "bank_transfer": "Direct Bank Transfer",
    "cheque": "Cheque Payment"
  };

  return formattedMap[method] || method.replace(/_/g, " ").toUpperCase();
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
  
  // ==========================================
  // ✅ 1. WARRANTY CLAIM VARIABLES
  // ==========================================
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
  } 
  // ==========================================
  // ✅ 2. PASSWORD RESET VARIABLES
  // ==========================================
  else if (template.triggerEvent === "PASSWORD_RESET") {
      variables = {
          customer_name: metadata?.customer_name || "Customer",
          reset_link: metadata?.reset_link || `${appUrl}/reset-password`,
      };
  }
  // ==========================================
  // ✅ 3. NEWSLETTER SUBSCRIPTION VARIABLES
  // ==========================================
  else if (template.triggerEvent === "NEWSLETTER_SUBSCRIPTION") {
      variables = {
          customer_name: metadata?.customer_name || "Subscriber",
      };
  }
  // ==========================================
  // 🛑 4. NEW: CONTACT FORM SUBMISSION VARIABLES
  // ==========================================
  else if (template.triggerEvent === "CONTACT_FORM_SUBMISSION" || template.triggerEvent === "CONTACT_FORM_CUSTOMER") {
      variables = {
          customer_name: metadata?.customer_name || "Customer",
          customer_email: metadata?.customer_email || "Not Provided",
          customer_phone: metadata?.customer_phone || "Not Provided",
          message: metadata?.message || "No message content",
      };
  }
  // ==========================================
  // ✅ 5. ORDER VARIABLES (EXISTING)
  // ==========================================
  else if (order) {
      const currency = order.currency || "$";
      const formatMoney = (amount: number) => {
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount).replace('USD', currency);
      };

      const paymentMethodName = getReadablePaymentMethod(order.paymentMethod);
      const billing = order.billingAddress || {};
      const shipping = order.shippingAddress || {};

      variables = {
          customer_name: order.user?.name || billing.firstName || "Customer",
          order_number: order.orderNumber,
          total_amount: formatMoney(order.total),
          payment_method: paymentMethodName,
          tracking_number: order.shippingTrackingNumber || "N/A",
          courier: order.shippingProvider || "Courier",
          order_date: format(new Date(order.createdAt), "MMMM do, yyyy"),
          shipping_address: `${shipping.address1 || ''} ${shipping.city || ''}`,
          billing_address: `${billing.address1 || ''} ${billing.city || ''}`
      };
  }

  let introText = safeReplace(template.content, variables);

  // ==========================================
  // ✅ HTML BUILDING BLOCK
  // ==========================================
  let orderDetailsHtml = "";

  // 🛑 Prevent rendering order table for non-order emails like Contact, Warranty, etc.
  if (order && !template.triggerEvent.includes("WARRANTY") && template.triggerEvent !== "PASSWORD_RESET" && template.triggerEvent !== "NEWSLETTER_SUBSCRIPTION" && !template.triggerEvent.includes("CONTACT_FORM")) {
      const currency = order.currency || "$";
      const formatMoney = (amount: number) => {
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount).replace('USD', currency);
      };
      
      const productRows = order.items.map((item: any) => `
        <tr style="border-bottom: 1px solid #e0e0e0;">
          <td style="padding: 16px; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #333333;">
            <div style="font-size: 16px; font-weight: 600;">${item.productName}</div>
            ${item.sku ? `<div style="font-size: 13px; color: #777; margin-top: 4px;">SKU: ${item.sku}</div>` : ''}
            ${item.variantName ? `<div style="font-size: 13px; color: #777;">Variant: ${item.variantName}</div>` : ''}
          </td>
          <td style="padding: 16px; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #333333; text-align: center; font-size: 16px;">
            ${item.quantity}
          </td>
          <td style="padding: 16px; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #333333; text-align: right; font-size: 16px;">
            ${formatMoney(item.price)}
          </td>
        </tr>
      `).join("");

      let totalsHtml = `
        <tr>
          <td colspan="2" style="padding: 16px; border-top: 1px solid #e0e0e0; font-weight: 600; color: #333333; font-size: 16px;">Subtotal:</td>
          <td style="padding: 16px; border-top: 1px solid #e0e0e0; text-align: right; color: #333333; font-size: 16px;">${formatMoney(order.subtotal)}</td>
        </tr>
        <tr>
          <td colspan="2" style="padding: 16px; font-weight: 600; color: #333333; font-size: 16px;">Shipping:</td>
          <td style="padding: 16px; text-align: right; color: #333333; font-size: 16px;">${formatMoney(order.shippingTotal)} <br/><span style="font-size: 12px; font-weight: normal; color: #777;">via ${order.shippingMethod || 'Standard'}</span></td>
        </tr>
      `;

      if (order.discountTotal > 0) {
        totalsHtml += `
        <tr>
          <td colspan="2" style="padding: 16px; font-weight: 600; color: #333333; font-size: 16px;">Discount:</td>
          <td style="padding: 16px; text-align: right; color: #333333; font-size: 16px;">-${formatMoney(order.discountTotal)}</td>
        </tr>`;
      }

      if (order.taxTotal > 0) {
        totalsHtml += `
        <tr>
          <td colspan="2" style="padding: 16px; font-weight: 600; color: #333333; font-size: 16px;">Tax:</td>
          <td style="padding: 16px; text-align: right; color: #333333; font-size: 16px;">${formatMoney(order.taxTotal)}</td>
        </tr>`;
      }

      if (order.refundedAmount > 0) {
        totalsHtml += `
        <tr>
          <td colspan="2" style="padding: 16px; font-weight: 600; color: #d9534f;">Refunded:</td>
          <td style="padding: 16px; text-align: right; color: #d9534f;">-${formatMoney(order.refundedAmount)}</td>
        </tr>`;
      }

      totalsHtml += `
        <tr>
          <td colspan="2" style="padding: 16px; font-weight: 600; color: #333333; font-size: 16px;">Payment method:</td>
          <td style="padding: 16px; text-align: right; color: #333333; font-size: 16px;">${getReadablePaymentMethod(order.paymentMethod)}</td>
        </tr>
        <tr>
          <td colspan="2" style="padding: 16px; font-weight: 700; color: ${baseColor}; font-size: 20px; border-top: 2px solid #e0e0e0;">Total:</td>
          <td style="padding: 16px; text-align: right; font-weight: 700; color: ${baseColor}; font-size: 20px; border-top: 2px solid #e0e0e0;">${formatMoney(order.total - (order.refundedAmount || 0))}</td>
        </tr>
      `;

      const billing = order.billingAddress || {};
      const shipping = order.shippingAddress || {};

      orderDetailsHtml = `
        <h2 style="color: ${baseColor}; font-size: 22px; margin-bottom: 20px; margin-top: 40px;">Order Details</h2>
        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="border: 1px solid #e5e5e5; border-radius: 8px; border-collapse: collapse; overflow: hidden;">
            <thead style="background-color: #f9f9f9;">
                <tr>
                    <th style="text-align: left; padding: 16px; border-bottom: 1px solid #e5e5e5; color: #555; font-size: 14px; text-transform: uppercase; letter-spacing: 1px;">Product</th>
                    <th style="text-align: center; padding: 16px; border-bottom: 1px solid #e5e5e5; color: #555; font-size: 14px; text-transform: uppercase; letter-spacing: 1px;">Qty</th>
                    <th style="text-align: right; padding: 16px; border-bottom: 1px solid #e5e5e5; color: #555; font-size: 14px; text-transform: uppercase; letter-spacing: 1px;">Price</th>
                </tr>
            </thead>
            <tbody>
                ${productRows}
            </tbody>
            <tfoot>
                ${totalsHtml}
            </tfoot>
        </table>

        <br/><br/>
        <table border="0" cellpadding="0" cellspacing="0" width="100%">
            <tr>
                <td valign="top" width="50%" style="padding-right: 15px;">
                    <h3 style="color: ${baseColor}; font-size: 18px; margin-bottom: 15px;">Billing Address</h3>
                    <div style="border: 1px solid #e5e5e5; padding: 20px; border-radius: 6px; color: #444; font-size: 15px; line-height: 1.6; background-color: #fafafa;">
                        <strong style="color: #1a1a1a; font-size: 16px;">${billing.firstName || ""} ${billing.lastName || ""}</strong><br/>
                        ${billing.address1 || ""}<br/>
                        ${billing.city || ""}, ${billing.state || ""} ${billing.postcode || ""}<br/>
                        ${billing.country || ""}<br/>
                        ${billing.phone || ""}<br/>
                        <a href="mailto:${billing.email || order.user?.email || order.guestEmail || ""}" style="color: ${baseColor};">${billing.email || order.user?.email || order.guestEmail || ""}</a>
                    </div>
                </td>
                <td valign="top" width="50%" style="padding-left: 15px;">
                    <h3 style="color: ${baseColor}; font-size: 18px; margin-bottom: 15px;">Shipping Address</h3>
                    <div style="border: 1px solid #e5e5e5; padding: 20px; border-radius: 6px; color: #444; font-size: 15px; line-height: 1.6; background-color: #fafafa;">
                        <strong style="color: #1a1a1a; font-size: 16px;">${shipping.firstName || ""} ${shipping.lastName || ""}</strong><br/>
                        ${shipping.address1 || ""}<br/>
                        ${shipping.city || ""}, ${shipping.state || ""} ${shipping.postcode || ""}<br/>
                        ${shipping.country || ""}
                    </div>
                </td>
            </tr>
        </table>
      `;
  }

  let mediaHtml = "";
  if (template.triggerEvent === "WARRANTY_CLAIM_ADMIN" && metadata?.media_urls) {
      const links = metadata.media_urls.split(',').map((url: string) => url.trim());
      mediaHtml = `
        <h2 style="color: ${baseColor}; font-size: 22px; margin-top: 40px; margin-bottom: 20px; border-top: 1px solid #eee; padding-top: 30px;">Customer Uploaded Media</h2>
        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; border: 1px solid #e0e0e0;">
            <p style="margin-top: 0; font-size: 16px; color: #444;">The customer has uploaded the following files:</p>
            <ul style="padding-left: 20px; color: #444; font-size: 16px; line-height: 1.8;">
                ${links.map((link: string, i: number) => `
                  <li style="margin-bottom: 10px;">
                    <a href="${link}" target="_blank" style="color: ${baseColor}; text-decoration: underline; font-weight: bold;">View Attached File ${i + 1}</a>
                  </li>
                `).join('')}
            </ul>
        </div>
      `;
  }

  let actionButton = "";
  
  if (template.triggerEvent === "ORDER_SHIPPED" && order?.shippingTrackingUrl) {
    actionButton = `
      <div style="text-align: center; margin: 40px 0;">
        <a href="${order.shippingTrackingUrl}" style="background-color: ${baseColor}; color: #ffffff; padding: 16px 32px; text-decoration: none; font-weight: bold; border-radius: 6px; display: inline-block; font-size: 18px; letter-spacing: 0.5px;">Track Your Order</a>
      </div>
    `;
  }
  
  if (template.triggerEvent === "PAYMENT_FAILED" && order?.id) {
    const payLink = `${appUrl}/checkout/pay/${order.id}`;
    actionButton = `
      <div style="text-align: center; margin: 40px 0;">
        <a href="${payLink}" style="background-color: #d9534f; color: #ffffff; padding: 16px 32px; text-decoration: none; font-weight: bold; border-radius: 6px; display: inline-block; font-size: 18px; letter-spacing: 0.5px;">Complete Payment Now</a>
      </div>
    `;
  }

  if (template.triggerEvent === "WARRANTY_PART_SHIPPED" && metadata?.tracking_url) {
    actionButton = `
      <div style="text-align: center; margin: 40px 0;">
        <a href="${metadata.tracking_url}" target="_blank" style="background-color: ${baseColor}; color: #ffffff; padding: 16px 32px; text-decoration: none; font-weight: bold; border-radius: 6px; display: inline-block; font-size: 18px; letter-spacing: 0.5px;">Track Your Package</a>
      </div>
    `;
  }

  if ((template.triggerEvent === "WARRANTY_CLAIM_ADMIN" || template.triggerEvent === "ADMIN_WARRANTY_SHIPPED") && metadata?.claim_id) {
    const dashboardLink = `${appUrl}/admin/warranty-claims/${metadata.claim_id}`;
    actionButton = `
      <div style="text-align: center; margin: 40px 0;">
        <a href="${dashboardLink}" style="background-color: ${baseColor}; color: #ffffff; padding: 16px 32px; text-decoration: none; font-weight: bold; border-radius: 6px; display: inline-block; font-size: 18px; letter-spacing: 0.5px;">View Claim in Dashboard</a>
      </div>
    `;
  }

  if (template.triggerEvent === "PASSWORD_RESET" && metadata?.reset_link) {
    actionButton = `
      <div style="text-align: center; margin: 40px 0;">
        <a href="${metadata.reset_link}" style="background-color: ${baseColor}; color: #ffffff; padding: 16px 32px; text-decoration: none; font-weight: bold; border-radius: 6px; display: inline-block; font-size: 18px; letter-spacing: 0.5px;">Click Here to Reset Password</a>
      </div>
      <p style="text-align: center; font-size: 14px; color: #888; margin-top: 20px;">If the button doesn't work, copy and paste this link into your browser:<br/><a href="${metadata.reset_link}" style="color: ${baseColor}; word-break: break-all;">${metadata.reset_link}</a></p>
    `;
    introText = introText.replace(`<a href="${metadata.reset_link}">${metadata.reset_link}</a>`, "");
    introText = introText.replace(`{reset_link}`, "");
  }

  if (template.triggerEvent === "NEWSLETTER_SUBSCRIPTION") {
    actionButton = `
      <div style="text-align: center; margin: 40px 0;">
        <a href="${appUrl}/shop" style="background-color: ${baseColor}; color: #ffffff; padding: 16px 32px; text-decoration: none; font-weight: bold; border-radius: 6px; display: inline-block; font-size: 18px; letter-spacing: 0.5px;">Shop Now</a>
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
</head>
<body style="margin: 0; padding: 0; background-color: ${bgColor}; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased;">
    <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: ${bgColor};">
        <tr>
            <td align="center" style="padding: 50px 15px;">
                
                ${config.headerImage ? `
                <div style="margin-bottom: 30px;">
                    <img src="${config.headerImage}" alt="${config.senderName}" style="max-width: 200px; height: auto; display: block;">
                </div>` : `<h1 style="color: ${baseColor}; margin-bottom: 30px; font-size: 32px;">${config.senderName}</h1>`}

                <!-- 🛑 Professional Wide Layout (700px) -->
                <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 700px; background-color: ${bodyColor}; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.05);">
                    <tr>
                        <td style="background-color: ${baseColor}; padding: 40px 30px; text-align: center; color: #ffffff;">
                            <h1 style="margin: 0; font-size: 28px; font-weight: 600; letter-spacing: 0.5px;">${template.heading || "Notification"}</h1>
                            <p style="margin: 12px 0 0 0; font-size: 16px; opacity: 0.9; font-weight: 300;">
                                ${variables.order_number && variables.order_number !== "N/A" ? `Order #${variables.order_number}` : format(new Date(), "MMMM do, yyyy")}
                            </p>
                        </td>
                    </tr>

                    <tr>
                        <td style="padding: 50px 40px;">
                            
                            <div style="color: #444444; font-size: 16px; line-height: 1.8; margin-bottom: 25px;">
                                ${introText}
                            </div>

                            ${mediaHtml}
                            ${actionButton}
                            ${orderDetailsHtml}

                        </td>
                    </tr>
                </table>

                <div style="margin-top: 30px; text-align: center; color: #888888; font-size: 13px; line-height: 1.5;">
                    <p style="margin: 0;">${config.footerText}</p>
                </div>

            </td>
        </tr>
    </table>
</body>
</html>
  `;
};