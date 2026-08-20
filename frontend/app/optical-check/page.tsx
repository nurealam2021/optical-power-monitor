"use client";

import { useEffect, useState } from "react";
import { getApiBaseUrl } from "../lib/api";

type OpticalResult = {
  router_ip: string;
  vendor: string;
  interface: string;
  port_status: string | null;
  rx_power: string | null;
  tx_power: string | null;
  status: string;
  checked_at: string;
  message: string | null;
};


function getStatusClass(status: string) {
  if (status === "normal") return "status-normal";
  if (status === "warning") return "status-warning";
  if (status === "critical") return "status-critical";
  if (status === "failed") return "status-failed";
  return "status-unknown";
}

export default function OpticalCheckPage() {
  const [routerIp, setRouterIp] = useState("");
  const [interfaceName, setInterfaceName] = useState("");
  const [result, setResult] = useState<OpticalResult | null>(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("bahon_token");

    if (!token) {
      window.location.href = "/login";
    }
  }, []);

  async function checkOpticalPower() {
    const token = localStorage.getItem("bahon_token");

    if (!token) {
      window.location.href = "/login";
      return;
    }

    setLoading(true);
    setMessage("Sending secure optical check request...");
    setResult(null);

    try {
      const apiBaseUrl = getApiBaseUrl();

      const response = await fetch(`${apiBaseUrl}/api/optical/check`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          router_ip: routerIp,
          interface: interfaceName,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setMessage(`Request failed: ${JSON.stringify(data)}`);
        return;
      }

      setResult(data);
      setMessage(data.message || "Optical check completed.");
    } catch {
      setMessage("Connection failed. Make sure backend is running on port 8000.");
    } finally {
      setLoading(false);
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
              <a href="/dashboard" className="nav-link">Dashboard</a>
              <a href="/optical-check" className="nav-link active">Optical Check</a>
              <a href="/router-capacity" className="nav-link">Port Capacity</a>
              <a href="/history" className="nav-link">My History</a>
              <a href="/router-credentials" className="nav-link">Router Credentials</a>
            </nav>

            <button onClick={logout} className="logout-button">
              Logout
            </button>
          </aside>

          <section className="content">
            <header className="topbar">
              <div>
                <div className="terminal-label">OPTICAL_POWER_CHECK</div>
                <h1>Live Port Probe</h1>
                <p>
                  Enter only router management IP and interface. Vendor will be
                  detected from Router Inventory.
                </p>
              </div>

              <div className="mode-card">
                <span>MODE</span>
                <strong>IP + PORT</strong>
              </div>
            </header>

            <div className="main-grid">
              <section className="form-card">
                <div className="card-header">
                  <span>INPUT_TARGET</span>
                  <strong>Router Port</strong>
                </div>

                <label className="field-label">
                  Router Management IP
                  <input
                    className="field-input"
                    value={routerIp}
                    onChange={(event) => setRouterIp(event.target.value)}
                    placeholder="Example: 10.24.39.149"
                  />
                </label>

                <label className="field-label">
                  Interface / Port
                  <input
                    className="field-input"
                    value={interfaceName}
                    onChange={(event) => setInterfaceName(event.target.value)}
                    placeholder="Example: GE0/2/1 or Te0/0/0/7"
                  />
                </label>

                {message && (
                  <div className="message-box">
                    <span className="message-dot" />
                    {message}
                  </div>
                )}

                <button
                  type="button"
                  className="check-button"
                  onClick={checkOpticalPower}
                  disabled={loading}
                >
                  {loading ? "Checking..." : "Check Port Status + RX/TX"}
                </button>
              </section>

              <section className="result-card">
                <div className="card-header">
                  <span>LIVE_RESULT</span>
                  <strong>Port Status / RX / TX</strong>
                </div>

                {!result && (
                  <div className="empty-state">
                    <div className="scanner-line" />
                    <p>No result yet.</p>
                    <span>Run a check to view port status and optical level.</span>
                  </div>
                )}

                {result && (
                  <div className="result-panel">
                    <div className={`status-badge ${getStatusClass(result.status)}`}>
                      {result.status.toUpperCase()}
                    </div>

                    <div className="power-grid">
                      <div className="power-box">
                        <span>PORT STATUS</span>
                        <strong>{result.port_status || "N/A"}</strong>
                      </div>

                      <div className="power-box">
                        <span>RX POWER</span>
                        <strong>{result.rx_power || "N/A"}</strong>
                      </div>

                      <div className="power-box">
                        <span>TX POWER</span>
                        <strong>{result.tx_power || "N/A"}</strong>
                      </div>
                    </div>

                    <div className="result-lines">
                      <div>
                        <span>ROUTER_IP</span>
                        <strong>{result.router_ip}</strong>
                      </div>

                      <div>
                        <span>VENDOR</span>
                        <strong>{result.vendor.toUpperCase()}</strong>
                      </div>

                      <div>
                        <span>INTERFACE</span>
                        <strong>{result.interface}</strong>
                      </div>

                      <div>
                        <span>CHECKED_AT</span>
                        <strong>{new Date(result.checked_at).toLocaleString()}</strong>
                      </div>
                    </div>
                  </div>
                )}
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
        .power-box span,
        .result-lines span,
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
          max-width: 720px;
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
        .result-card {
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

        .check-button {
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

        .check-button:disabled {
          opacity: 0.65;
          cursor: not-allowed;
        }

        .empty-state {
          min-height: 360px;
          border: 1px dashed rgba(61, 255, 155, 0.18);
          border-radius: 18px;
          display: grid;
          place-items: center;
          text-align: center;
          padding: 24px;
          color: #a9cbbb;
          position: relative;
          overflow: hidden;
        }

        .scanner-line {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 2px;
          background: #42ff9a;
          box-shadow: 0 0 18px rgba(66, 255, 154, 0.7);
        }

        .empty-state p {
          margin: 0;
          font-size: 22px;
          font-weight: 900;
          color: #f0fff7;
        }

        .empty-state span {
          display: block;
          margin-top: 8px;
        }

        .result-panel {
          display: grid;
          gap: 18px;
        }

        .status-badge {
          display: inline-flex;
          width: fit-content;
          padding: 9px 14px;
          border-radius: 999px;
          font-family: "Courier New", Courier, monospace;
          font-weight: 900;
          letter-spacing: 0.10em;
        }

        .status-normal {
          background: rgba(66, 255, 154, 0.14);
          color: #42ff9a;
          border: 1px solid rgba(66, 255, 154, 0.35);
        }

        .status-warning {
          background: rgba(255, 191, 71, 0.14);
          color: #ffbf47;
          border: 1px solid rgba(255, 191, 71, 0.35);
        }

        .status-critical,
        .status-failed {
          background: rgba(255, 77, 77, 0.14);
          color: #ff8f8f;
          border: 1px solid rgba(255, 77, 77, 0.35);
        }

        .status-unknown {
          background: rgba(180, 190, 185, 0.14);
          color: #c6d0ca;
          border: 1px solid rgba(180, 190, 185, 0.25);
        }

        .power-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 14px;
        }

        .power-box {
          border: 1px solid rgba(61, 255, 155, 0.14);
          background: rgba(255, 255, 255, 0.025);
          border-radius: 18px;
          padding: 18px;
        }

        .power-box strong {
          display: block;
          margin-top: 10px;
          font-size: 28px;
          color: #f0fff7;
        }

        .result-lines {
          display: grid;
          gap: 10px;
        }

        .result-lines div {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          border-bottom: 1px dashed rgba(61, 255, 155, 0.10);
          padding: 11px 0;
        }

        .result-lines strong {
          color: #eafff3;
          text-align: right;
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

          .power-grid {
            grid-template-columns: 1fr;
          }

          .result-lines div {
            flex-direction: column;
            align-items: flex-start;
          }

          .result-lines strong {
            text-align: left;
          }
        }
      `}</style>
    </>
  );
}
