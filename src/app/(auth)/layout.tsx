import React from "react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#090a10] flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm mx-auto">{children}</div>
    </div>
  );
}
