// app/auth/layout.tsx

export default function AuthLayout({ 
  children 
}: { 
  children: React.ReactNode 
}) {
  return (
    <div className="h-screen flex items-center justify-center bg-slate-100 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-100 to-slate-100">
      <div className="w-full max-w-md p-4">
        {children}
      </div>
    </div>
  );
}