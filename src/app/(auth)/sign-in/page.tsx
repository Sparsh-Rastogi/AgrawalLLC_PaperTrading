"use client";

import React, { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const BHU_HOSTELS = [
  "Limbdi",
  "Rajputana",
  "Morvi",
  "Dhanrajgiri",
  "Vishwakarma",
  "Aryabhata",
  "C.V. Raman",
  "Ramanujan",
  "Gandhi",
  "SC Dey",
  "SN Bose",
  "IIT BHU Campus (Other)",
];

function SignInForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectPath = searchParams.get("from") || "/home";

  const [step, setStep] = useState<"email" | "otp" | "profile">("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [handle, setHandle] = useState("");
  const [hostel, setHostel] = useState(BHU_HOSTELS[0]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setInfo("");

    const trimmed = email.trim().toLowerCase();
    if (!trimmed) {
      setError("Please enter your institute email");
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: trimmed }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to send verification code");
      }

      setStep("otp");
      if (data.devOtp) {
        setInfo(`Dev mode code: ${data.devOtp}`);
        setOtp(data.devOtp);
      } else {
        setInfo(`Verification code sent to ${trimmed}`);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!otp || otp.length < 6) {
      setError("Please enter the 6-digit code");
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          code: otp.trim(),
          handle: handle.trim() || undefined,
          hostel,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to verify code");
      }

      router.push(redirectPath);
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="glass-panel-elevated border border-white/10 p-6 sm:p-8 shadow-2xl">
      <div className="text-center mb-6">
        <div className="w-12 h-12 rounded-2xl bg-white text-black flex items-center justify-center font-black text-xl shadow-xl mx-auto mb-3">
          SC
        </div>
        <h1 className="text-xl font-bold text-white tracking-tight">StreetCred</h1>
        <p className="text-xs text-zinc-400 mt-1">
          Paper Trading League · IIT (BHU) Varanasi
        </p>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-xl bg-rose-950/60 border border-rose-800/60 text-xs text-rose-300">
          {error}
        </div>
      )}

      {info && (
        <div className="mb-4 p-3 rounded-xl bg-emerald-950/60 border border-emerald-800/60 text-xs text-emerald-400">
          {info}
        </div>
      )}

      {step === "email" && (
        <form onSubmit={handleSendOtp} className="space-y-4">
          <Input
            label="Institute Email Address"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="rollno.branch23@itbhu.ac.in"
            helper="Restricted to @itbhu.ac.in or @iitbhu.ac.in"
            required
            autoFocus
          />

          <Button type="submit" className="w-full" isLoading={isLoading}>
            Send Login Code
          </Button>

          <div className="pt-2 text-center">
            <button
              type="button"
              onClick={() => {
                setEmail("admin@itbhu.ac.in");
              }}
              className="text-[11px] text-zinc-500 hover:text-white transition-colors"
            >
              Use demo: admin@itbhu.ac.in
            </button>
          </div>
        </form>
      )}

      {step === "otp" && (
        <form onSubmit={handleVerifyOtp} className="space-y-4">
          <div className="text-xs text-zinc-400 mb-2">
            Enter the 6-digit verification code sent to{" "}
            <span className="text-white font-medium">{email}</span>
          </div>

          <Input
            label="6-Digit Verification Code"
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={6}
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
            placeholder="123456"
            className="tracking-widest text-center text-lg font-mono"
            required
            autoFocus
          />

          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1.5">
              Hostel (for hostel league ranking)
            </label>
            <select
              value={hostel}
              onChange={(e) => setHostel(e.target.value)}
              className="w-full rounded-xl bg-white/5 border border-white/10 px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-white/40"
            >
              {BHU_HOSTELS.map((h) => (
                <option key={h} value={h} className="bg-[#101114]">
                  {h}
                </option>
              ))}
            </select>
          </div>

          <Button type="submit" className="w-full" isLoading={isLoading}>
            Verify & Enter League
          </Button>

          <div className="flex items-center justify-between pt-1">
            <button
              type="button"
              onClick={() => setStep("email")}
              className="text-xs text-zinc-400 hover:text-white"
            >
              ← Change Email
            </button>
            <button
              type="button"
              onClick={handleSendOtp}
              className="text-xs text-zinc-400 hover:text-white"
              disabled={isLoading}
            >
              Resend Code
            </button>
          </div>
        </form>
      )}

      <div className="mt-6 pt-4 border-t border-[#1f2133] text-center">
        <p className="text-[11px] text-zinc-500">
          IIT (BHU) Student League · 10 Lakh INR Virtual Portfolio
        </p>
      </div>
    </Card>
  );
}

export default function SignInPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-zinc-500">Loading...</div>}>
      <SignInForm />
    </Suspense>
  );
}
