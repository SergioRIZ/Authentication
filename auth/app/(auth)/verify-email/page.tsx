import { Suspense } from "react";
import VerifyEmailContent from "@/components/auth/verify-email-content";
import { SpinnerIcon } from "@/components/ui/icons";

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-background">
          <SpinnerIcon className="h-12 w-12 text-primary" />
        </div>
      }
    >
      <VerifyEmailContent />
    </Suspense>
  );
}
