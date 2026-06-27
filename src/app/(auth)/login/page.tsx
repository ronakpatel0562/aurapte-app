import React from "react";
import LoginForm from "@/components/auth/LoginForm";
import AuthLayout from "@/components/auth/AuthLayout";

export default function LoginPage() {
  // Trigger recompilation
  return (
    <AuthLayout>
      <LoginForm />
    </AuthLayout>
  );
}
