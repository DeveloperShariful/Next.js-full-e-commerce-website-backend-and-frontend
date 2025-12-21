"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { CheckCircle2, AlertTriangle, RadioReceiver, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { StripeConfigType } from "@/app/admin/settings/payments/types"
import { toast } from "sonner"
// 👇 নতুন অ্যাকশন ইমপোর্ট
import { testStripeConnection } from "@/app/actions/settings/payments/stripe/test-connection"

interface ConnectionCardProps {
  config: StripeConfigType
  methodId: string
}

export const Stripe_Connection_Card = ({ config, methodId }: ConnectionCardProps) => {
  const [testing, setTesting] = useState(false)

  // লজিক: যদি OAuth কানেক্টেড থাকে অথবা ম্যানুয়াল সিক্রেট কি থাকে
  const hasManualKeys = config.testMode 
    ? !!config.testSecretKey 
    : !!config.liveSecretKey;

  const isConnected = config.isConnected || hasManualKeys;

  const handleTestConnection = async () => {
    setTesting(true)
    // সার্ভার অ্যাকশন কল করছি
    const res = await testStripeConnection(methodId)
    
    if (res.success) {
      toast.success("Connection Verified!", {
        description: res.message,
      })
    } else {
      toast.error("Connection Failed", {
        description: res.error,
      })
    }
    setTesting(false)
  }

  return (
    <Card className={`border-l-4 ${isConnected ? "border-l-green-500" : "border-l-red-500"}`}>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle>Connection Status</CardTitle>
            <CardDescription>Verify if your store can communicate with Stripe.</CardDescription>
          </div>
          <Badge variant={isConnected ? "default" : "destructive"}>
            {isConnected ? "Connected" : "No Credentials"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {isConnected ? (
          <Alert className="bg-green-50 border-green-200">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertTitle className="text-green-800">Ready to Process</AlertTitle>
            <AlertDescription className="text-green-700">
              Your API keys are saved. You can verify the connection below.
            </AlertDescription>
          </Alert>
        ) : (
          <Alert variant="destructive" className="bg-red-50 border-red-200 text-red-900">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <AlertTitle>Credentials Missing</AlertTitle>
            <AlertDescription>
              Please enter your Publishable and Secret keys in the <strong>General</strong> tab.
            </AlertDescription>
          </Alert>
        )}

        <div className="pt-2">
          <Button 
            onClick={handleTestConnection} 
            disabled={!isConnected || testing}
            variant="outline"
            className="gap-2"
          >
            {testing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Testing...
              </>
            ) : (
              <>
                <RadioReceiver className="h-4 w-4" />
                Test Connection
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}