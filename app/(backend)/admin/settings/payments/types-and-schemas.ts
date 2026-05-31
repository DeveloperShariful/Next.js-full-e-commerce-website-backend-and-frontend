//File 1: app/(backend)/admin/settings/payments/types-and-schemas.ts

import { z } from "zod"
import { PaymentMode, PaymentProvider } from "@prisma/client"

// ==========================================
// 1. SHARED SCHEMAS
// ==========================================
const booleanField = z.boolean().optional().default(false)
const stringField = z.string().nullable().optional()
const numberField = z.coerce.number().min(0).nullable().optional()

export const SharedGatewaySchema = z.object({
  name: z.string().min(1, "Name is required"),
  title: z.string().min(1, "Title is required"),
  description: stringField,
  isEnabled: booleanField,
  mode: z.nativeEnum(PaymentMode).default("TEST"),
  minOrderAmount: numberField,
  maxOrderAmount: numberField,
  surchargeEnabled: booleanField,
  surchargeAmount: numberField,
})

// ==========================================
// 2. STRIPE JSON SETTINGS SCHEMA
// ==========================================
export const StripeSettingsSchema = z.object({
  paymentAction: z.enum(["CAPTURE", "AUTHORIZE"]).default("CAPTURE"),
  statementDescriptor: z.string().max(22).optional().nullable(),
  shortStatementDescriptor: stringField,
  addOrderNumberToStatement: booleanField,
  savedCards: z.boolean().default(true),
  inlineCreditCardForm: z.boolean().default(true),
  applePayEnabled: z.boolean().default(true),
  googlePayEnabled: z.boolean().default(true),
  paymentRequestButtons: z.boolean().default(true),
  klarnaEnabled: booleanField,
  afterpayEnabled: booleanField,
  zipEnabled: booleanField,
  buttonTheme: z.enum(["light", "dark", "flat"]).default("dark"),
  debugLog: booleanField,
})
export type StripeSettingsType = z.infer<typeof StripeSettingsSchema>

// ==========================================
// 3. PAYPAL JSON SETTINGS SCHEMA
// ==========================================
export const PaypalSettingsSchema = z.object({
  intent: z.enum(["CAPTURE", "AUTHORIZE"]).default("CAPTURE"),
  instantPayments: booleanField,
  brandName: stringField,
  landingPage: z.enum(["LOGIN", "BILLING", "NO_PREFERENCE"]).default("LOGIN"),
  disableFunding: z.array(z.string()).default([]),
  advancedCardEnabled: booleanField,
  advancedCardTitle: z.string().default("Debit & Credit Cards"),
  vaultingEnabled: booleanField,
  smartButtonLocations: z.array(z.string()).default(["checkout", "cart"]),
  requireFinalConfirmation: z.boolean().default(true),
  buttonLabel: z.enum(["PAYPAL", "CHECKOUT", "BUYNOW", "PAY"]).default("PAYPAL"),
  buttonLayout: z.enum(["VERTICAL", "HORIZONTAL"]).default("VERTICAL"),
  buttonColor: z.enum(["GOLD", "BLUE", "SILVER", "WHITE", "BLACK"]).default("GOLD"),
  buttonShape: z.enum(["PILL", "RECT"]).default("RECT"),
  payLaterEnabled: z.boolean().default(true),
  payLaterLocations: z.array(z.string()).default([]),
  payLaterMessaging: z.boolean().default(true),
  payLaterMessageTheme: z.string().default("light"),
  invoicePrefix: z.string().default("WC-"),
  debugLog: booleanField,
})
export type PaypalSettingsType = z.infer<typeof PaypalSettingsSchema>

// ==========================================
// 4. OFFLINE JSON SETTINGS SCHEMAS
// ==========================================
export const BankAccountSchema = z.object({
  name: z.string().min(1, "Account Name required"),
  accountNumber: z.string().min(1, "Account Number required"),
  bankName: z.string().min(1, "Bank Name required"),
  sortCode: stringField,
  iban: stringField,
  bic: stringField,
})

export const OfflineSettingsSchema = z.object({
  instructions: stringField,
  bankDetails: z.array(BankAccountSchema).optional(),
  chequePayTo: stringField,
  addressInfo: stringField,
  enableForShippingMethods: z.array(z.string()).optional(),
})
export type OfflineSettingsType = z.infer<typeof OfflineSettingsSchema>

// ==========================================
// 5. MASTER TYPE FOR FRONTEND
// ==========================================
export interface PaymentGatewayUI {
  id: string
  identifier: string
  provider: PaymentProvider
  name: string
  title: string
  description: string | null
  isEnabled: boolean
  isConnected: boolean
  mode: PaymentMode
  publicKey: string | null
  webhookUrl: string | null
  webhookSecret: string | null // ✅ NEW FIELD ADDED HERE
  minOrderAmount: number | null
  maxOrderAmount: number | null
  surchargeEnabled: boolean
  surchargeAmount: number
  settings: StripeSettingsType | PaypalSettingsType | OfflineSettingsType | null
}