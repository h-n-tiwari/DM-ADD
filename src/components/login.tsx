"use client";

import { authClient } from "@/lib/auth-client";
import { useState } from "react";

export default function Login() {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");

  async function handleGoogleSignIn() {
    setLoading(true);
    setError("");

    try {
      const result = await authClient.signIn.social({
        provider: "google",
        callbackURL: "/dashboard",
      });

      if (result.error) {
        setError(result.error.message || "Google sign-in failed.");
      }
    } catch {
      setError("Could not start Google sign-in. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <button type="button" onClick={handleGoogleSignIn} disabled={loading}>
        {loading ? "Connecting..." : "Continue with Google"}
      </button>
      {error && <p role="alert">{error}</p>}
    </div>
  );
}
