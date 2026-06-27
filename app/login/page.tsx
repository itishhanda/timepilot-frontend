"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion, AnimatePresence } from "framer-motion";
import { apiClient } from "@/lib/api/client";
import { useAuth } from "@/lib/auth/context";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MessageCircle, ArrowRight, ShieldCheck, Sparkles } from "lucide-react";

const verifySchema = z.object({
  phone_number: z.string().min(10, "Invalid phone number"),
  otp: z.string().min(6, "OTP must be 6 digits").max(6, "OTP must be 6 digits"),
});

function getApiError(error: any, fallback: string): string {
  const detail = error?.response?.data?.detail;
  if (!detail) return fallback;
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail)) {
    return detail.map((e: any) => (typeof e === "object" ? e.msg || JSON.stringify(e) : String(e))).join(", ");
  }
  return fallback;
}

export default function LoginPage() {
  const [step, setStep] = useState<1 | 2>(1);
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();

  const form = useForm({
    resolver: zodResolver(verifySchema),
    defaultValues: { phone_number: "", otp: "" },
  });

  const onVerifyOtp = async (data: { phone_number: string; otp: string }) => {
    setIsLoading(true);
    try {
      const res: any = await apiClient.post("/auth/verify-otp", {
        phone_number: data.phone_number,
        otp: data.otp,
      });
      toast.success("Login successful", { icon: <ShieldCheck className="h-4 w-4 text-green-500" /> });
      await login(res.data.access_token, res.data.refresh_token);
    } catch (error: any) {
      toast.error(getApiError(error, "Invalid OTP. Please try again."));
    } finally {
      setIsLoading(false);
    }
  };

  const openTelegram = () => {
    window.open("https://t.me/timepilot_ai_bot", "_blank");
    setStep(2);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      {/* Background gradients for premium feel */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] rounded-full bg-primary/5 blur-[120px]" />
        <div className="absolute top-[60%] -right-[10%] w-[40%] h-[40%] rounded-full bg-blue-500/5 blur-[100px]" />
      </div>

      <div className="z-10 w-full max-w-md overflow-hidden rounded-3xl border bg-card/80 backdrop-blur-xl shadow-2xl">
        <div className="px-8 pt-10 pb-6 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Sparkles className="h-6 w-6" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">TimePilot AI</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {step === 1 ? "Your intelligent productivity platform" : "Complete your secure sign in"}
          </p>
        </div>

        <div className="relative min-h-[420px] px-8 pb-8">
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                className="absolute inset-0 px-8"
              >
                <div className="flex flex-col space-y-6">
                  <div className="rounded-xl border bg-muted/50 p-4 text-sm text-muted-foreground">
                    <p className="font-medium text-foreground mb-1">Secure Telegram Login</p>
                    <p>TimePilot AI uses Telegram for secure, passwordless authentication.</p>
                  </div>

                  <Button
                    onClick={openTelegram}
                    className="w-full h-12 text-md flex items-center justify-between group rounded-xl"
                  >
                    <span className="flex items-center">
                      <MessageCircle className="mr-2 h-5 w-5" />
                      Login with Telegram
                    </span>
                    <ArrowRight className="h-5 w-5 opacity-70 group-hover:translate-x-1 transition-transform" />
                  </Button>

                  <div className="text-xs text-center text-muted-foreground">
                    By continuing, you agree to our Terms of Service and Privacy Policy.
                  </div>
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                className="absolute inset-0 px-8"
              >
                <div className="mb-6 rounded-xl border bg-muted/50 p-4 text-xs text-muted-foreground space-y-2">
                  <p><strong className="text-foreground">New User?</strong> Press <em>Start</em> in Telegram and share your phone number.</p>
                  <p><strong className="text-foreground">Existing User?</strong> Send <em>/code</em> in Telegram to get your login code.</p>
                </div>

                <form onSubmit={form.handleSubmit(onVerifyOtp)} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="phone_number">Phone Number</Label>
                    <Input
                      id="phone_number"
                      placeholder="+1234567890"
                      className="rounded-lg"
                      {...form.register("phone_number")}
                      disabled={isLoading}
                    />
                    {form.formState.errors.phone_number && (
                      <p className="text-xs text-destructive">
                        {form.formState.errors.phone_number.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="otp">6-Digit Code</Label>
                    <Input
                      id="otp"
                      placeholder="000000"
                      maxLength={6}
                      className="text-center text-lg tracking-widest rounded-lg"
                      {...form.register("otp")}
                      disabled={isLoading}
                      autoFocus
                    />
                    {form.formState.errors.otp && (
                      <p className="text-xs text-destructive">
                        {form.formState.errors.otp.message}
                      </p>
                    )}
                  </div>

                  <Button type="submit" className="w-full h-11 rounded-lg mt-2" disabled={isLoading}>
                    {isLoading ? "Verifying..." : "Sign In to Mission Control"}
                  </Button>

                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="mt-4 w-full text-center text-sm text-muted-foreground hover:text-foreground transition-colors"
                    disabled={isLoading}
                  >
                    Need to open Telegram again?
                  </button>
                </form>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
