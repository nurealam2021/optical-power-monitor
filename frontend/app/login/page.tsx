"use client";

import { type CSSProperties, useEffect, useState } from "react";
import { getApiBaseUrl } from "../lib/api";

type LoginResponse = {
  access_token: string;
  token_type: string;
  user_id: number;
  name: string;
  email: string;
  role: string;
};

const typingText =
  "Secure access gateway for BAHON Optical Power Monitoring System...";


export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState("");
  const [typedText, setTypedText] = useState("");

  useEffect(() => {
    localStorage.removeItem("bahon_token");
    localStorage.removeItem("bahon_user_name");
    localStorage.removeItem("bahon_user_email");
    localStorage.removeItem("bahon_user_role");
  }, []);

  useEffect(() => {
    let index = 0;
    let deleting = false;
    let timeoutId: number;

    function runTypingAnimation() {
      if (!deleting) {
        setTypedText(typingText.slice(0, index + 1));
        index += 1;

        if (index >= typingText.length) {
          deleting = true;
          timeoutId = window.setTimeout(runTypingAnimation, 1200);
          return;
        }

        timeoutId = window.setTimeout(runTypingAnimation, 55);
        return;
      }

      setTypedText(typingText.slice(0, index - 1));
      index -= 1;

      if (index <= 0) {
        deleting = false;
        timeoutId = window.setTimeout(runTypingAnimation, 500);
        return;
      }

      timeoutId = window.setTimeout(runTypingAnimation, 28);
    }

    runTypingAnimation();

    return () => window.clearTimeout(timeoutId);
  }, []);

  async function handleLogin() {
    if (!email.trim() || !password.trim()) {
      setMessage("Email and password are required.");
      return;
    }

    setMessage("Connecting to backend...");

    try {
      const apiBaseUrl = getApiBaseUrl();

      const response = await fetch(`${apiBaseUrl}/api/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email.trim(),
          password,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        setMessage(`Login failed: ${errorText}`);
        return;
      }

      const data: LoginResponse = await response.json();

      localStorage.setItem("bahon_token", data.access_token);
      localStorage.setItem("bahon_user_name", data.name);
      localStorage.setItem("bahon_user_email", data.email);
      localStorage.setItem("bahon_user_role", data.role);

      setPassword("");
      setMessage("Login successful. Redirecting...");

      window.location.href = "/dashboard";
    } catch {
      setMessage("Connection failed. Backend may not be running on port 8000.");
    }
  }

  return (
    <>
      <main style={styles.page}>
        <div style={styles.gridBg} />
        <div style={styles.glowLeft} />
        <div style={styles.glowRight} />

        <section style={styles.card}>
          <p style={styles.badge}>BAHON ACCESS CONSOLE</p>

          <h1 style={styles.title}>Operator Login v3</h1>

          <p style={styles.subtitle}>
            <span>{typedText}</span>
            <span style={styles.cursor}>|</span>
          </p>

          <form
            autoComplete="off"
            onSubmit={(event) => {
              event.preventDefault();
              handleLogin();
            }}
          >
            <label style={styles.label}>
              Email Address
              <input
                style={styles.input}
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="Enter your email"
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="none"
                spellCheck={false}
              />
            </label>

            <label style={styles.label}>
              Password
              <div style={styles.passwordBox}>
                <input
                  style={styles.passwordInput}
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Enter your password"
                  autoComplete="new-password"
                  autoCorrect="off"
                  autoCapitalize="none"
                  spellCheck={false}
                />

                <button
                  type="button"
                  style={styles.eyeButton}
                  onClick={() => setShowPassword((current) => !current)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  title={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <svg
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      aria-hidden="true"
                    >
                      <path
                        d="M3 3L21 21"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                      />
                      <path
                        d="M10.7 10.7C10.3 11.1 10 11.5 10 12C10 13.1 10.9 14 12 14C12.5 14 12.9 13.8 13.3 13.4"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                      />
                      <path
                        d="M7.4 7.7C5.6 8.7 4.1 10.2 3 12C5 15.3 8.4 17.5 12 17.5C13.4 17.5 14.7 17.2 15.9 16.6"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                      />
                      <path
                        d="M10.7 6.6C11.1 6.5 11.5 6.5 12 6.5C15.6 6.5 19 8.7 21 12C20.4 13 19.7 13.9 18.9 14.7"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                      />
                    </svg>
                  ) : (
                    <svg
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      aria-hidden="true"
                    >
                      <path
                        d="M3 12C5 8.7 8.4 6.5 12 6.5C15.6 6.5 19 8.7 21 12C19 15.3 15.6 17.5 12 17.5C8.4 17.5 5 15.3 3 12Z"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <path
                        d="M12 15C13.7 15 15 13.7 15 12C15 10.3 13.7 9 12 9C10.3 9 9 10.3 9 12C9 13.7 10.3 15 12 15Z"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  )}
                </button>
              </div>
            </label>

            {message && <div style={styles.message}>{message}</div>}

            <button type="submit" style={styles.button}>
              Access System v3
            </button>
          </form>
        </section>
      </main>

      <style>{`
        @keyframes cursorBlink {
          0%, 45% {
            opacity: 1;
          }

          46%, 100% {
            opacity: 0;
          }
        }

        @keyframes royalGlow {
          0% {
            text-shadow:
              0 0 8px rgba(65, 255, 160, 0.55),
              0 0 18px rgba(0, 180, 255, 0.22);
          }

          50% {
            text-shadow:
              0 0 12px rgba(139, 92, 246, 0.85),
              0 0 28px rgba(34, 211, 238, 0.45),
              0 0 40px rgba(65, 255, 160, 0.28);
          }

          100% {
            text-shadow:
              0 0 8px rgba(65, 255, 160, 0.55),
              0 0 18px rgba(0, 180, 255, 0.22);
          }
        }
      `}</style>
    </>
  );
}

const styles: Record<string, CSSProperties> = {
  page: {
    minHeight: "100vh",
    position: "relative",
    overflow: "hidden",
    background:
      "radial-gradient(circle at top left, rgba(0, 255, 140, 0.12), transparent 32%), radial-gradient(circle at bottom right, rgba(102, 51, 255, 0.15), transparent 30%), linear-gradient(180deg, #07110d 0%, #050b08 100%)",
    color: "#e7fff2",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
    fontFamily: "Arial, Helvetica, sans-serif",
  },
  gridBg: {
    position: "fixed",
    inset: 0,
    backgroundImage:
      "linear-gradient(rgba(0,255,140,0.045) 1px, transparent 1px), linear-gradient(90deg, rgba(0,255,140,0.045) 1px, transparent 1px)",
    backgroundSize: "34px 34px",
    pointerEvents: "none",
  },
  glowLeft: {
    position: "fixed",
    width: 320,
    height: 320,
    borderRadius: 999,
    background: "rgba(0, 255, 140, 0.12)",
    filter: "blur(100px)",
    top: 90,
    left: -100,
    pointerEvents: "none",
  },
  glowRight: {
    position: "fixed",
    width: 360,
    height: 360,
    borderRadius: 999,
    background: "rgba(139, 92, 246, 0.15)",
    filter: "blur(110px)",
    bottom: -90,
    right: -90,
    pointerEvents: "none",
  },
  card: {
    position: "relative",
    zIndex: 1,
    width: "100%",
    maxWidth: 560,
    border: "1px solid rgba(61,255,155,0.22)",
    borderRadius: 24,
    background: "rgba(5,12,9,0.95)",
    padding: 34,
    boxShadow:
      "0 0 45px rgba(0,255,140,0.12), inset 0 0 22px rgba(139,92,246,0.05)",
  },
  badge: {
    display: "inline-block",
    padding: "9px 14px",
    borderRadius: 999,
    background: "rgba(35,255,138,0.12)",
    border: "1px solid rgba(61,255,155,0.25)",
    color: "#a7ffca",
    fontFamily: "Courier New, monospace",
    fontWeight: 700,
    fontSize: 12,
    letterSpacing: "0.08em",
  },
  title: {
    marginTop: 28,
    marginBottom: 12,
    fontSize: 42,
    lineHeight: 1.1,
    color: "#f1fff7",
    letterSpacing: "-0.04em",
  },
  subtitle: {
    minHeight: 34,
    color: "#c4b5fd",
    marginBottom: 28,
    fontFamily: "Courier New, monospace",
    fontSize: 16,
    fontWeight: 800,
    letterSpacing: "0.02em",
    background:
      "linear-gradient(90deg, #42ff9a, #22d3ee, #a78bfa, #f0abfc)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    animation: "royalGlow 2.4s ease-in-out infinite",
  },
  cursor: {
    WebkitTextFillColor: "#42ff9a",
    color: "#42ff9a",
    marginLeft: 3,
    animation: "cursorBlink 0.8s infinite",
  },
  label: {
    display: "grid",
    gap: 8,
    marginBottom: 16,
    color: "#bce8ce",
    fontWeight: 700,
  },
  input: {
    height: 56,
    borderRadius: 14,
    border: "1px solid rgba(61,255,155,0.22)",
    background: "#030806",
    color: "#eafff3",
    padding: "0 16px",
    fontSize: 16,
    outline: "none",
  },
  passwordBox: {
    height: 56,
    borderRadius: 14,
    border: "1px solid rgba(61,255,155,0.22)",
    background: "#030806",
    display: "flex",
    alignItems: "center",
    overflow: "hidden",
  },
  passwordInput: {
    flex: 1,
    height: "100%",
    border: "none",
    background: "transparent",
    color: "#eafff3",
    padding: "0 16px",
    fontSize: 16,
    outline: "none",
    minWidth: 0,
  },
  eyeButton: {
    width: 56,
    height: "100%",
    border: "none",
    borderLeft: "1px solid rgba(61,255,155,0.16)",
    background: "rgba(61,255,155,0.06)",
    color: "#42ff9a",
    cursor: "pointer",
    display: "grid",
    placeItems: "center",
  },
  button: {
    width: "100%",
    height: 58,
    border: "none",
    borderRadius: 14,
    background: "linear-gradient(90deg, #22c76b, #42ff9a)",
    color: "#041109",
    fontWeight: 900,
    cursor: "pointer",
    fontSize: 17,
    boxShadow: "0 14px 30px rgba(0, 255, 140, 0.24)",
  },
  message: {
    padding: 12,
    borderRadius: 14,
    marginBottom: 16,
    border: "1px solid rgba(61,255,155,0.20)",
    background: "rgba(61,255,155,0.08)",
    color: "#dffff0",
  },
};
