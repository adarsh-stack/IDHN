"use client";

import React, { useState } from "react";
import { handleLogin } from "../actions";
import Link from "next/link";
export default function LoginPage() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setLoading(true);

    const formData = new FormData(event.currentTarget);
    const result = await handleLogin(formData);

    setLoading(false);

    if (result.success && result.user) {
      // Store the user session details in localStorage
      localStorage.setItem("idhn_session", JSON.stringify(result.user));

      // PATCH: Change redirection from '/home' to absolute root '/'
      window.location.href = "/";
    } else {
      setError(result.message);
    }
  };

  return (
    <div style={styles.container}>
      <form onSubmit={handleSubmit} style={styles.card}>
        <h2 style={styles.title}>IDHN Authentication</h2>
        <p style={styles.subtitle}>Integrated Digital Healthcare Network</p>

        {error && <div style={styles.errorAlert}>{error}</div>}

        <div style={styles.inputGroup}>
          <label style={styles.label}>Hospital Email Address</label>
          <input
            type="email"
            name="email"
            required
            placeholder="doctor@idhn.local"
            style={styles.input}
          />
        </div>

        <div style={styles.inputGroup}>
          <label style={styles.label}>Security Password</label>
          <input
            type="password"
            name="password"
            required
            placeholder="••••••••"
            style={styles.input}
          />
        </div>

        <button type="submit" disabled={loading} style={styles.button}>
          {loading ? "Verifying Credentials..." : "Secure Log In"}
        </button>
        <p
          style={{
            color: "#888",
            fontSize: "0.8rem",
            textAlign: "center",
            marginTop: "1.5rem",
          }}
        >
          New to this system terminal?{" "}
          <Link
            href="/register"
            style={{ color: "#14b8a6", textDecoration: "none" }}
          >
            Register New Member
          </Link>
        </p>
      </form>
    </div>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    minHeight: "100vh",
    backgroundColor: "#121212",
  },
  card: {
    backgroundColor: "#1a1a1a",
    padding: "2.5rem",
    borderRadius: "16px",
    border: "1px solid #333",
    width: "100%",
    maxWidth: "400px",
    boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
  },
  title: {
    color: "#fff",
    fontSize: "1.6rem",
    fontWeight: "bold",
    textAlign: "center",
    margin: "0 0 0.5rem 0",
  },
  subtitle: {
    color: "#888",
    fontSize: "0.85rem",
    textAlign: "center",
    margin: "0 0 2rem 0",
  },
  errorAlert: {
    backgroundColor: "#ff4d4d22",
    color: "#ff4d4d",
    border: "1px solid #ff4d4d44",
    padding: "0.75rem",
    borderRadius: "8px",
    fontSize: "0.85rem",
    marginBottom: "1.5rem",
    textAlign: "center",
  },
  inputGroup: {
    marginBottom: "1.25rem",
  },
  label: {
    display: "block",
    color: "#ccc",
    fontSize: "0.85rem",
    marginBottom: "0.5rem",
    fontWeight: 500,
  },
  input: {
    width: "100%",
    padding: "0.75rem 1rem",
    borderRadius: "8px",
    border: "1px solid #444",
    backgroundColor: "#262626",
    color: "#fff",
    fontSize: "0.95rem",
    boxSizing: "border-box",
  },
  button: {
    width: "100%",
    padding: "0.75rem",
    borderRadius: "8px",
    border: "none",
    backgroundColor: "#3b82f6",
    color: "#fff",
    fontWeight: "bold",
    fontSize: "1rem",
    cursor: "pointer",
    marginTop: "1rem",
    transition: "background-color 0.2s",
  },
};
