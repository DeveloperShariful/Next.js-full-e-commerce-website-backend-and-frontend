// File: app/(frontend)/my-account/layout.tsx

import React from "react";

interface LayoutProps {
  children: React.ReactNode;
}

export default function MyAccountLayout({ children }: LayoutProps) {
  return (
    <div className="w-full min-h-screen bg-[#f0f0f1] antialiased">
      {children}
    </div>
  );
}