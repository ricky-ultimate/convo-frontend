"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  AtSignIcon,
  Lock,
  UserCircle,
  AlertCircle,
  Eye,
  EyeOff,
  CheckCircle,
} from "lucide-react";
import Link from "next/link";

interface FieldErrors {
  email?: string;
  username?: string;
  password?: string;
  confirmPassword?: string;
}

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const router = useRouter();

  const validateForm = () => {
    const errors: FieldErrors = {};

    if (!email.trim()) {
      errors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      errors.email = "Please enter a valid email";
    }

    if (!username.trim()) {
      errors.username = "Username is required";
    } else if (username.length < 3) {
      errors.username = "Username must be at least 3 characters";
    } else if (username.length > 20) {
      errors.username = "Username must be less than 20 characters";
    } else if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      errors.username =
        "Username can only contain letters, numbers, and underscores";
    }

    if (!password.trim()) {
      errors.password = "Password is required";
    } else if (password.length < 6) {
      errors.password = "Password must be at least 6 characters";
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
      errors.password =
        "Password must contain at least one uppercase letter, one lowercase letter, and one number";
    }

    if (!confirmPassword.trim()) {
      errors.confirmPassword = "Please confirm your password";
    } else if (password !== confirmPassword) {
      errors.confirmPassword = "Passwords do not match";
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setFieldErrors({});

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

      const res = await fetch(`${apiUrl}/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email.trim(),
          username: username.trim(),
          password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 409) {
          if (data.message?.includes("email")) {
            setFieldErrors((prev) => ({
              ...prev,
              email: "This email is already registered",
            }));
          } else if (data.message?.includes("username")) {
            setFieldErrors((prev) => ({
              ...prev,
              username: "This username is already taken",
            }));
          } else {
            setError("An account with these details already exists.");
          }
        } else if (res.status === 400) {
          setError(
            data.message ||
              "Invalid registration data. Please check your inputs."
          );
        } else if (res.status === 429) {
          setError(
            "Too many registration attempts. Please wait a moment before trying again."
          );
        } else if (res.status === 500) {
          setError("Server error. Please try again later.");
        } else {
          setError(data.message || "Registration failed. Please try again.");
        }
        return;
      }

      localStorage.setItem("token", data.access_token);
      localStorage.setItem("user", JSON.stringify(data.user));
      router.push("/dashboard");
    } catch (err) {
      if (err instanceof TypeError && err.message.includes("fetch")) {
        setError(
          "Unable to connect to the server. Please check your internet connection."
        );
      } else {
        setError("An unexpected error occurred. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
    if (fieldErrors.email) {
      setFieldErrors((prev) => ({ ...prev, email: undefined }));
    }
    if (error) setError("");
  };

  const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUsername(e.target.value);
    if (fieldErrors.username) {
      setFieldErrors((prev) => ({ ...prev, username: undefined }));
    }
    if (error) setError("");
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
    if (fieldErrors.password) {
      setFieldErrors((prev) => ({ ...prev, password: undefined }));
    }
    if (fieldErrors.confirmPassword && confirmPassword) {
      if (e.target.value === confirmPassword) {
        setFieldErrors((prev) => ({ ...prev, confirmPassword: undefined }));
      } else if (!fieldErrors.confirmPassword?.includes("required")) {
        setFieldErrors((prev) => ({
          ...prev,
          confirmPassword: "Passwords do not match",
        }));
      }
    }
    if (error) setError("");
  };

  const handleConfirmPasswordChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setConfirmPassword(e.target.value);
    if (fieldErrors.confirmPassword) {
      if (password === e.target.value) {
        setFieldErrors((prev) => ({ ...prev, confirmPassword: undefined }));
      }
    }
    if (error) setError("");
  };

  const getPasswordStrength = () => {
    if (!password) return { strength: 0, label: "" };

    let strength = 0;
    const checks = [
      { test: password.length >= 6, label: "At least 6 characters" },
      { test: /[a-z]/.test(password), label: "Lowercase letter" },
      { test: /[A-Z]/.test(password), label: "Uppercase letter" },
      { test: /\d/.test(password), label: "Number" },
      {
        test: /[!@#$%^&*(),.?":{}|<>]/.test(password),
        label: "Special character",
      },
    ];

    checks.forEach((check) => check.test && strength++);

    if (strength < 2) return { strength, label: "Weak", color: "text-red-600" };
    if (strength < 4)
      return { strength, label: "Fair", color: "text-yellow-600" };
    return { strength, label: "Strong", color: "text-green-600" };
  };

  const passwordStrength = getPasswordStrength();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold">Create an account</h1>
          <p className="text-muted-foreground mt-2">
            Enter your details to get started
          </p>
        </div>

        {error && (
          <div className="rounded-md bg-destructive/15 border border-destructive/20 p-3 flex items-start gap-3">
            <AlertCircle className="h-4 w-4 text-destructive mt-0.5 flex-shrink-0" />
            <div className="text-sm text-destructive">{error}</div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium leading-none" htmlFor="email">
              Email
            </label>
            <div className="relative">
              <AtSignIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={handleEmailChange}
                className={`pl-10 ${fieldErrors.email ? "border-destructive focus-visible:ring-destructive" : ""}`}
                required
                disabled={isLoading}
              />
            </div>
            {fieldErrors.email && (
              <div className="flex items-center gap-2 text-sm text-destructive">
                <AlertCircle className="h-3 w-3" />
                {fieldErrors.email}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <label
              className="text-sm font-medium leading-none"
              htmlFor="username"
            >
              Username
            </label>
            <div className="relative">
              <UserCircle className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="username"
                type="text"
                placeholder="username"
                value={username}
                onChange={handleUsernameChange}
                className={`pl-10 ${fieldErrors.username ? "border-destructive focus-visible:ring-destructive" : ""}`}
                required
                disabled={isLoading}
              />
            </div>
            {fieldErrors.username && (
              <div className="flex items-center gap-2 text-sm text-destructive">
                <AlertCircle className="h-3 w-3" />
                {fieldErrors.username}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <label
              className="text-sm font-medium leading-none"
              htmlFor="password"
            >
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                onChange={handlePasswordChange}
                className={`pl-10 pr-10 ${fieldErrors.password ? "border-destructive focus-visible:ring-destructive" : ""}`}
                required
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                disabled={isLoading}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
            {password && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-muted rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all ${
                        passwordStrength.strength < 2
                          ? "bg-red-500"
                          : passwordStrength.strength < 4
                            ? "bg-yellow-500"
                            : "bg-green-500"
                      }`}
                      style={{
                        width: `${(passwordStrength.strength / 5) * 100}%`,
                      }}
                    />
                  </div>
                  <span
                    className={`text-xs font-medium ${passwordStrength.color}`}
                  >
                    {passwordStrength.label}
                  </span>
                </div>
              </div>
            )}
            {fieldErrors.password && (
              <div className="flex items-center gap-2 text-sm text-destructive">
                <AlertCircle className="h-3 w-3" />
                {fieldErrors.password}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <label
              className="text-sm font-medium leading-none"
              htmlFor="confirmPassword"
            >
              Confirm Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                placeholder="••••••••"
                value={confirmPassword}
                onChange={handleConfirmPasswordChange}
                className={`pl-10 pr-10 ${
                  fieldErrors.confirmPassword
                    ? "border-destructive focus-visible:ring-destructive"
                    : confirmPassword && password === confirmPassword
                      ? "border-green-500 focus-visible:ring-green-500"
                      : ""
                }`}
                required
                disabled={isLoading}
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
                {confirmPassword &&
                  password === confirmPassword &&
                  !fieldErrors.confirmPassword && (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  )}
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="text-muted-foreground hover:text-foreground"
                  disabled={isLoading}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>
            {fieldErrors.confirmPassword && (
              <div className="flex items-center gap-2 text-sm text-destructive">
                <AlertCircle className="h-3 w-3" />
                {fieldErrors.confirmPassword}
              </div>
            )}
          </div>

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-background border-t-transparent mr-2" />
                Creating account...
              </>
            ) : (
              "Create account"
            )}
          </Button>
        </form>

        <div className="text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link href="/auth/login" className="text-primary hover:underline">
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
