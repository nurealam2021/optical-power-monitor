"use client";

import { useEffect, useMemo, useState } from "react";
import { getApiBaseUrl } from "../lib/api";

type HistoryItem = {
  id: number;
  router_ip: string;
  vendor: string;
  interface?: string;
  interface_name?: string;
  port_status?: string | null;
  rx_power: string | null;
  tx_power: string | null;
  status: string;
  checked_at: string;
  message?: string | null;
  error_message?: string | null;
};


function getStatusClass(status: string) {
  const cleanStatus = status.toLowerCase();

  if (cleanStatus === "normal") return "status-normal";
  if (cleanStatus === "warning") return "status-warning";
  if (cleanStatus === "critical") return "status-critical";
  if (cleanStatus === "failed") return "status-failed";
  return "status-unknown";
}

function getInterfaceName(item: HistoryItem) {
  return item.interface || item.interface_name || "N/A";
}

function formatDate(value: string) {
  try {
    return new Date(value).toLocaleString();
  } catch {
    return value;
  }
}

export default function HistoryPage() {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    loadHistory();
  }, []);

  async function fetchFromFirstAvailableEndpoint(token: string) {
    const apiBaseUrl = getApiBaseUrl();

    const possibleEndpoints = [
      "/api/optical-logs/my",
      "/api/optical-logs",
      "/api/optical/logs/my",
      "/api/optical/logs",
      "/api/history",
    ];

    for (const endpoint of possibleEndpoints) {
      const response = await fetch(`${apiBaseUrl}${endpoint}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.status === 404) {
        continue;
      }

      return response;
    }

    throw new Error("No history endpoint found.");
  }

  async function loadHistory() {
    const token = localStorage.getItem("bahon_token");

    if (!token) {
      window.location.href = "/login";
      return;
    }

    setLoading(true);
    setMessage("Loading optical check history...");

    try {
      const response = await fetchFromFirstAvailableEndpoint(token);

      if (response.status === 401) {
        localStorage.clear();
        window.location.href = "/login";
        return;
      }

      if (!response.ok) {
        const errorText = await response.text();
        setMessage(`Failed to load history: ${errorText}`);
        return;
      }

      const data = await response.json();

      if (Array.isArray(data)) {
        setHistory(data);
      } else if (Array.isArray(data.items)) {
        setHistory(data.items);
      } else if (Array.isArray(data.logs)) {
        setHistory(data.logs);
      } else {
        setHistory([]);
      }

      setMessage("");
    } catch {
      setMessage("Could not load history. Please check backend history API.");
    } finally {
      setLoading(false);
    }
  }

  function logout() {
    localStorage.clear();
    window.location.href = "/login";
  }

  const filteredHistory = useMemo(() => {
    const query = search.toLowerCase().trim();

    if (!query) {
      return history;
    }

    return history.filter((item) => {
      const searchableText = [
        item.router_ip,
        item.vendor,
        getInterfaceName(item),
        item.rx_power || "",
        item.tx_power || "",
        item.status,
        item.message || "",
        item.error_message || "",
      ]
        .join(" ")
        .toLowerCase();

      return searchableText.includes(query);
    });
  }, [history, search]);

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
              <a href="/history" className="nav-link active">
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
                <div className="terminal-label">MY_OPTICAL_HISTORY</div>
                <h1>My History</h1>
                <p>
                  Review previous optical checks including router IP, interface,
                  port status, RX power, TX power, and result status.
                </p>
              </div>

              <button type="button" className="refresh-button" onClick={loadHistory}>
                Refresh
              </button>
            </header>

            <section className="history-card">
              <div className="history-toolbar">
                <div>
                  <span className="section-code">CHECK_LOGS</span>
                  <strong>{filteredHistory.length} records</strong>
                </div>

                <input
                  className="search-input"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search IP, interface, vendor, status..."
                />
              </div>

              {message && (
                <div className="message-box">
                  <span className="message-dot" />
                  {message}
                </div>
              )}

              {loading && <div className="empty-state">Loading history...</div>}

              {!loading && filteredHistory.length === 0 && (
                <div className="empty-state">
                  No history found. Run an optical check first.
                </div>
              )}

              {!loading && filteredHistory.length > 0 && (
                <div className="table-wrap">
                  <table className="history-table">
                    <thead>
                      <tr>
                        <th>Time</th>
                        <th>Router IP</th>
                        <th>Vendor</th>
                        <th>Interface</th>
                        <th>Port</th>
                        <th>RX</th>
                        <th>TX</th>
                        <th>Status</th>
                      </tr>
                    </thead>

                    <tbody>
                      {filteredHistory.map((item) => (
                        <tr key={item.id}>
                          <td>{formatDate(item.checked_at)}</td>
                          <td>{item.router_ip}</td>
                          <td>{item.vendor?.toUpperCase()}</td>
                          <td>{getInterfaceName(item)}</td>
                          <td>{item.port_status || "N/A"}</td>
                          <td>{item.rx_power || "N/A"}</td>
                          <td>{item.tx_power || "N/A"}</td>
                          <td>
                            <span className={`status-pill ${getStatusClass(item.status)}`}>
                              {item.status?.toUpperCase()}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
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
            radial-gradient(circle at bottom right, rgba(139, 92, 246, 0.10), transparent 30%),
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
          background: rgba(139, 92, 246, 0.10);
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
        .section-code {
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

        .refresh-button {
          border: 1px solid rgba(61, 255, 155, 0.22);
          background: rgba(61, 255, 155, 0.10);
          color: #dffff0;
          border-radius: 14px;
          padding: 12px 16px;
          cursor: pointer;
          font-weight: 900;
        }

        .history-card {
          border: 1px solid rgba(61, 255, 155, 0.12);
          background: rgba(3, 8, 6, 0.68);
          border-radius: 22px;
          padding: 20px;
        }

        .history-toolbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          margin-bottom: 18px;
        }

        .history-toolbar strong {
          display: block;
          margin-top: 6px;
          font-size: 22px;
        }

        .search-input {
          width: min(420px, 100%);
          height: 48px;
          border-radius: 14px;
          border: 1px solid rgba(61, 255, 155, 0.18);
          background: rgba(5, 12, 9, 0.92);
          color: #eafff3;
          outline: none;
          padding: 0 14px;
          font-size: 15px;
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

        .empty-state {
          border: 1px dashed rgba(61, 255, 155, 0.18);
          border-radius: 18px;
          padding: 24px;
          color: #a9cbbb;
          text-align: center;
        }

        .table-wrap {
          width: 100%;
          overflow-x: auto;
          border-radius: 18px;
          border: 1px solid rgba(61, 255, 155, 0.10);
        }

        .history-table {
          width: 100%;
          border-collapse: collapse;
          min-width: 980px;
        }

        .history-table th,
        .history-table td {
          padding: 14px;
          border-bottom: 1px solid rgba(61, 255, 155, 0.09);
          text-align: left;
          font-size: 14px;
          white-space: nowrap;
        }

        .history-table th {
          color: #76dba2;
          background: rgba(35, 255, 138, 0.06);
          font-family: "Courier New", Courier, monospace;
          font-size: 12px;
          letter-spacing: 0.08em;
        }

        .history-table td {
          color: #dffff0;
        }

        .status-pill {
          border-radius: 999px;
          padding: 7px 10px;
          font-size: 12px;
          font-family: "Courier New", Courier, monospace;
          font-weight: 900;
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

          .topbar,
          .history-toolbar {
            flex-direction: column;
            align-items: flex-start;
          }

          .refresh-button,
          .search-input {
            width: 100%;
          }

          h1 {
            font-size: 28px;
          }

          .nav {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </>
  );
}
