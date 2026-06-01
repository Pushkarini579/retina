"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function SignupPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [passwordError, setPasswordError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setPasswordError("");

    if (formData.password.length < 8) {
      setPasswordError("Password must be at least 8 characters.");
      return;
    }
    if (!/\d/.test(formData.password)) {
      setPasswordError("Password must contain at least one number.");
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch("http://localhost:5000/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Something went wrong during signup");
      }

      // Save the JWT token to local storage
      localStorage.setItem("token", data.token);

      // Redirect to the main application page
      router.push("/");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Unable to sign up");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-[80vh] items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8 rounded-xl border border-green-200 bg-green-50 p-8 shadow-xl">
        <div>
          <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900">
            Create an Account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-500">
            Access the Neural Retina Diagnostic Portal
          </p>
        </div>

        {/* Error Message Display */}
        {error && (
          <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
            {error}
          </div>
        )}

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4 rounded-md shadow-sm">
            {[
              { label: "Full Name", placeholder: "Dr. Edwin", value: formData.name, type: "text", key: "name" },
              { label: "Email Address", placeholder: "doctor@healthway.com", value: formData.email, type: "email", key: "email" },
              { label: "Password", placeholder: "••••••••", value: formData.password, type: "password", key: "password" }
            ].map((field) => (
              <div key={field.key}>
                <label htmlFor={`signup-${field.key}`} className="block text-sm font-medium text-gray-700 mb-1">{field.label}</label>
                <input
                  id={`signup-${field.key}`}
                  type={field.type}
                  required
                  className={`relative block w-full rounded-lg border bg-white px-3 py-2 text-gray-900 placeholder-gray-400 focus:z-10 focus:outline-none sm:text-sm ${
                    field.key === "password" && passwordError
                      ? "border-red-400 focus:border-red-500 focus:ring-red-500"
                      : "border-gray-300 focus:border-green-500 focus:ring-green-500"
                  }`}
                  placeholder={field.placeholder}
                  value={field.value}
                  onChange={(e) => setFormData({ ...formData, [field.key]: e.target.value })}
                />
                {field.key === "password" && passwordError && (
                  <p className="mt-1.5 flex items-center gap-1.5 text-xs font-bold text-red-500">
                    <svg className="w-3.5 h-3.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    {passwordError}
                  </p>
                )}
              </div>
            ))}
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="group relative flex w-full justify-center rounded-lg bg-green-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-green-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-600 disabled:cursor-not-allowed disabled:bg-green-800"
              aria-label={isLoading ? "Signing up, please wait" : "Create Healthway Portal account"}
            >
              {isLoading ? "Signing up..." : "Sign Up"}
            </button>
          </div>
        </form>
        <p className="text-center text-sm text-gray-600 mt-4">
          Already have an account?{" "}
          <Link href="/auth/login" className="font-medium text-green-600 hover:text-green-500">
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
}
