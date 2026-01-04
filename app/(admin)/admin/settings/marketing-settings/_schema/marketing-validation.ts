// File: app/(admin)/admin/settings/marketing-settings/_schema/marketing-validation.ts
import { z } from "zod";

const jsonString = z.string().refine((val) => {
  if (!val) return true;
  try {
    JSON.parse(val);
    return true;
  } catch (e) {
    return false;
  }
}, { message: "Invalid JSON format" });

export const MarketingSettingsSchema = z.object({
  // Google GTM
  gtmEnabled: z.boolean().default(false),
  gtmContainerId: z.string().optional(),
  gtmAuth: z.string().optional(),
  gtmPreview: z.string().optional(),
  dataLayerName: z.string().default("dataLayer"),
  
  // Google Search Console
  gscVerificationCode: z.string().optional(),
  gscServiceAccountJson: z.string().optional(),
  
  // Google Merchant Center
  gmcMerchantId: z.string().optional(),
  gmcContentApiEnabled: z.boolean().default(false),
  gmcTargetCountry: z.string().default("AU"),
  gmcLanguage: z.string().default("en"),

  // Facebook
  fbEnabled: z.boolean().default(false),
  fbPixelId: z.string().optional(),
  fbAccessToken: z.string().optional(),
  fbTestEventCode: z.string().optional(),
  fbDomainVerification: z.string().optional(),
  fbDataProcessingOptions: jsonString.optional(),

  // Klaviyo
  klaviyoEnabled: z.boolean().default(false),
  klaviyoPublicKey: z.string().optional(),
  klaviyoPrivateKey: z.string().optional(),
  klaviyoTrackViewedProduct: z.boolean().default(true),
  klaviyoTrackAddedToCart: z.boolean().default(true),
  
  // Nested Objects
  klaviyoListIds: z.object({
    newsletter: z.string().optional(),
    abandonedCart: z.string().optional(),
  }).optional(),

  // Verification Status (Must match database JSON)
  verificationStatus: z.object({
    gtm: z.boolean().optional(),
    facebook: z.boolean().optional(),
    klaviyo: z.boolean().optional(),
    searchConsole: z.boolean().optional(),
    merchantCenter: z.boolean().optional(),
  }).optional(),
});

export type MarketingSettingsValues = z.infer<typeof MarketingSettingsSchema>;