// app/admin/settings/payments/schemas.ts
import * as z from "zod"
import { PaymentIntent, PaymentMode, PayPalButtonColor, PayPalButtonLabel, PayPalButtonLayout, PayPalButtonShape, PayPalLandingPage } from "@prisma/client"

// Helper to handle nulls from DB
const booleanField = z.boolean().nullable().optional()
const stringField = z.string().nullable().optional()

export const PaymentStatusSchema = z.object({
  isEnabled: z.boolean(),
  mode: z.nativeEnum(PaymentMode).optional()
})

export const StripeSettingsSchema = z.object({
  enableStripe: booleanField,
  testMode: booleanField,
  title: z.string().min(1, "Title is required"),
  description: stringField,
  
  livePublishableKey: stringField,
  liveSecretKey: stringField,
  liveWebhookSecret: stringField,
  testPublishableKey: stringField,
  testSecretKey: stringField,
  testWebhookSecret: stringField,

  paymentAction: z.nativeEnum(PaymentIntent).optional(),
  statementDescriptor: stringField,
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

export const PaypalSettingsSchema = z.object({
  isEnabled: booleanField, // 👈 NEW: Enable/Disable Toggle
  sandbox: booleanField,
  liveEmail: stringField,
  liveClientId: stringField,
  liveClientSecret: stringField,
  sandboxEmail: stringField,
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
  
  subtotalMismatchBehavior: stringField, // 👈 Added for completeness
  invoicePrefix: stringField,
  debugLog: booleanField
})

export const BankTransferSchema = z.object({
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

export const ChequeSchema = z.object({
  name: z.string().min(1, "Method name is required"),
  description: stringField,
  instructions: stringField,
  chequePayTo: z.string().min(1, "Pay to name is required"),
  addressInfo: z.string().min(1, "Address is required")
})

export const CodSchema = z.object({
  name: z.string().min(1, "Method name is required"),
  description: stringField,
  instructions: stringField,
  enableForShippingMethods: z.array(z.string()).optional()
})