import React from "react";
import ForgotPasswordForm from "@/components/auth/ForgotPasswordForm";
import AuthLayout from "@/components/auth/AuthLayout";

export default function ForgotPasswordPage() {
  // Trigger recompilation
  return (
    <AuthLayout>
      <ForgotPasswordForm />
    </AuthLayout>
  );
}
