//app/admin/settings/payments/layout.tsx

export default function PaymentSettingsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="mx-auto w-full max-w-6xl">
      {/* এখানে চাইলে ভবিষ্যতে Tab বা Breadcrumb যোগ করতে পারেন */}
      {children}
    </div>
  )
}