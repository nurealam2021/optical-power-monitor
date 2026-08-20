"use client";

import { useEffect, useState } from "react";
import { getApiBaseUrl } from "../lib/api";

type RouterInventory = {
  id: number;
  router_name: string | null;
  management_ip: string;
  vendor: string;
  model: string | null;
  site_name: string | null;
  router_role: string | null;
  backbone_capacity_mbps: number | null;
  status: string;
  detected_vendor: string | null;
  last_verified_at: string | null;
  created_at: string;
  updated_at: string;
};


export default function RouterInventoryPage() {
  const [routers, setRouters] = useState<RouterInventory[]>([]);

  const [routerName, setRouterName] = useState("");
  const [managementIp, setManagementIp] = useState("");
  const [vendor, setVendor] = useState("huawei");
  const [model, setModel] = useState("");
  const [siteName, setSiteName] = useState("");
  const [routerRole, setRouterRole] = useState("access");
  const [backboneCapacityMbps, setBackboneCapacityMbps] = useState("");
  const [status, setStatus] = useState("active");

  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    loadRouters();
  }, []);

  const filteredRouters = routers.filter((router) => {
    const query = searchQuery.trim().toLowerCase();

    if (!query) {
      return true;
    }

    const name = (router.router_name || "").toLowerCase();
    const ip = router.management_ip.toLowerCase();

    return name.includes(query) || ip.includes(query);
  });

  function getToken() {
    return localStorage.getItem("bahon_token");
  }

  async function loadRouters() {
    const token = getToken();

    if (!token) {
      window.location.href = "/login";
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

      if (response.status === 403) {
        setMessage("Access denied. Admin or Super Admin permission required.");
        return;
      }

      const data = await response.json();
      setRouters(data);
    } catch {
      setMessage("Failed to load router inventory.");
    }
  }

  async function addRouter() {
    const token = getToken();

    if (!token) {
      window.location.href = "/login";
      return;
    }

    setLoading(true);
    setMessage("Saving router inventory...");

    try {
      const apiBaseUrl = getApiBaseUrl();

      const response = await fetch(`${apiBaseUrl}/api/router-inventory`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          router_name: routerName || null,
          management_ip: managementIp,
          vendor,
          model: model || null,
          site_name: siteName || null,
          router_role: routerRole || null,
          backbone_capacity_mbps: backboneCapacityMbps
            ? Number(backboneCapacityMbps)
            : null,
          status,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setMessage(`Failed: ${JSON.stringify(data)}`);
        return;
      }

      setMessage("Router added to inventory successfully.");

      setRouterName("");
      setManagementIp("");
      setVendor("huawei");
      setModel("");
      setSiteName("");
      setRouterRole("access");
      setBackboneCapacityMbps("");
      setStatus("active");

      await loadRouters();
    } catch {
      setMessage("Connection failed. Backend may not be running.");
    } finally {
      setLoading(false);
    }
  }

  async function deleteRouter(id: number) {
    const token = getToken();

    if (!token) {
      window.location.href = "/login";
      return;
    }

    const confirmDelete = window.confirm(
      "Are you sure you want to delete this router from inventory?"
    );

    if (!confirmDelete) {
      return;
    }

    setMessage("Deleting router inventory...");

    try {
      const apiBaseUrl = getApiBaseUrl();

      const response = await fetch(`${apiBaseUrl}/api/router-inventory/${id}`, {
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

      setMessage("Router inventory deleted successfully.");
      await loadRouters();
    } catch {
      setMessage("Connection failed while deleting router.");
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
              <a href="/router-inventory" className="nav-link active">
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
                <div className="terminal-label">ROUTER_INVENTORY</div>
                <h1>Router Inventory</h1>
                <p>
                  Add your Cisco, Huawei, and ZTE routers here. After adding
                  management IP and vendor, users can check optical power using
                  only router IP and interface.
                </p>
              </div>

              <div className="mode-card">
                <span>MODE</span>
                <strong>IP → VENDOR</strong>
              </div>
            </header>

            <div className="search-bar">
              <span className="search-icon">⌕</span>
              <input
                className="search-input"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search by router name or management IP..."
              />
              {searchQuery && (
                <button
                  type="button"
                  className="search-clear"
                  onClick={() => setSearchQuery("")}
                >
                  Clear
                </button>
              )}
            </div>

            <div className="main-grid">
              <section className="form-card">
                <div className="card-header">
                  <span>ADD_ROUTER</span>
                  <strong>Inventory Entry</strong>
                </div>

                <label className="field-label">
                  Router Name
                  <input
                    className="field-input"
                    value={routerName}
                    onChange={(event) => setRouterName(event.target.value)}
                    placeholder="Example: DHAKA-CORE-01"
                  />
                </label>

                <label className="field-label">
                  Management IP
                  <input
                    className="field-input"
                    value={managementIp}
                    onChange={(event) => setManagementIp(event.target.value)}
                    placeholder="Example: 10.24.39.149"
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
                    <option value="cisco">Cisco</option>
                    <option value="zte">ZTE</option>
                  </select>
                </label>

                <label className="field-label">
                  Model
                  <input
                    className="field-input"
                    value={model}
                    onChange={(event) => setModel(event.target.value)}
                    placeholder="Example: NE40E / ASR / ZXR10"
                  />
                </label>

                <label className="field-label">
                  Site / POP Name
                  <input
                    className="field-input"
                    value={siteName}
                    onChange={(event) => setSiteName(event.target.value)}
                    placeholder="Example: SYKAD3 POP"
                  />
                </label>

                <label className="field-label">
                  Router Role
                  <select
                    className="field-input"
                    value={routerRole}
                    onChange={(event) => setRouterRole(event.target.value)}
                  >
                    <option value="core">Core</option>
                    <option value="aggregation">Aggregation</option>
                    <option value="access">Access</option>
                    <option value="client-edge">Client Edge</option>
                    <option value="other">Other</option>
                  </select>
                </label>

                <label className="field-label">
                  Backbone Capacity (Mbps)
                  <input
                    className="field-input"
                    type="number"
                    min="0"
                    value={backboneCapacityMbps}
                    onChange={(event) =>
                      setBackboneCapacityMbps(event.target.value)
                    }
                    placeholder="Example: 10000"
                  />
                </label>

                <label className="field-label">
                  Status
                  <select
                    className="field-input"
                    value={status}
                    onChange={(event) => setStatus(event.target.value)}
                  >
                    <option value="active">Active</option>
                    <option value="disabled">Disabled</option>
                  </select>
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
                  onClick={addRouter}
                  disabled={loading}
                >
                  {loading ? "Saving..." : "Add Router"}
                </button>
              </section>

              <section className="list-card">
                <div className="card-header">
                  <span>INVENTORY_LIST</span>
                  <strong>Stored Routers</strong>
                </div>

                {routers.length === 0 && (
                  <div className="empty-state">
                    <p>No routers added yet.</p>
                    <span>
                      Add management IP and vendor to enable IP-only optical
                      checks.
                    </span>
                  </div>
                )}

                {routers.length > 0 && filteredRouters.length === 0 && (
                  <div className="empty-state">
                    <p>No routers match your search.</p>
                    <span>Try a different name or IP address.</span>
                  </div>
                )}

                <div className="router-list">
                  {filteredRouters.map((router) => (
                    <div key={router.id} className="router-item">
                      <div className="router-main">
                        <div className="router-name">
                          {router.router_name || "Unnamed Router"}
                        </div>

                        <div className="router-meta">
                          {router.management_ip} · {router.vendor.toUpperCase()}
                          {router.model ? ` · ${router.model}` : ""}
                        </div>

                        <div className="router-submeta">
                          {router.site_name || "No site"} ·{" "}
                          {router.router_role || "No role"}
                          {router.backbone_capacity_mbps
                            ? ` · Backbone: ${router.backbone_capacity_mbps} Mbps`
                            : ""}
                        </div>
                      </div>

                      <div className="router-actions">
                        <span className={`status-pill ${router.status}`}>
                          {router.status.toUpperCase()}
                        </span>

                        <button
                          type="button"
                          className="delete-button"
                          onClick={() => deleteRouter(router.id)}
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

        .search-bar {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 18px;
          padding: 4px 16px;
          border: 1px solid rgba(61, 255, 155, 0.18);
          background: rgba(3, 8, 6, 0.68);
          border-radius: 14px;
        }

        .search-icon {
          color: #59ffac;
          font-size: 18px;
          line-height: 1;
        }

        .search-input {
          flex: 1;
          border: none;
          outline: none;
          background: transparent;
          color: #eafff3;
          font-size: 14px;
          padding: 12px 0;
          font-family: Arial, Helvetica, sans-serif;
        }

        .search-input::placeholder {
          color: rgba(184, 216, 198, 0.5);
        }

        .search-clear {
          border: 1px solid rgba(61, 255, 155, 0.25);
          background: rgba(61, 255, 155, 0.08);
          color: #a7ffca;
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 0.04em;
          padding: 7px 12px;
          border-radius: 10px;
          cursor: pointer;
          white-space: nowrap;
        }

        .search-clear:hover {
          background: rgba(61, 255, 155, 0.16);
        }

        .main-grid {
          display: grid;
          grid-template-columns: minmax(320px, 0.85fr) minmax(320px, 1.15fr);
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

        .router-list {
          display: grid;
          gap: 12px;
        }

        .router-item {
          border: 1px solid rgba(61, 255, 155, 0.12);
          background: rgba(255, 255, 255, 0.025);
          border-radius: 18px;
          padding: 16px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
        }

        .router-name {
          font-weight: 900;
          color: #f0fff7;
        }

        .router-meta {
          margin-top: 6px;
          color: #9fbead;
          font-size: 13px;
          font-family: "Courier New", Courier, monospace;
        }

        .router-submeta {
          margin-top: 5px;
          color: #7f9f8d;
          font-size: 13px;
        }

        .router-actions {
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

          .router-item {
            flex-direction: column;
            align-items: flex-start;
          }

          .router-actions {
            width: 100%;
            justify-content: space-between;
          }
        }
      `}</style>
    </>
  );
}
