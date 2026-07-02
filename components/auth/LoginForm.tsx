"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2 } from "lucide-react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

const loginSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address." }),
  password: z.string().min(1, { message: "Password is required." }),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginForm({ initialError }: { initialError?: string | null }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(initialError || null);
  const [successRole, setSuccessRole] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormValues) => {
    setError(null);
    try {
      const result = await signIn("credentials", {
        redirect: false,
        email: data.email,
        password: data.password,
      });

      if (result?.error) {
        setError("Invalid email or password");
        return;
      }

      if (result?.ok) {
        // Fetch session to get the role for animation
        const res = await fetch("/api/auth/session");
        const session = await res.json();
        const role = session?.user?.role || "USER";
        
        setSuccessRole(role);
        
        setTimeout(() => {
          router.push(`/${role.toLowerCase()}`);
          router.refresh();
        }, 1500);
      }
    } catch (err) {
      setError("An unexpected error occurred.");
    }
  };

  return (
    <div className="relative">
      <AnimatePresence>
        {successRole && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-surface"
          >
            <div className="w-16 h-16 bg-primary-light rounded-full flex items-center justify-center mb-4">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
            </div>
            <h3 className="text-xl font-display font-semibold text-text-primary">
              Login Successful
            </h3>
            <p className="text-text-secondary mt-2">
              Logging you in as <span className="font-semibold text-primary">{successRole}</span>...
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      <form onSubmit={handleSubmit(onSubmit)} className={`space-y-5 ${successRole ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300`}>
        {error && (
          <div className="p-3 text-sm text-status-danger-text bg-status-danger-bg border border-status-danger/20 rounded-md">
            {error}
          </div>
        )}

        <div className="space-y-1">
          <label className="text-sm font-medium text-text-primary">Email Address</label>
          <input
            {...register("email")}
            type="email"
            placeholder="e.g. admin@school.com"
            className="w-full px-4 py-2.5 rounded-md border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all placeholder:text-text-muted text-sm"
          />
          {errors.email && (
            <p className="text-xs text-status-danger mt-1">{errors.email.message}</p>
          )}
        </div>

        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-text-primary">Password</label>
            <a href="/forgot-password" className="text-xs text-primary hover:text-primary-dark font-medium transition-colors">
              Forgot Password?
            </a>
          </div>
          <input
            {...register("password")}
            type="password"
            placeholder="••••••••"
            className="w-full px-4 py-2.5 rounded-md border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all placeholder:text-text-muted text-sm"
          />
          {errors.password && (
            <p className="text-xs text-status-danger mt-1">{errors.password.message}</p>
          )}
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-primary hover:bg-primary-dark text-white py-2.5 rounded-md font-medium transition-colors flex items-center justify-center shadow-sm disabled:opacity-70"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              Signing in...
            </>
          ) : (
            "Sign In"
          )}
        </button>
      </form>
    </div>
  );
}
