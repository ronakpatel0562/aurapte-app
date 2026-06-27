import React from "react";
import SignupForm from "@/components/auth/SignupForm";
import AuthLayout from "@/components/auth/AuthLayout";

export default function SignupPage() {
  // Trigger recompilation
  return (
    <AuthLayout>
      <SignupForm />
    </AuthLayout>
  );
}
