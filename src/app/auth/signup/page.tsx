"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface PasswordValidation {
  isLengthValid: boolean;
  hasDigit: boolean;
  isValid: boolean;
}

export default function SignupPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Validate password requirements
  const passwordValidation = useMemo((): PasswordValidation => {
    const password = formData.password;
    return {
      isLengthValid: password.length >= 8,
      hasDigit: /\d/.test(password),
      isValid: password.length >= 8 && /\d/.test(password),
    };
  }, [formData.password]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    
    // Prevent submission if password validation fails
    if (!passwordValidation.isValid) {
      setError("Password must be at least 8 characters and contain at least one digit");
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
            {/* Name and Email fields */}
            {[
              { label: "Full Name", placeholder: "Dr. Edwin", value: formData.name, type: "text", key: "name" },
              { label: "Email Address", placeholder: "doctor@healthway.com", value: formData.email, type: "email", key: "email" }
            ].map((field) => (
              <div key={field.key}>
                <label htmlFor={`signup-${field.key}`} className="block text-sm font-medium text-gray-700 mb-1">{field.label}</label>
                <input
                  id={`signup-${field.key}`}
                  type={field.type}
                  required
                  className="relative block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 placeholder-gray-400 focus:z-10 focus:border-green-500 focus:outline-none focus:ring-green-500 sm:text-sm"
                  placeholder={field.placeholder}
                  value={field.value}
                  onChange={(e) => setFormData({ ...formData, [field.key]: e.target.value })}
                />
              </div>
            ))}

            {/* Password field with validation */}
            <div>
              <label htmlFor="signup-password" className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input
                id="signup-password"
                type="password"
                required
                className={`relative block w-full rounded-lg border px-3 py-2 text-gray-900 placeholder-gray-400 focus:z-10 focus:outline-none focus:ring-green-500 sm:text-sm transition-colors ${
                  formData.password === "" 
                    ? "border-gray-300 focus:border-green-500" 
                    : passwordValidation.isValid 
                    ? "border-green-400 bg-green-50 focus:border-green-500" 
                    : "border-red-400 bg-red-50 focus:border-red-500"
                }`}
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              />
              
              {/* Validation requirements display */}
              {formData.password && (
                <div className="mt-3 space-y-2">
                  {/* Length requirement */}
                  <div className="flex items-center gap-2">
                    <span className={`flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${
                      passwordValidation.isLengthValid 
                        ? "bg-green-100 text-green-700" 
                        : "bg-red-100 text-red-700"
                    }`}>
                      {passwordValidation.isLengthValid ? "✓" : "✕"}
                    </span>
                    <span className={`text-sm ${
                      passwordValidation.isLengthValid 
                        ? "text-green-700" 
                        : "text-red-700"
                    }`}>
                      At least 8 characters ({formData.password.length} character{formData.password.length !== 1 ? "s" : ""})
                    </span>
                  </div>
                  
                  {/* Digit requirement */}
                  <div className="flex items-center gap-2">
                    <span className={`flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${
                      passwordValidation.hasDigit 
                        ? "bg-green-100 text-green-700" 
                        : "bg-red-100 text-red-700"
                    }`}>
                      {passwordValidation.hasDigit ? "✓" : "✕"}
                    </span>
                    <span className={`text-sm ${
                      passwordValidation.hasDigit 
                        ? "text-green-700" 
                        : "text-red-700"
                    }`}>
                      Contains at least one digit (0-9)
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading || (formData.password !== "" && !passwordValidation.isValid)}
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
