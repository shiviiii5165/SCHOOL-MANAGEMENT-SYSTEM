import { GraduationCap, BookOpen, Users, Bell } from "lucide-react";
import LoginForm from "@/components/auth/LoginForm";

export default function LoginPage({ searchParams }: { searchParams: { error?: string; retryAfter?: string } }) {
  const retryAfter = searchParams.retryAfter
  const errorMessages: Record<string, string> = {
    RateLimited: `Too many attempts. Try again in ${retryAfter} minute${retryAfter === '1' ? '' : 's'}.`,
    CredentialsSignin: 'Invalid email or password.',
  }
  const initialError = searchParams.error ? errorMessages[searchParams.error] || 'An error occurred.' : null;

  return (
    <div className="min-h-screen flex w-full">
      {/* Left Panel */}
      <div className="hidden lg:flex flex-col justify-between w-[45%] bg-primary p-12 text-white">
        <div>
          <div className="flex items-center gap-3 mb-12">
            <div className="bg-white/20 p-3 rounded-xl">
              <GraduationCap className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-display font-bold">EduCore</h1>
          </div>
          
          <h2 className="text-4xl font-display font-bold leading-tight mb-6">
            Empowering Education <br /> Through Technology
          </h2>
          <p className="text-primary-light text-lg mb-12 max-w-md">
            A comprehensive management system designed to streamline administrative tasks, enhance learning experiences, and connect the school community.
          </p>

          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <div className="bg-white/10 p-2 rounded-lg mt-1">
                <BookOpen className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-white">Academic Excellence</h3>
                <p className="text-sm text-primary-light">Track performance, assignments, and curriculum seamlessly.</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="bg-white/10 p-2 rounded-lg mt-1">
                <Users className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-white">Community Engagement</h3>
                <p className="text-sm text-primary-light">Bridging the gap between parents, teachers, and administration.</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="bg-white/10 p-2 rounded-lg mt-1">
                <Bell className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-white">Real-time Updates</h3>
                <p className="text-sm text-primary-light">Instant notifications for attendance, fees, and school events.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="text-sm text-primary-light/80">
          © {new Date().getFullYear()} EduCore School Management. All rights reserved.
        </div>
      </div>

      {/* Right Panel */}
      <div className="flex-1 flex flex-col justify-center items-center bg-surface p-8">
        <div className="w-full max-w-md">
          <div className="mb-8 text-center lg:text-left">
            <h1 className="text-2xl lg:text-[28px] font-display font-bold text-text-primary mb-2">
              Welcome Back
            </h1>
            <p className="text-text-secondary">
              Please enter your details to sign in.
            </p>
          </div>
          
          <LoginForm initialError={initialError} />
        </div>
      </div>
    </div>
  );
}
