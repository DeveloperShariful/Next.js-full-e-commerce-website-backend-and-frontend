// app/admin/settings/payments/schemas.ts

import * as z from "zod"
import { PaymentIntent, PaymentMode, PayPalButtonColor, PayPalButtonLabel, PayPalButtonLayout, PayPalButtonShape, PayPalLandingPage } from "@prisma/client"

const booleanField = z.boolean().nullable().optional()
const stringField = z.string().nullable().optional()
const numberField = z.coerce.number().min(0).nullable().optional()

const LimitsAndSurchargeSchema = z.object({
  minOrderAmount: numberField,
  maxOrderAmount: numberField,
  surchargeEnabled: booleanField,
  surchargeType: z.enum(["fixed", "percentage"]).default("fixed"),
  surchargeAmount: numberField,
  taxableSurcharge: booleanField
})

export const PaymentStatusSchema = z.object({
  isEnabled: z.boolean(),
  mode: z.nativeEnum(PaymentMode).optional()
})

export const StripeSettingsSchema = LimitsAndSurchargeSchema.extend({
  enableStripe: booleanField,
  testMode: booleanField,
  title: z.string().min(1, "Title is required"),
  description: stringField,
  
  livePublishableKey: z.string().optional().refine(val => !val || val.startsWith('pk_live_'), {
    message: "Live Public Key must start with 'pk_live_'"
  }),
  liveSecretKey: z.string().optional().refine(val => !val || val.startsWith('sk_live_'), {
    message: "Live Secret Key must start with 'sk_live_'"
  }),
  liveWebhookSecret: z.string().optional().refine(val => !val || val.startsWith('whsec_'), {
    message: "Webhook Secret usually starts with 'whsec_'"
  }),

  testPublishableKey: z.string().optional().refine(val => !val || val.startsWith('pk_test_'), {
    message: "Test Public Key must start with 'pk_test_'"
  }),
  testSecretKey: z.string().optional().refine(val => !val || val.startsWith('sk_test_'), {
    message: "Test Secret Key must start with 'sk_test_'"
  }),
  testWebhookSecret: stringField,

  paymentAction: z.nativeEnum(PaymentIntent).optional(),
  statementDescriptor: z.string().max(22, "Max 22 characters allowed").nullable().optional(),
  shortStatementDescriptor: stringField,
  addOrderNumberToStatement: booleanField,
  
  savedCards: booleanField,
  inlineCreditCardForm: booleanField,
  applePayEnabled: booleanField,
  googlePayEnabled: booleanField,
  paymentRequestButtons: booleanField,
  
  buttonTheme: stringField,
  debugLog: booleanField
})

export const PaypalSettingsSchema = LimitsAndSurchargeSchema.extend({
  isEnabled: booleanField, 
  sandbox: booleanField,
  liveEmail: z.string().email().optional().or(z.literal('')),
  liveClientId: stringField,
  liveClientSecret: stringField,
  sandboxEmail: z.string().email().optional().or(z.literal('')),
  sandboxClientId: stringField,
  sandboxClientSecret: stringField,
  
  title: z.string().min(1, "Title is required"),
  description: stringField,
  
  intent: z.nativeEnum(PaymentIntent).optional(),
  instantPayments: booleanField,
  brandName: stringField,
  landingPage: z.nativeEnum(PayPalLandingPage).optional(),
  
  disableFunding: z.array(z.string()).optional(),
  
  advancedCardEnabled: booleanField,
  advancedCardTitle: stringField,
  vaultingEnabled: booleanField,
  
  smartButtonLocations: z.array(z.string()).optional(),
  requireFinalConfirmation: booleanField,
  
  buttonLabel: z.nativeEnum(PayPalButtonLabel).optional(),
  buttonLayout: z.nativeEnum(PayPalButtonLayout).optional(),
  buttonColor: z.nativeEnum(PayPalButtonColor).optional(),
  buttonShape: z.nativeEnum(PayPalButtonShape).optional(),
  
  payLaterEnabled: booleanField,
  payLaterLocations: z.array(z.string()).optional(),
  payLaterMessaging: booleanField,
  payLaterMessageTheme: stringField,
  
  subtotalMismatchBehavior: stringField,
  invoicePrefix: stringField,
  debugLog: booleanField
})

export const BankTransferSchema = LimitsAndSurchargeSchema.extend({
  name: z.string().min(1, "Method name is required"),
  description: stringField,
  instructions: stringField,
  bankDetails: z.array(z.object({
    accountName: z.string().optional(),
    accountNumber: z.string().optional(),
    bankName: z.string().optional(),
    sortCode: z.string().optional(),
    iban: z.string().optional(),
    bic: z.string().optional()
  })).optional()
})

export const ChequeSchema = LimitsAndSurchargeSchema.extend({
  name: z.string().min(1, "Method name is required"),
  description: stringField,
  instructions: stringField,
  chequePayTo: z.string().min(1, "Pay to name is required"),
  addressInfo: z.string().min(1, "Address is required")
})

export const CodSchema = LimitsAndSurchargeSchema.extend({
  name: z.string().min(1, "Method name is required"),
  description: stringField,
  instructions: stringField,
  enableForShippingMethods: z.array(z.string()).optional()
})