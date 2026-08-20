"use client";

import { useEffect, useState } from "react";
import { getApiBaseUrl } from "../lib/api";

type UserInfo = {
  id: number;
  name: string;
  email: string;
  role: string;
  status: string;
};


function formatRole(role: string) {
  return role.replace("_", " ").toUpperCase();
}

export default function DashboardPage() {
  const [user, setUser] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadUser() {
      const token = localStorage.getItem("bahon_token");

      if (!token) {
        window.location.href = "/login";
        return;
      }

      try {
        const apiBaseUrl = getApiBaseUrl();

        const response = await fetch(`${apiBaseUrl}/api/auth/me`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          localStorage.clear();
          window.location.href = "/login";
          return;
        }

        const data = await response.json();
        setUser(data);
      } catch (error) {
        localStorage.clear();
        window.location.href = "/login";
      } finally {
        setLoading(false);
      }
    }

    loadUser();
  }, []);

  function logout() {
    localStorage.clear();
    window.location.href = "/login";
  }

  if (loading) {
    return (
      <main className="dashboard-page">
        <div className="loading-box">Loading secure console...</div>

        <style>{`
          .dashboard-page {
            min-height: 100vh;
            display: grid;
            place-items: center;
            background: #050b08;
            color: #9dffbf;
            font-family: "Courier New", Courier, monospace;
          }

          .loading-box {
            border: 1px solid rgba(61, 255, 155, 0.25);
            background: rgba(5, 12, 9, 0.9);
            padding: 22px;
            border-radius: 18px;
          }
        `}</style>
      </main>
    );
  }

  return (
    <>
      <main className="dashboard-page">
        <div className="background-grid" />
        <div className="background-glow glow-one" />
        <div className="background-glow glow-two" />

        <section className="dashboard-shell">
          <aside className="sidebar">
            <div className="brand">
              <div className="brand-mark">N</div>
              <div>
                <div className="brand-title">Team RA$D</div>
                <div className="brand-subtitle">Optical Monitor</div>
              </div>
            </div>

            <nav className="nav-menu">
              <a href="/dashboard" className="nav-item active">
                Dashboard
              </a>
              <a href="/optical-check" className="nav-item">
                Optical Check
              </a>
              <a href="/router-capacity" className="nav-item">
                Port Capacity
              </a>
              <a href="/history" className="nav-item">
                My History
              </a>

              {(user?.role === "admin" || user?.role === "super_admin") && (
                <a href="/users" className="nav-item">
                  Users
                </a>
              )}

              {user?.role === "super_admin" && (
                <>
                  <a href="/router-credentials" className="nav-item">
                    Router Credentials
                  </a>
                  <a href="/all-logs" className="nav-item">
                    All Logs
                  </a>
                </>
              )}
            </nav>

            <button onClick={logout} className="logout-button">
              Logout
            </button>
          </aside>

          <section className="main-panel">
            <header className="topbar">
              <div>
                <div className="terminal-label">SECURE_DASHBOARD</div>
                <h1>Command Console</h1>
              </div>

              <div className="user-card">
                <div className="user-name">{user?.name}</div>
                <div className="user-role">{user ? formatRole(user.role) : ""}</div>
              </div>
            </header>

            <div className="status-banner">
              <div>
                <div className="status-title">System Online</div>
                <div className="status-text">
                  Team TA$D Optical Power Monitor backend and frontend are active.
                </div>
              </div>

              <div className="status-pill">ONLINE</div>
            </div>

            <div className="card-grid">
              <div className="metric-card">
                <div className="metric-label">ACCESS PROFILE</div>
                <div className="metric-value">{user ? formatRole(user.role) : "UNKNOWN"}</div>
                <div className="metric-meta">Role based control enabled</div>
              </div>

              <div className="metric-card">
                <div className="metric-label">ROUTER MODE</div>
                <div className="metric-value">READ ONLY SSH</div>
                <div className="metric-meta">No privileged mode required</div>
              </div>

              <div className="metric-card">
                <div className="metric-label">VENDOR SUPPORT</div>
                <div className="metric-value">HUAWEI / ZTE / CISCO</div>
                <div className="metric-meta">Multi-vendor command engine</div>
              </div>
            </div>

            <div className="quick-actions">
              <div className="section-heading">
                <span>QUICK_ACTIONS</span>
                <strong>Choose an operation</strong>
              </div>

              <div className="action-grid">
                <a href="/optical-check" className="action-card primary">
                  <div className="action-title">Check Optical Power</div>
                  <div className="action-text">
                    Input router IP and interface to read live RX/TX power.
                  </div>
                </a>

                <a href="/history" className="action-card">
                  <div className="action-title">View My History</div>
                  <div className="action-text">
                    Review your previous optical power checks.
                  </div>
                </a>

                {user?.role === "super_admin" && (
                  <a href="/router-credentials" className="action-card danger">
                    <div className="action-title">Manage Credentials</div>
                    <div className="action-text">
                      Add Huawei, ZTE, and Cisco read-only router credentials.
                    </div>
                  </a>
                )}
              </div>
            </div>
          </section>
        </section>
      </main>

      <style>{`
        :root {
          color-scheme: dark;
        }

        * {
          box-sizing: border-box;
        }

        html, body {
          margin: 0;
          padding: 0;
          background: #050b08;
          font-family: Arial, Helvetica, sans-serif;
        }

        a {
          text-decoration: none;
        }

        .dashboard-page {
          min-height: 100vh;
          position: relative;
          overflow-x: hidden;
          background:
            radial-gradient(circle at top left, rgba(0, 255, 140, 0.10), transparent 30%),
            radial-gradient(circle at bottom right, rgba(255, 45, 45, 0.08), transparent 28%),
            linear-gradient(180deg, #07110d 0%, #050b08 100%);
          color: #e7fff2;
        }

        .background-grid {
          position: fixed;
          inset: 0;
          background-image:
            linear-gradient(rgba(0, 255, 140, 0.045) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0, 255, 140, 0.045) 1px, transparent 1px);
          background-size: 34px 34px;
          pointer-events: none;
        }

        .background-glow {
          position: fixed;
          border-radius: 999px;
          filter: blur(100px);
          pointer-events: none;
        }

        .glow-one {
          width: 300px;
          height: 300px;
          background: rgba(0, 255, 140, 0.10);
          top: 60px;
          left: -80px;
        }

        .glow-two {
          width: 340px;
          height: 340px;
          background: rgba(255, 40, 40, 0.07);
          right: -90px;
          bottom: -90px;
        }

        .dashboard-shell {
          position: relative;
          z-index: 1;
          display: grid;
          grid-template-columns: 280px 1fr;
          min-height: 100vh;
          padding: 18px;
          gap: 18px;
        }

        .sidebar {
          border: 1px solid rgba(61, 255, 155, 0.16);
          background: rgba(5, 12, 9, 0.88);
          border-radius: 24px;
          padding: 18px;
          display: flex;
          flex-direction: column;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.35);
          position: sticky;
          top: 18px;
          height: calc(100vh - 36px);
        }

        .brand {
          display: flex;
          align-items: center;
          gap: 12px;
          padding-bottom: 18px;
          border-bottom: 1px solid rgba(61, 255, 155, 0.12);
        }

        .brand-mark {
          width: 44px;
          height: 44px;
          border-radius: 14px;
          display: grid;
          place-items: center;
          background: linear-gradient(135deg, #22c76b, #42ff9a);
          color: #041109;
          font-weight: 900;
          font-size: 22px;
          box-shadow: 0 0 18px rgba(0, 255, 140, 0.22);
        }

        .brand-title {
          font-weight: 900;
          letter-spacing: 0.08em;
        }

        .brand-subtitle {
          color: #7fb395;
          font-size: 13px;
          margin-top: 2px;
        }

        .nav-menu {
          display: grid;
          gap: 8px;
          margin-top: 22px;
        }

        .nav-item {
          color: #bce8ce;
          border: 1px solid transparent;
          border-radius: 14px;
          padding: 13px 14px;
          transition: all 0.2s ease;
          font-weight: 700;
        }

        .nav-item:hover,
        .nav-item.active {
          background: rgba(35, 255, 138, 0.10);
          border-color: rgba(61, 255, 155, 0.20);
          color: #eafff3;
        }

        .logout-button {
          margin-top: auto;
          border: 1px solid rgba(255, 77, 77, 0.26);
          background: rgba(255, 77, 77, 0.08);
          color: #ffc7c7;
          border-radius: 14px;
          padding: 13px 14px;
          cursor: pointer;
          font-weight: 800;
        }

        .main-panel {
          border: 1px solid rgba(61, 255, 155, 0.12);
          background: rgba(5, 12, 9, 0.70);
          border-radius: 24px;
          padding: 22px;
          min-width: 0;
        }

        .topbar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 18px;
          margin-bottom: 22px;
        }

        .terminal-label {
          color: #89d8a9;
          font-family: "Courier New", Courier, monospace;
          font-size: 12px;
          letter-spacing: 0.14em;
          margin-bottom: 8px;
        }

        h1 {
          margin: 0;
          font-size: 34px;
          letter-spacing: -0.03em;
        }

        .user-card {
          border: 1px solid rgba(61, 255, 155, 0.14);
          background: rgba(3, 8, 6, 0.75);
          border-radius: 16px;
          padding: 12px 14px;
          min-width: 210px;
        }

        .user-name {
          font-weight: 800;
          color: #f0fff7;
        }

        .user-role {
          margin-top: 4px;
          color: #7fffad;
          font-family: "Courier New", Courier, monospace;
          font-size: 12px;
        }

        .status-banner {
          border: 1px solid rgba(61, 255, 155, 0.16);
          background:
            linear-gradient(90deg, rgba(35, 255, 138, 0.12), rgba(255, 255, 255, 0.02));
          border-radius: 22px;
          padding: 22px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 18px;
          margin-bottom: 18px;
        }

        .status-title {
          font-size: 22px;
          font-weight: 900;
        }

        .status-text {
          color: #a9cbbb;
          margin-top: 6px;
        }

        .status-pill {
          color: #041109;
          background: #42ff9a;
          border-radius: 999px;
          padding: 9px 13px;
          font-family: "Courier New", Courier, monospace;
          font-weight: 900;
          box-shadow: 0 0 18px rgba(0, 255, 140, 0.22);
        }

        .card-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 16px;
          margin-bottom: 18px;
        }

        .metric-card,
        .quick-actions {
          border: 1px solid rgba(61, 255, 155, 0.12);
          background: rgba(3, 8, 6, 0.65);
          border-radius: 20px;
          padding: 18px;
        }

        .metric-label {
          font-family: "Courier New", Courier, monospace;
          color: #76dba2;
          font-size: 12px;
          font-weight: 800;
          letter-spacing: 0.12em;
        }

        .metric-value {
          margin-top: 10px;
          color: #f0fff7;
          font-size: 20px;
          font-weight: 900;
          line-height: 1.35;
        }

        .metric-meta {
          margin-top: 8px;
          color: #89a596;
          font-size: 13px;
        }

        .section-heading {
          display: flex;
          flex-direction: column;
          gap: 6px;
          margin-bottom: 16px;
        }

        .section-heading span {
          font-family: "Courier New", Courier, monospace;
          color: #76dba2;
          font-size: 12px;
          font-weight: 800;
          letter-spacing: 0.12em;
        }

        .section-heading strong {
          font-size: 22px;
        }

        .action-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 16px;
        }

        .action-card {
          display: block;
          min-height: 150px;
          border-radius: 18px;
          border: 1px solid rgba(61, 255, 155, 0.14);
          background: rgba(255, 255, 255, 0.025);
          padding: 18px;
          color: #dffff0;
          transition: all 0.2s ease;
        }

        .action-card:hover {
          transform: translateY(-2px);
          background: rgba(61, 255, 155, 0.08);
        }

        .action-card.primary {
          background: linear-gradient(135deg, rgba(35, 255, 138, 0.16), rgba(255, 255, 255, 0.02));
        }

        .action-card.danger {
          border-color: rgba(255, 77, 77, 0.20);
          background: rgba(255, 77, 77, 0.05);
        }

        .action-title {
          font-size: 18px;
          font-weight: 900;
        }

        .action-text {
          margin-top: 10px;
          color: #9fbead;
          line-height: 1.55;
          font-size: 14px;
        }

        @media (max-width: 980px) {
          .dashboard-shell {
            grid-template-columns: 1fr;
          }

          .sidebar {
            position: relative;
            height: auto;
            top: auto;
          }

          .nav-menu {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }

          .card-grid,
          .action-grid {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 620px) {
          .dashboard-shell {
            padding: 12px;
          }

          .main-panel,
          .sidebar {
            border-radius: 18px;
            padding: 16px;
          }

          .topbar,
          .status-banner {
            flex-direction: column;
            align-items: flex-start;
          }

          .user-card {
            width: 100%;
          }

          h1 {
            font-size: 28px;
          }

          .nav-menu {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </>
  );
}
