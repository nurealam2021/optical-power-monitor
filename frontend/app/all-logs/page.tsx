"use client";

import { useEffect, useMemo, useState } from "react";
import { getApiBaseUrl } from "../lib/api";

type LogItem = {
  id: number;
  user_id: number | null;
  router_ip: string | null;
  vendor: string | null;
  interface_name: string | null;
  port_status: string | null;
  rx_power: string | null;
  tx_power: string | null;
  status: string | null;
  message: string | null;
  error_message: string | null;
  raw_output: string | null;
  checked_at: string | null;
  created_at: string | null;
};


function getStatusClass(status: string | null) {
  const cleanStatus = (status || "").toLowerCase();

  if (cleanStatus === "normal") return "status-normal";
  if (cleanStatus === "warning") return "status-warning";
  if (cleanStatus === "critical") return "status-critical";
  if (cleanStatus === "failed") return "status-failed";
  return "status-unknown";
}

function formatDate(value: string | null) {
  if (!value) {
    return "N/A";
  }

  try {
    return new Date(value).toLocaleString();
  } catch {
    return value;
  }
}

export default function AllLogsPage() {
  const [logs, setLogs] = useState<LogItem[]>([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedLog, setSelectedLog] = useState<LogItem | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [pageReady, setPageReady] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("bahon_token");
    const role = localStorage.getItem("bahon_user_role");

    if (!token) {
      window.location.href = "/login";
      return;
    }

    if (role !== "admin" && role !== "super_admin") {
      window.location.href = "/dashboard";
      return;
    }

    setUserRole(role);
    setPageReady(true);
    loadLogs();
  }, []);

  function getToken() {
    return localStorage.getItem("bahon_token");
  }

  async function loadLogs() {
    const token = getToken();

    if (!token) {
      window.location.href = "/login";
      return;
    }

    setLoading(true);
    setMessage("Loading all optical logs...");

    try {
      const apiBaseUrl = getApiBaseUrl();

      const response = await fetch(`${apiBaseUrl}/api/optical-logs/all`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.status === 401) {
        localStorage.clear();
        window.location.href = "/login";
        return;
      }

      if (response.status === 403) {
        setMessage("Access denied. Admin or Super Admin permission required.");
        return;
      }

      if (!response.ok) {
        const errorText = await response.text();
        setMessage(`Failed to load all logs: ${errorText}`);
        return;
      }

      const data = await response.json();

      if (Array.isArray(data)) {
        setLogs(data);
      } else if (Array.isArray(data.items)) {
        setLogs(data.items);
      } else if (Array.isArray(data.logs)) {
        setLogs(data.logs);
      } else {
        setLogs([]);
      }

      setMessage("");
    } catch {
      setMessage("Connection failed while loading all logs.");
    } finally {
      setLoading(false);
    }
  }

  function logout() {
    localStorage.clear();
    window.location.href = "/login";
  }

  const filteredLogs = useMemo(() => {
    const query = search.toLowerCase().trim();

    if (!query) {
      return logs;
    }

    return logs.filter((log) => {
      const searchableText = [
        log.id,
        log.user_id || "",
        log.router_ip || "",
        log.vendor || "",
        log.interface_name || "",
        log.port_status || "",
        log.rx_power || "",
        log.tx_power || "",
        log.status || "",
        log.message || "",
        log.error_message || "",
      ]
        .join(" ")
        .toLowerCase();

      return searchableText.includes(query);
    });
  }, [logs, search]);

  const showRouterLinks = userRole === "admin" || userRole === "super_admin";
  const showUserLinks = userRole === "super_admin";

  if (!pageReady) {
    return (
      <main className="loading-page">
        <div className="loading-card">Loading secure console...</div>

        <style>{`
          html, body {
            margin: 0;
            padding: 0;
            background: #050b08;
            font-family: Arial, Helvetica, sans-serif;
          }

          .loading-page {
            min-height: 100vh;
            display: grid;
            place-items: center;
            background:
              radial-gradient(circle at top left, rgba(0, 255, 140, 0.10), transparent 30%),
              linear-gradient(180deg, #07110d 0%, #050b08 100%);
            color: #e7fff2;
          }

          .loading-card {
            border: 1px solid rgba(61, 255, 155, 0.18);
            background: rgba(5, 12, 9, 0.88);
            border-radius: 18px;
            padding: 22px;
            color: #bce8ce;
            font-weight: 900;
          }
        `}</style>
      </main>
    );
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

              {showRouterLinks && (
                <a href="/all-logs" className="nav-link active">
                  All Logs
                </a>
              )}

              {showUserLinks && (
                <a href="/users" className="nav-link">
                  Users
                </a>
              )}

              {showRouterLinks && (
                <a href="/router-inventory" className="nav-link">
                  Router Inventory
                </a>
              )}

              {showRouterLinks && (
                <a href="/router-credentials" className="nav-link">
                  Router Credentials
                </a>
              )}
            </nav>

            <button onClick={logout} className="logout-button">
              Logout
            </button>
          </aside>

          <section className="content">
            <header className="topbar">
              <div>
                <div className="terminal-label">ALL_OPTICAL_LOGS</div>
                <h1>All Logs</h1>
                <p>
                  Admin and Super Admin can view all optical check logs from all
                  users, routers, vendors, and interfaces.
                </p>
              </div>

              <button type="button" className="refresh-button" onClick={loadLogs}>
                Refresh
              </button>
            </header>

            <section className="logs-card">
              <div className="logs-toolbar">
                <div>
                  <span className="section-code">GLOBAL_CHECK_LOGS</span>
                  <strong>{filteredLogs.length} records</strong>
                </div>

                <input
                  className="search-input"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search IP, interface, vendor, user ID, status..."
                />
              </div>

              {message && (
                <div className="message-box">
                  <span className="message-dot" />
                  {message}
                </div>
              )}

              {loading && <div className="empty-state">Loading all logs...</div>}

              {!loading && filteredLogs.length === 0 && (
                <div className="empty-state">No logs found.</div>
              )}

              {!loading && filteredLogs.length > 0 && (
                <div className="table-wrap">
                  <table className="logs-table">
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Time</th>
                        <th>User</th>
                        <th>Router IP</th>
                        <th>Vendor</th>
                        <th>Interface</th>
                        <th>Port</th>
                        <th>RX</th>
                        <th>TX</th>
                        <th>Status</th>
                        <th>Raw</th>
                      </tr>
                    </thead>

                    <tbody>
                      {filteredLogs.map((log) => (
                        <tr key={log.id}>
                          <td>{log.id}</td>
                          <td>{formatDate(log.checked_at || log.created_at)}</td>
                          <td>{log.user_id || "N/A"}</td>
                          <td>{log.router_ip || "N/A"}</td>
                          <td>{log.vendor?.toUpperCase() || "N/A"}</td>
                          <td>{log.interface_name || "N/A"}</td>
                          <td>{log.port_status || "N/A"}</td>
                          <td>{log.rx_power || "N/A"}</td>
                          <td>{log.tx_power || "N/A"}</td>
                          <td>
                            <span className={`status-pill ${getStatusClass(log.status)}`}>
                              {(log.status || "unknown").toUpperCase()}
                            </span>
                          </td>
                          <td>
                            <button
                              type="button"
                              className="view-button"
                              onClick={() => setSelectedLog(log)}
                            >
                              View
                            </button>
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

        {selectedLog && (
          <section className="modal-backdrop" onClick={() => setSelectedLog(null)}>
            <div className="modal" onClick={(event) => event.stopPropagation()}>
              <div className="modal-header">
                <div>
                  <span className="section-code">RAW_LOG_OUTPUT</span>
                  <h2>Log #{selectedLog.id}</h2>
                </div>

                <button
                  type="button"
                  className="close-button"
                  onClick={() => setSelectedLog(null)}
                >
                  Close
                </button>
              </div>

              <div className="modal-meta">
                <span>IP: {selectedLog.router_ip || "N/A"}</span>
                <span>Interface: {selectedLog.interface_name || "N/A"}</span>
                <span>Status: {selectedLog.status || "N/A"}</span>
              </div>

              {selectedLog.error_message && (
                <div className="error-box">{selectedLog.error_message}</div>
              )}

              <pre className="raw-output">
                {selectedLog.raw_output || "No raw output stored for this log."}
              </pre>
            </div>
          </section>
        )}
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
          padding-bottom: 58px;
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
          height: calc(100vh - 76px);
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

        h2 {
          margin: 4px 0 0;
        }

        .topbar p {
          color: #a9cbbb;
          margin: 8px 0 0;
          max-width: 760px;
          line-height: 1.6;
        }

        .refresh-button,
        .view-button,
        .close-button {
          border: 1px solid rgba(61, 255, 155, 0.22);
          background: rgba(61, 255, 155, 0.10);
          color: #dffff0;
          border-radius: 14px;
          padding: 12px 16px;
          cursor: pointer;
          font-weight: 900;
        }

        .view-button {
          padding: 8px 11px;
          border-radius: 10px;
        }

        .logs-card {
          border: 1px solid rgba(61, 255, 155, 0.12);
          background: rgba(3, 8, 6, 0.68);
          border-radius: 22px;
          padding: 20px;
        }

        .logs-toolbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          margin-bottom: 18px;
        }

        .logs-toolbar strong {
          display: block;
          margin-top: 6px;
          font-size: 22px;
        }

        .search-input {
          width: min(480px, 100%);
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

        .logs-table {
          width: 100%;
          border-collapse: collapse;
          min-width: 1200px;
        }

        .logs-table th,
        .logs-table td {
          padding: 14px;
          border-bottom: 1px solid rgba(61, 255, 155, 0.09);
          text-align: left;
          font-size: 14px;
          white-space: nowrap;
        }

        .logs-table th {
          color: #76dba2;
          background: rgba(35, 255, 138, 0.06);
          font-family: "Courier New", Courier, monospace;
          font-size: 12px;
          letter-spacing: 0.08em;
        }

        .logs-table td {
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

        .modal-backdrop {
          position: fixed;
          inset: 0;
          z-index: 10000;
          background: rgba(0, 0, 0, 0.70);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 18px;
        }

        .modal {
          width: min(980px, 100%);
          max-height: 85vh;
          overflow: auto;
          border: 1px solid rgba(61, 255, 155, 0.18);
          background: #050b08;
          border-radius: 22px;
          padding: 20px;
          box-shadow: 0 20px 70px rgba(0, 0, 0, 0.45);
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          gap: 16px;
          align-items: flex-start;
          margin-bottom: 14px;
        }

        .modal-meta {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          color: #bce8ce;
          margin-bottom: 14px;
          font-family: "Courier New", Courier, monospace;
          font-size: 13px;
        }

        .error-box {
          border: 1px solid rgba(255, 77, 77, 0.25);
          background: rgba(255, 77, 77, 0.08);
          color: #ffc7c7;
          border-radius: 14px;
          padding: 12px;
          margin-bottom: 12px;
        }

        .raw-output {
          border: 1px solid rgba(61, 255, 155, 0.12);
          background: rgba(0, 0, 0, 0.35);
          color: #dffff0;
          border-radius: 14px;
          padding: 14px;
          overflow: auto;
          white-space: pre-wrap;
          font-size: 13px;
          line-height: 1.5;
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
          .logs-toolbar {
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

          .modal {
            max-height: 88vh;
          }
        }
      `}</style>
    </>
  );
}
