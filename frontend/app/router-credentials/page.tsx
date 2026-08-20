"use client";

import { useEffect, useState } from "react";
import { getApiBaseUrl } from "../lib/api";

type RouterCredential = {
  id: number;
  name: string;
  vendor: string;
  username: string;
  ssh_port: number;
  connection_type: string;
  enable_required: boolean;
  status: string;
  created_at: string;
  updated_at: string;
};


export default function RouterCredentialsPage() {
  const [credentials, setCredentials] = useState<RouterCredential[]>([]);
  const [name, setName] = useState("");
  const [vendor, setVendor] = useState("huawei");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [sshPort, setSshPort] = useState("22");
  const [enableRequired, setEnableRequired] = useState(false);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadCredentials();
  }, []);

  function getToken() {
    return localStorage.getItem("bahon_token");
  }

  async function loadCredentials() {
    const token = getToken();

    if (!token) {
      window.location.href = "/login";
      return;
    }

    try {
      const apiBaseUrl = getApiBaseUrl();

      const response = await fetch(`${apiBaseUrl}/api/router-credentials`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.status === 401 || response.status === 403) {
        setMessage("Access denied. Super Admin permission required.");
        return;
      }

      const data = await response.json();
      setCredentials(data);
    } catch {
      setMessage("Failed to load router credentials.");
    }
  }

  async function addCredential() {
    const token = getToken();

    if (!token) {
      window.location.href = "/login";
      return;
    }

    setLoading(true);
    setMessage("Saving router credential...");

    try {
      const apiBaseUrl = getApiBaseUrl();

      const response = await fetch(`${apiBaseUrl}/api/router-credentials`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name,
          vendor,
          username,
          password,
          ssh_port: Number(sshPort),
          connection_type: "ssh",
          enable_required: enableRequired,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setMessage(`Failed: ${JSON.stringify(data)}`);
        return;
      }

      setMessage("Router credential saved successfully.");

      setName("");
      setUsername("");
      setPassword("");
      setSshPort("22");
      setEnableRequired(false);

      await loadCredentials();
    } catch {
      setMessage("Connection failed. Backend may not be running.");
    } finally {
      setLoading(false);
    }
  }

  async function deleteCredential(id: number) {
    const token = getToken();

    if (!token) {
      window.location.href = "/login";
      return;
    }

    const confirmDelete = window.confirm(
      "Are you sure you want to delete this router credential?"
    );

    if (!confirmDelete) {
      return;
    }

    setMessage("Deleting credential...");

    try {
      const apiBaseUrl = getApiBaseUrl();

      const response = await fetch(`${apiBaseUrl}/api/router-credentials/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const data = await response.json();
        setMessage(`Delete failed: ${JSON.stringify(data)}`);
        return;
      }

      setMessage("Router credential deleted successfully.");
      await loadCredentials();
    } catch {
      setMessage("Connection failed while deleting credential.");
    }
  }

  function logout() {
    localStorage.clear();
    window.location.href = "/login";
  }

  return (
    <>
      <main className="page">
        <div className="grid-bg" />
        <div className="glow glow-left" />
        <div className="glow glow-right" />

        <section className="shell">
          <aside className="sidebar">
            <div className="brand">
              <div className="brand-mark">B</div>
              <div>
                <div className="brand-title">BAHON</div>
                <div className="brand-subtitle">Optical Monitor</div>
              </div>
            </div>

            <nav className="nav">
              <a href="/dashboard" className="nav-link">
                Dashboard
              </a>
              <a href="/optical-check" className="nav-link">
                Optical Check
              </a>
              <a href="/router-capacity" className="nav-link">
                Port Capacity
              </a>
              <a href="/history" className="nav-link">
                My History
              </a>
              <a href="/router-credentials" className="nav-link active">
                Router Credentials
              </a>
            </nav>

            <button onClick={logout} className="logout-button">
              Logout
            </button>
          </aside>

          <section className="content">
            <header className="topbar">
              <div>
                <div className="terminal-label">ROUTER_CREDENTIAL_VAULT</div>
                <h1>Router Credentials</h1>
                <p>
                  Store read-only SSH credentials for Huawei, ZTE, and Cisco
                  routers. Passwords are encrypted in the backend database.
                </p>
              </div>

              <div className="mode-card">
                <span>ACCESS</span>
                <strong>SUPER ADMIN</strong>
              </div>
            </header>

            <div className="main-grid">
              <section className="form-card">
                <div className="card-header">
                  <span>ADD_CREDENTIAL</span>
                  <strong>Read-only SSH Access</strong>
                </div>

                <label className="field-label">
                  Credential Name
                  <input
                    className="field-input"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    placeholder="Example: Huawei Core Readonly"
                  />
                </label>

                <label className="field-label">
                  Vendor
                  <select
                    className="field-input"
                    value={vendor}
                    onChange={(event) => setVendor(event.target.value)}
                  >
                    <option value="huawei">Huawei</option>
                    <option value="zte">ZTE</option>
                    <option value="cisco">Cisco</option>
                  </select>
                </label>

                <label className="field-label">
                  SSH Username
                  <input
                    className="field-input"
                    value={username}
                    onChange={(event) => setUsername(event.target.value)}
                    placeholder="readonly_user"
                  />
                </label>

                <label className="field-label">
                  SSH Password
                  <input
                    className="field-input"
                    type="password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="Router read-only password"
                  />
                </label>

                <label className="field-label">
                  SSH Port
                  <input
                    className="field-input"
                    value={sshPort}
                    onChange={(event) => setSshPort(event.target.value)}
                    placeholder="22"
                  />
                </label>

                <label className="checkbox-row">
                  <input
                    type="checkbox"
                    checked={enableRequired}
                    onChange={(event) => setEnableRequired(event.target.checked)}
                  />
                  <span>Enable mode required</span>
                </label>

                {message && (
                  <div className="message-box">
                    <span className="message-dot" />
                    {message}
                  </div>
                )}

                <button
                  type="button"
                  className="save-button"
                  onClick={addCredential}
                  disabled={loading}
                >
                  {loading ? "Saving..." : "Save Credential"}
                </button>
              </section>

              <section className="list-card">
                <div className="card-header">
                  <span>CREDENTIAL_LIST</span>
                  <strong>Stored Vendors</strong>
                </div>

                {credentials.length === 0 && (
                  <div className="empty-state">
                    <p>No credentials stored yet.</p>
                    <span>Add one credential to start optical checks.</span>
                  </div>
                )}

                <div className="credential-list">
                  {credentials.map((credential) => (
                    <div key={credential.id} className="credential-item">
                      <div>
                        <div className="credential-name">{credential.name}</div>
                        <div className="credential-meta">
                          {credential.vendor.toUpperCase()} · {credential.username} ·
                          Port {credential.ssh_port}
                        </div>
                      </div>

                      <div className="credential-actions">
                        <span className={`status-pill ${credential.status}`}>
                          {credential.status.toUpperCase()}
                        </span>

                        <button
                          type="button"
                          className="delete-button"
                          onClick={() => deleteCredential(credential.id)}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
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

        .page {
          min-height: 100vh;
          position: relative;
          overflow-x: hidden;
          background:
            radial-gradient(circle at top left, rgba(0, 255, 140, 0.10), transparent 30%),
            radial-gradient(circle at bottom right, rgba(255, 45, 45, 0.08), transparent 28%),
            linear-gradient(180deg, #07110d 0%, #050b08 100%);
          color: #e7fff2;
        }

        .grid-bg {
          position: fixed;
          inset: 0;
          background-image:
            linear-gradient(rgba(0, 255, 140, 0.045) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0, 255, 140, 0.045) 1px, transparent 1px);
          background-size: 34px 34px;
          pointer-events: none;
        }

        .glow {
          position: fixed;
          border-radius: 999px;
          filter: blur(100px);
          pointer-events: none;
        }

        .glow-left {
          width: 300px;
          height: 300px;
          background: rgba(0, 255, 140, 0.10);
          top: 70px;
          left: -90px;
        }

        .glow-right {
          width: 340px;
          height: 340px;
          background: rgba(255, 40, 40, 0.07);
          right: -90px;
          bottom: -90px;
        }

        .shell {
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

        .nav {
          display: grid;
          gap: 8px;
          margin-top: 22px;
        }

        .nav-link {
          color: #bce8ce;
          border: 1px solid transparent;
          border-radius: 14px;
          padding: 13px 14px;
          transition: all 0.2s ease;
          font-weight: 700;
        }

        .nav-link:hover,
        .nav-link.active {
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

        .content {
          border: 1px solid rgba(61, 255, 155, 0.12);
          background: rgba(5, 12, 9, 0.70);
          border-radius: 24px;
          padding: 22px;
          min-width: 0;
        }

        .topbar {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 18px;
          margin-bottom: 22px;
        }

        .terminal-label,
        .card-header span,
        .mode-card span {
          color: #76dba2;
          font-family: "Courier New", Courier, monospace;
          font-size: 12px;
          font-weight: 800;
          letter-spacing: 0.12em;
        }

        h1 {
          margin: 0;
          font-size: 34px;
          letter-spacing: -0.03em;
        }

        .topbar p {
          color: #a9cbbb;
          margin: 8px 0 0;
          max-width: 760px;
          line-height: 1.6;
        }

        .mode-card {
          min-width: 210px;
          border: 1px solid rgba(61, 255, 155, 0.14);
          background: rgba(3, 8, 6, 0.75);
          border-radius: 16px;
          padding: 14px;
        }

        .mode-card strong {
          display: block;
          margin-top: 7px;
          color: #42ff9a;
        }

        .main-grid {
          display: grid;
          grid-template-columns: minmax(320px, 0.9fr) minmax(320px, 1.1fr);
          gap: 18px;
        }

        .form-card,
        .list-card {
          border: 1px solid rgba(61, 255, 155, 0.12);
          background: rgba(3, 8, 6, 0.68);
          border-radius: 22px;
          padding: 20px;
        }

        .card-header {
          display: grid;
          gap: 6px;
          margin-bottom: 18px;
        }

        .card-header strong {
          font-size: 22px;
        }

        .field-label {
          display: grid;
          gap: 8px;
          margin-bottom: 16px;
          color: #bce8ce;
          font-size: 13px;
          font-weight: 800;
        }

        .field-input {
          height: 50px;
          border-radius: 14px;
          border: 1px solid rgba(61, 255, 155, 0.18);
          background: rgba(5, 12, 9, 0.92);
          color: #eafff3;
          outline: none;
          padding: 0 14px;
          font-size: 15px;
        }

        .field-input:focus {
          border-color: rgba(76, 255, 160, 0.60);
          box-shadow: 0 0 0 4px rgba(76, 255, 160, 0.08);
        }

        .checkbox-row {
          display: flex;
          align-items: center;
          gap: 10px;
          color: #bce8ce;
          font-weight: 800;
          font-size: 13px;
          margin-bottom: 16px;
        }

        .message-box {
          display: flex;
          align-items: center;
          gap: 10px;
          border-radius: 14px;
          border: 1px solid rgba(61, 255, 155, 0.20);
          background: rgba(61, 255, 155, 0.08);
          color: #dffff0;
          padding: 12px;
          font-size: 14px;
          margin-bottom: 16px;
        }

        .message-dot {
          width: 9px;
          height: 9px;
          border-radius: 999px;
          background: #42ff9a;
          box-shadow: 0 0 10px rgba(66, 255, 154, 0.7);
        }

        .save-button {
          width: 100%;
          height: 52px;
          border: none;
          border-radius: 14px;
          background: linear-gradient(90deg, #22c76b, #42ff9a);
          color: #041109;
          font-size: 15px;
          font-weight: 900;
          cursor: pointer;
          box-shadow: 0 12px 28px rgba(0, 255, 140, 0.22);
        }

        .save-button:disabled {
          opacity: 0.65;
          cursor: not-allowed;
        }

        .empty-state {
          border: 1px dashed rgba(61, 255, 155, 0.18);
          border-radius: 18px;
          padding: 24px;
          color: #a9cbbb;
        }

        .empty-state p {
          margin: 0;
          font-size: 20px;
          font-weight: 900;
          color: #f0fff7;
        }

        .empty-state span {
          display: block;
          margin-top: 8px;
        }

        .credential-list {
          display: grid;
          gap: 12px;
        }

        .credential-item {
          border: 1px solid rgba(61, 255, 155, 0.12);
          background: rgba(255, 255, 255, 0.025);
          border-radius: 18px;
          padding: 16px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
        }

        .credential-name {
          font-weight: 900;
          color: #f0fff7;
        }

        .credential-meta {
          margin-top: 6px;
          color: #9fbead;
          font-size: 13px;
          font-family: "Courier New", Courier, monospace;
        }

        .credential-actions {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .status-pill {
          border-radius: 999px;
          padding: 8px 10px;
          font-size: 12px;
          font-family: "Courier New", Courier, monospace;
          font-weight: 900;
        }

        .status-pill.active {
          background: rgba(66, 255, 154, 0.14);
          color: #42ff9a;
          border: 1px solid rgba(66, 255, 154, 0.35);
        }

        .status-pill.disabled {
          background: rgba(180, 190, 185, 0.14);
          color: #c6d0ca;
          border: 1px solid rgba(180, 190, 185, 0.25);
        }

        .delete-button {
          border: 1px solid rgba(255, 77, 77, 0.26);
          background: rgba(255, 77, 77, 0.08);
          color: #ffc7c7;
          border-radius: 12px;
          padding: 9px 12px;
          cursor: pointer;
          font-weight: 800;
        }

        @media (max-width: 1050px) {
          .shell {
            grid-template-columns: 1fr;
          }

          .sidebar {
            position: relative;
            height: auto;
            top: auto;
          }

          .nav {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }

          .main-grid {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 640px) {
          .shell {
            padding: 12px;
          }

          .content,
          .sidebar {
            border-radius: 18px;
            padding: 16px;
          }

          .topbar {
            flex-direction: column;
          }

          .mode-card {
            width: 100%;
          }

          h1 {
            font-size: 28px;
          }

          .nav {
            grid-template-columns: 1fr;
          }

          .credential-item {
            flex-direction: column;
            align-items: flex-start;
          }

          .credential-actions {
            width: 100%;
            justify-content: space-between;
          }
        }
      `}</style>
    </>
  );
}
