"use client";

import { useEffect, useMemo, useState } from "react";
import { getApiBaseUrl } from "../lib/api";

type RouterInventoryItem = {
  id: number;
  router_name: string | null;
  management_ip: string;
  vendor: string;
  status: string;
};

type PortInfo = {
  interface_name: string;
  speed: string;
  status: string;
  description: string | null;
  is_free: boolean;
};

type SpeedBreakdown = {
  speed: string;
  total: number;
  free: number;
  used: number;
};

type CapacityResult = {
  router_ip: string;
  vendor: string | null;
  total_ports: number;
  free_ports: number;
  used_ports: number;
  breakdown_by_speed: SpeedBreakdown[];
  ports: PortInfo[];
  checked_at: string;
  message: string | null;
};


export default function RouterCapacityPage() {
  const [routers, setRouters] = useState<RouterInventoryItem[]>([]);
  const [routerSearch, setRouterSearch] = useState("");
  const [selectedIp, setSelectedIp] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const [result, setResult] = useState<CapacityResult | null>(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("bahon_token");

    if (!token) {
      window.location.href = "/login";
      return;
    }

    loadRouters();
  }, []);

  function getToken() {
    return localStorage.getItem("bahon_token");
  }

  async function loadRouters() {
    const token = getToken();

    if (!token) {
      return;
    }

    try {
      const apiBaseUrl = getApiBaseUrl();

      const response = await fetch(`${apiBaseUrl}/api/router-inventory`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.status === 401) {
        localStorage.clear();
        window.location.href = "/login";
        return;
      }

      if (!response.ok) {
        return;
      }

      const data = await response.json();
      setRouters(data);
    } catch {
      // Silent -- the select box just stays empty, user can still type
      // an IP manually if they know it isn't in inventory yet.
    }
  }

  const filteredRouters = useMemo(() => {
    const query = routerSearch.trim().toLowerCase();

    if (!query) {
      return routers;
    }

    return routers.filter((router) => {
      const name = (router.router_name || "").toLowerCase();
      const ip = router.management_ip.toLowerCase();

      return name.includes(query) || ip.includes(query);
    });
  }, [routers, routerSearch]);

  const selectedRouter = routers.find(
    (router) => router.management_ip === selectedIp
  );

  function selectRouter(router: RouterInventoryItem) {
    setSelectedIp(router.management_ip);
    setRouterSearch(`${router.router_name || "Unnamed"} · ${router.management_ip}`);
    setDropdownOpen(false);
  }

  async function checkCapacity() {
    const token = getToken();

    if (!token) {
      window.location.href = "/login";
      return;
    }

    if (!selectedIp) {
      setMessage("Select a router first.");
      return;
    }

    setLoading(true);
    setMessage("Connecting to router and reading interface table...");
    setResult(null);

    try {
      const apiBaseUrl = getApiBaseUrl();

      const response = await fetch(`${apiBaseUrl}/api/capacity/check`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ router_ip: selectedIp }),
      });

      if (response.status === 401) {
        localStorage.clear();
        window.location.href = "/login";
        return;
      }

      const data = await response.json();

      if (!response.ok) {
        setMessage(
          typeof data.detail === "string"
            ? data.detail
            : "Capacity check failed."
        );
        setLoading(false);
        return;
      }

      setResult(data);
      setMessage(data.message || "");
    } catch {
      setMessage("Connection failed while checking router capacity.");
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
              <a href="/dashboard" className="nav-link">
                Dashboard
              </a>
              <a href="/optical-check" className="nav-link">
                Optical Check
              </a>
              <a href="/router-capacity" className="nav-link active">
                Port Capacity
              </a>
              <a href="/history" className="nav-link">
                My History
              </a>
              <a href="/router-inventory" className="nav-link">
                Router Inventory
              </a>
              <a href="/router-credentials" className="nav-link">
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
                <div className="terminal-label">PORT_CAPACITY_CHECK</div>
                <h1>Router Port Capacity</h1>
                <p>
                  Select a router to see total ports, free ports by speed
                  (10G / 1G / 100G), and a full interface listing pulled
                  live over SSH.
                </p>
              </div>

              <div className="mode-card">
                <span>MODE</span>
                <strong>LIVE SSH</strong>
              </div>
            </header>

            <div className="main-grid">
              <section className="form-card">
                <div className="card-header">
                  <span>SELECT_TARGET</span>
                  <strong>Router</strong>
                </div>

                <div className="select-wrap">
                  <label className="field-label">
                    Search or Select Router
                    <input
                      className="field-input"
                      value={routerSearch}
                      onChange={(event) => {
                        setRouterSearch(event.target.value);
                        setSelectedIp("");
                        setDropdownOpen(true);
                      }}
                      onFocus={() => setDropdownOpen(true)}
                      placeholder="Type router name or IP..."
                    />
                  </label>

                  {dropdownOpen && (
                    <div className="dropdown">
                      {filteredRouters.length === 0 && (
                        <div className="dropdown-empty">
                          No routers match. Add one under Router Inventory.
                        </div>
                      )}

                      {filteredRouters.map((router) => (
                        <button
                          type="button"
                          key={router.id}
                          className="dropdown-item"
                          onClick={() => selectRouter(router)}
                        >
                          <span className="dropdown-name">
                            {router.router_name || "Unnamed Router"}
                          </span>
                          <span className="dropdown-meta">
                            {router.management_ip} · {router.vendor.toUpperCase()}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {selectedRouter && (
                  <div className="selected-card">
                    <div className="selected-row">
                      <span>Router</span>
                      <strong>{selectedRouter.router_name || "Unnamed"}</strong>
                    </div>
                    <div className="selected-row">
                      <span>IP</span>
                      <strong>{selectedRouter.management_ip}</strong>
                    </div>
                    <div className="selected-row">
                      <span>Vendor</span>
                      <strong>{selectedRouter.vendor.toUpperCase()}</strong>
                    </div>
                  </div>
                )}

                {message && (
                  <div className="message-box">
                    <span className="message-dot" />
                    {message}
                  </div>
                )}

                <button
                  type="button"
                  className="save-button"
                  onClick={checkCapacity}
                  disabled={loading || !selectedIp}
                >
                  {loading ? "Checking..." : "Check Port Capacity"}
                </button>

                <div className="hint-box">
                  Free-port detection is a best-effort heuristic: a port
                  counts as free when it is currently down AND has no
                  description configured on it. Ports that are down but
                  carry a description are treated as reserved, not free.
                </div>
              </section>

              <section className="list-card">
                <div className="card-header">
                  <span>RESULT</span>
                  <strong>Capacity Summary</strong>
                </div>

                {!result && (
                  <div className="empty-state">
                    <p>No capacity check run yet.</p>
                    <span>
                      Select a router on the left and click Check Port
                      Capacity.
                    </span>
                  </div>
                )}

                {result && (
                  <>
                    <div className="summary-grid">
                      <div className="summary-card">
                        <span>TOTAL PORTS</span>
                        <strong>{result.total_ports}</strong>
                      </div>
                      <div className="summary-card free">
                        <span>FREE PORTS</span>
                        <strong>{result.free_ports}</strong>
                      </div>
                      <div className="summary-card used">
                        <span>USED PORTS</span>
                        <strong>{result.used_ports}</strong>
                      </div>
                    </div>

                    {result.breakdown_by_speed.length > 0 && (
                      <div className="speed-breakdown">
                        {result.breakdown_by_speed.map((row) => (
                          <div key={row.speed} className="speed-row">
                            <span className="speed-tag">{row.speed}</span>
                            <span className="speed-detail">
                              {row.free} free / {row.total} total
                            </span>
                            <div className="speed-bar">
                              <div
                                className="speed-bar-fill"
                                style={{
                                  width:
                                    row.total > 0
                                      ? `${(row.free / row.total) * 100}%`
                                      : "0%",
                                }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="port-table-wrap">
                      <table className="port-table">
                        <thead>
                          <tr>
                            <th>Interface</th>
                            <th>Speed</th>
                            <th>Status</th>
                            <th>Description</th>
                            <th>Free?</th>
                          </tr>
                        </thead>
                        <tbody>
                          {result.ports.map((port) => (
                            <tr key={port.interface_name}>
                              <td>{port.interface_name}</td>
                              <td>{port.speed}</td>
                              <td>
                                <span
                                  className={`status-pill-sm ${port.status}`}
                                >
                                  {port.status.toUpperCase()}
                                </span>
                              </td>
                              <td>{port.description || "—"}</td>
                              <td>
                                {port.is_free ? (
                                  <span className="free-yes">FREE</span>
                                ) : (
                                  <span className="free-no">USED</span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </>
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

        .page {
          position: relative;
          min-height: 100vh;
          background: #050b08;
          color: #d9f5e6;
          overflow: hidden;
        }

        .grid-bg {
          position: absolute;
          inset: 0;
          background-image:
            linear-gradient(rgba(61, 255, 155, 0.06) 1px, transparent 1px),
            linear-gradient(90deg, rgba(61, 255, 155, 0.06) 1px, transparent 1px);
          background-size: 34px 34px;
          pointer-events: none;
        }

        .glow {
          position: absolute;
          width: 480px;
          height: 480px;
          border-radius: 50%;
          filter: blur(120px);
          opacity: 0.18;
          pointer-events: none;
        }

        .glow-left {
          background: #14ffa0;
          top: -120px;
          left: -160px;
        }

        .glow-right {
          background: #0aa3ff;
          bottom: -160px;
          right: -160px;
        }

        .shell {
          position: relative;
          display: flex;
          min-height: 100vh;
        }

        .sidebar {
          width: 260px;
          flex-shrink: 0;
          padding: 28px 20px;
          border-right: 1px solid rgba(61, 255, 155, 0.12);
          display: flex;
          flex-direction: column;
          gap: 26px;
        }

        .brand {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .brand-mark {
          width: 40px;
          height: 40px;
          border-radius: 12px;
          background: linear-gradient(135deg, #17ffa3, #0a8f5c);
          color: #04160e;
          font-weight: 800;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 18px;
        }

        .brand-title {
          font-weight: 800;
          letter-spacing: 0.04em;
        }

        .brand-subtitle {
          font-size: 12px;
          color: #93c9ac;
        }

        .nav {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .nav-link {
          color: #b7ecd1;
          text-decoration: none;
          padding: 11px 14px;
          border-radius: 12px;
          font-size: 14px;
        }

        .nav-link:hover {
          background: rgba(61, 255, 155, 0.08);
        }

        .nav-link.active {
          background: rgba(61, 255, 155, 0.14);
          color: #eafff3;
          font-weight: 700;
          border: 1px solid rgba(61, 255, 155, 0.28);
        }

        .logout-button {
          margin-top: auto;
          background: rgba(255, 80, 80, 0.08);
          border: 1px solid rgba(255, 80, 80, 0.3);
          color: #ff9a9a;
          padding: 11px 14px;
          border-radius: 12px;
          cursor: pointer;
          font-weight: 700;
        }

        .content {
          flex: 1;
          padding: 32px 36px 60px;
          max-width: 1400px;
        }

        .topbar {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 20px;
          margin-bottom: 24px;
        }

        .terminal-label {
          color: #59ffac;
          font-size: 12px;
          letter-spacing: 0.14em;
          font-weight: 700;
        }

        h1 {
          margin: 6px 0 10px;
          font-size: 30px;
        }

        .topbar p {
          margin: 0;
          max-width: 620px;
          color: #a9d4bd;
          font-size: 14px;
          line-height: 1.5;
        }

        .mode-card {
          border: 1px solid rgba(61, 255, 155, 0.2);
          background: rgba(3, 8, 6, 0.68);
          border-radius: 16px;
          padding: 14px 18px;
          font-size: 12px;
          color: #93c9ac;
          text-align: right;
          white-space: nowrap;
        }

        .mode-card strong {
          display: block;
          margin-top: 7px;
          color: #42ff9a;
        }

        .main-grid {
          display: grid;
          grid-template-columns: minmax(300px, 0.8fr) minmax(360px, 1.2fr);
          gap: 18px;
          align-items: start;
        }

        .form-card,
        .list-card {
          border: 1px solid rgba(61, 255, 155, 0.12);
          background: rgba(3, 8, 6, 0.68);
          border-radius: 22px;
          padding: 20px;
        }

        .card-header {
          margin-bottom: 16px;
        }

        .card-header span {
          display: block;
          font-size: 11px;
          letter-spacing: 0.12em;
          color: #59ffac;
          font-weight: 700;
        }

        .card-header strong {
          display: block;
          font-size: 19px;
          margin-top: 4px;
        }

        .select-wrap {
          position: relative;
        }

        .field-label {
          display: block;
          font-size: 13px;
          color: #a9d4bd;
          margin-bottom: 14px;
        }

        .field-input {
          display: block;
          width: 100%;
          margin-top: 8px;
          padding: 12px 14px;
          border-radius: 12px;
          border: 1px solid rgba(61, 255, 155, 0.18);
          background: rgba(6, 14, 10, 0.9);
          color: #eafff3;
          font-size: 14px;
          outline: none;
        }

        .field-input:focus {
          border-color: rgba(61, 255, 155, 0.5);
        }

        .dropdown {
          position: absolute;
          top: 100%;
          left: 0;
          right: 0;
          z-index: 20;
          margin-top: -8px;
          max-height: 260px;
          overflow-y: auto;
          border: 1px solid rgba(61, 255, 155, 0.25);
          background: #061109;
          border-radius: 12px;
          box-shadow: 0 12px 30px rgba(0, 0, 0, 0.5);
        }

        .dropdown-empty {
          padding: 14px;
          font-size: 13px;
          color: #93c9ac;
        }

        .dropdown-item {
          display: flex;
          flex-direction: column;
          gap: 3px;
          width: 100%;
          text-align: left;
          padding: 10px 14px;
          background: transparent;
          border: none;
          border-bottom: 1px solid rgba(61, 255, 155, 0.08);
          color: #eafff3;
          cursor: pointer;
        }

        .dropdown-item:last-child {
          border-bottom: none;
        }

        .dropdown-item:hover {
          background: rgba(61, 255, 155, 0.1);
        }

        .dropdown-name {
          font-size: 14px;
          font-weight: 600;
        }

        .dropdown-meta {
          font-size: 12px;
          color: #93c9ac;
        }

        .selected-card {
          margin-top: 16px;
          border: 1px solid rgba(61, 255, 155, 0.18);
          border-radius: 14px;
          padding: 12px 14px;
          background: rgba(6, 14, 10, 0.6);
        }

        .selected-row {
          display: flex;
          justify-content: space-between;
          font-size: 13px;
          padding: 4px 0;
          color: #a9d4bd;
        }

        .selected-row strong {
          color: #eafff3;
        }

        .message-box {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-top: 16px;
          padding: 12px 14px;
          border-radius: 12px;
          background: rgba(61, 255, 155, 0.08);
          border: 1px solid rgba(61, 255, 155, 0.2);
          font-size: 13px;
          color: #d3ffe9;
        }

        .message-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: #42ff9a;
          flex-shrink: 0;
        }

        .save-button {
          margin-top: 18px;
          width: 100%;
          padding: 14px;
          border: none;
          border-radius: 14px;
          background: linear-gradient(135deg, #22ffa8, #0f9e63);
          color: #04160e;
          font-weight: 800;
          font-size: 14px;
          cursor: pointer;
        }

        .save-button:disabled {
          opacity: 0.55;
          cursor: not-allowed;
        }

        .hint-box {
          margin-top: 16px;
          font-size: 12px;
          line-height: 1.5;
          color: #7fa791;
          border-top: 1px solid rgba(61, 255, 155, 0.1);
          padding-top: 14px;
        }

        .empty-state {
          padding: 40px 20px;
          text-align: center;
          color: #93c9ac;
        }

        .empty-state p {
          font-size: 15px;
          font-weight: 700;
          color: #d9f5e6;
          margin: 0 0 6px;
        }

        .empty-state span {
          font-size: 13px;
        }

        .summary-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
          margin-bottom: 20px;
        }

        .summary-card {
          border: 1px solid rgba(61, 255, 155, 0.18);
          border-radius: 14px;
          padding: 14px;
          background: rgba(6, 14, 10, 0.6);
        }

        .summary-card span {
          display: block;
          font-size: 11px;
          letter-spacing: 0.08em;
          color: #93c9ac;
        }

        .summary-card strong {
          display: block;
          margin-top: 8px;
          font-size: 26px;
        }

        .summary-card.free strong {
          color: #42ff9a;
        }

        .summary-card.used strong {
          color: #ffb84d;
        }

        .speed-breakdown {
          display: flex;
          flex-direction: column;
          gap: 12px;
          margin-bottom: 22px;
        }

        .speed-row {
          display: grid;
          grid-template-columns: 60px 1fr;
          grid-template-rows: auto auto;
          gap: 4px 10px;
          align-items: center;
        }

        .speed-tag {
          font-weight: 800;
          color: #59ffac;
          font-size: 13px;
        }

        .speed-detail {
          font-size: 12px;
          color: #a9d4bd;
          text-align: right;
        }

        .speed-bar {
          grid-column: 1 / -1;
          height: 8px;
          border-radius: 6px;
          background: rgba(255, 184, 77, 0.18);
          overflow: hidden;
        }

        .speed-bar-fill {
          height: 100%;
          background: linear-gradient(90deg, #22ffa8, #0f9e63);
        }

        .port-table-wrap {
          overflow-x: auto;
          border: 1px solid rgba(61, 255, 155, 0.12);
          border-radius: 14px;
        }

        .port-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 13px;
        }

        .port-table th {
          text-align: left;
          padding: 10px 12px;
          background: rgba(61, 255, 155, 0.08);
          color: #59ffac;
          font-size: 11px;
          letter-spacing: 0.06em;
          white-space: nowrap;
        }

        .port-table td {
          padding: 10px 12px;
          border-top: 1px solid rgba(61, 255, 155, 0.08);
          color: #d9f5e6;
          white-space: nowrap;
        }

        .status-pill-sm {
          font-size: 10px;
          font-weight: 800;
          padding: 3px 8px;
          border-radius: 20px;
          border: 1px solid rgba(61, 255, 155, 0.3);
        }

        .status-pill-sm.up {
          color: #42ff9a;
          border-color: rgba(66, 255, 154, 0.4);
        }

        .status-pill-sm.down {
          color: #ff9a9a;
          border-color: rgba(255, 154, 154, 0.4);
        }

        .free-yes {
          color: #42ff9a;
          font-weight: 800;
          font-size: 12px;
        }

        .free-no {
          color: #7fa791;
          font-weight: 700;
          font-size: 12px;
        }

        @media (max-width: 980px) {
          .main-grid {
            grid-template-columns: 1fr;
          }

          .shell {
            flex-direction: column;
          }

          .sidebar {
            width: 100%;
            flex-direction: row;
            flex-wrap: wrap;
          }

          .nav {
            flex-direction: row;
            flex-wrap: wrap;
          }
        }
      `}</style>
    </>
  );
}
