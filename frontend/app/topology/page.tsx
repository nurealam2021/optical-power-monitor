"use client";

import { useEffect, useMemo, useState } from "react";
import { getApiBaseUrl } from "../lib/api";

type TopologyNode = {
  key: string;
  router_id: number | null;
  name: string;
  management_ip: string | null;
  vendor: string | null;
  model: string | null;
  site_name: string | null;
  router_role: string | null;
  status: string;
  managed: boolean;
};

type TopologyEdge = {
  id: number;
  source: string;
  target: string;
  source_router_id: number;
  local_interface: string;
  remote_interface: string | null;
  remote_management_ip: string | null;
  remote_router_name: string | null;
  remote_vendor: string | null;
  discovery_method: string;
  status: string;
  last_seen_at: string;
};

type TopologyResponse = {
  nodes: TopologyNode[];
  edges: TopologyEdge[];
};

type Point = {
  x: number;
  y: number;
  layer: number;
};

function nodeColor(node: TopologyNode) {
  if (!node.managed) return "#ffbf47";
  if (node.status === "disabled") return "#87958d";
  return "#42ff9a";
}

function buildLayout(nodes: TopologyNode[], edges: TopologyEdge[]) {
  const positions: Record<string, Point> = {};
  const adjacency = new Map<string, string[]>();

  for (const node of nodes) {
    adjacency.set(node.key, []);
  }

  for (const edge of edges) {
    adjacency.get(edge.source)?.push(edge.target);
    adjacency.get(edge.target)?.push(edge.source);
  }

  const start =
    nodes.find((node) => node.managed && node.router_role === "core") ??
    nodes.find((node) => node.managed) ??
    nodes[0];

  if (!start) return positions;

  const queue: string[] = [start.key];
  const layerByKey = new Map<string, number>([[start.key, 0]]);

  while (queue.length) {
    const key = queue.shift()!;
    const layer = layerByKey.get(key) ?? 0;

    for (const next of adjacency.get(key) ?? []) {
      if (!layerByKey.has(next)) {
        layerByKey.set(next, layer + 1);
        queue.push(next);
      }
    }
  }

  for (const node of nodes) {
    if (!layerByKey.has(node.key)) {
      const maxLayer = Math.max(0, ...Array.from(layerByKey.values()));
      layerByKey.set(node.key, maxLayer + 1);
    }
  }

  const layers = new Map<number, string[]>();

  for (const node of nodes) {
    const layer = layerByKey.get(node.key) ?? 0;
    const list = layers.get(layer) ?? [];
    list.push(node.key);
    layers.set(layer, list);
  }

  const verticalGap = 125;
  const horizontalGap = 220;

  for (const [layer, keys] of layers) {
    const startX = 130;
    const totalWidth = Math.max(1, keys.length - 1) * horizontalGap;

    keys.forEach((key, index) => {
      positions[key] = {
        x: startX + index * horizontalGap,
        y: 110 + layer * verticalGap,
        layer,
      };
    });

    if (keys.length === 1) {
      positions[keys[0]].x = 520;
    } else if (totalWidth > 900) {
      const scale = 900 / totalWidth;
      keys.forEach((key, index) => {
        positions[key].x = 100 + index * (900 / Math.max(1, keys.length - 1));
      });
    }
  }

  return positions;
}

export default function NetworkTopologyPage() {
  const [topology, setTopology] = useState<TopologyResponse>({
    nodes: [],
    edges: [],
  });
  const [seedRouterId, setSeedRouterId] = useState("");
  const [depth, setDepth] = useState("2");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [discovering, setDiscovering] = useState(false);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const positions = useMemo(
    () => buildLayout(topology.nodes, topology.edges),
    [topology.nodes, topology.edges]
  );

  const selectedNode =
    topology.nodes.find((node) => node.key === selectedKey) ?? null;

  const managedRouters = topology.nodes
    .filter((node) => node.managed)
    .sort((a, b) => a.name.localeCompare(b.name));

  const bounds = useMemo(() => {
    if (!topology.nodes.length) {
      return { width: 1100, height: 650 };
    }

    const maxLayer = Math.max(
      0,
      ...topology.nodes.map((node) => positions[node.key]?.layer ?? 0)
    );

    return {
      width: 1100,
      height: Math.max(650, 220 + maxLayer * 145),
    };
  }, [topology.nodes, positions]);

  useEffect(() => {
    loadTopology();
  }, []);

  function token() {
    return localStorage.getItem("bahon_token");
  }

  async function loadTopology() {
    const auth = token();

    if (!auth) {
      window.location.href = "/login";
      return;
    }

    try {
      const response = await fetch(
        `${getApiBaseUrl()}/api/topology`,
        {
          headers: {
            Authorization: `Bearer ${auth}`,
          },
        }
      );

      if (response.status === 401) {
        localStorage.clear();
        window.location.href = "/login";
        return;
      }

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        setMessage(data.detail || "Unable to load topology.");
        return;
      }

      setTopology(await response.json());
    } catch {
      setMessage("Topology API is unavailable.");
    } finally {
      setLoading(false);
    }
  }

  async function discoverNetwork() {
    const auth = token();

    if (!auth) {
      window.location.href = "/login";
      return;
    }

    setDiscovering(true);
    setMessage("Opening read-only SSH sessions and discovering LLDP neighbors...");

    try {
      const response = await fetch(
        `${getApiBaseUrl()}/api/topology/discover`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${auth}`,
          },
          body: JSON.stringify({
            router_id: seedRouterId ? Number(seedRouterId) : null,
            depth: Number(depth),
          }),
        }
      );

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        setMessage(data.detail || "Topology discovery failed.");
        return;
      }

      const summary = [
        `Scanned: ${data.routers_scanned}`,
        `Links: ${data.links_found}`,
        `Unmanaged neighbors: ${data.unmanaged_neighbors}`,
      ].join(" · ");

      setMessage(
        data.errors?.length
          ? `${summary} · Completed with ${data.errors.length} warning(s).`
          : `${summary} · Discovery completed successfully.`
      );

      await loadTopology();
    } catch {
      setMessage("Discovery request failed.");
    } finally {
      setDiscovering(false);
    }
  }

  function handleWheel(event: React.WheelEvent<SVGSVGElement>) {
    event.preventDefault();
    const next = event.deltaY > 0 ? zoom * 0.9 : zoom * 1.1;
    setZoom(Math.min(2.4, Math.max(0.55, next)));
  }

  function handleMouseDown(event: React.MouseEvent<SVGSVGElement>) {
    setDragging(true);
    setDragStart({
      x: event.clientX - pan.x,
      y: event.clientY - pan.y,
    });
  }

  function handleMouseMove(event: React.MouseEvent<SVGSVGElement>) {
    if (!dragging) return;

    setPan({
      x: event.clientX - dragStart.x,
      y: event.clientY - dragStart.y,
    });
  }

  function resetView() {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }

  if (loading) {
    return (
      <main className="topology-page">
        <div className="loading-box">Loading network topology...</div>
        <style>{styles}</style>
      </main>
    );
  }

  return (
    <main className="topology-page">
      <div className="grid-bg" />

      <section className="shell">
        <aside className="sidebar">
          <div className="brand">
            <div className="brand-mark">N</div>
            <div>
              <div className="brand-title">BAHON NMS</div>
              <div className="brand-subtitle">Network Intelligence</div>
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
            <a href="/router-inventory" className="nav-link">
              Router Inventory
            </a>
            <a href="/router-credentials" className="nav-link">
              Router Credentials
            </a>
            <a href="/topology" className="nav-link active">
              Network Topology
            </a>
            <a href="/history" className="nav-link">
              History
            </a>
            <a href="/all-logs" className="nav-link">
              All Logs
            </a>
          </nav>

          <button
            className="logout-button"
            onClick={() => {
              localStorage.clear();
              window.location.href = "/login";
            }}
          >
            Logout
          </button>
        </aside>

        <section className="content">
          <header className="topbar">
            <div>
              <div className="terminal-label">NETWORK_TOPOLOGY // LLDP</div>
              <h1>Network Intelligence Map</h1>
              <p>
                Discover router-to-router links through read-only SSH using
                Netmiko/Paramiko. No SNMP is required.
              </p>
            </div>

            <div className="stats">
              <div>
                <span>MANAGED</span>
                <strong>{topology.nodes.filter((node) => node.managed).length}</strong>
              </div>
              <div>
                <span>LINKS</span>
                <strong>{topology.edges.length}</strong>
              </div>
              <div>
                <span>UNMANAGED</span>
                <strong>
                  {topology.nodes.filter((node) => !node.managed).length}
                </strong>
              </div>
            </div>
          </header>

          <section className="control-panel">
            <div className="control-field">
              <label>Discovery Seed</label>
              <select
                value={seedRouterId}
                onChange={(event) => setSeedRouterId(event.target.value)}
              >
                <option value="">All Active Routers</option>
                {managedRouters.map((router) => (
                  <option key={router.key} value={router.router_id ?? ""}>
                    {router.name} · {router.management_ip}
                  </option>
                ))}
              </select>
            </div>

            <div className="control-field">
              <label>Discovery Depth</label>
              <select value={depth} onChange={(event) => setDepth(event.target.value)}>
                <option value="1">1 hop</option>
                <option value="2">2 hops</option>
                <option value="3">3 hops</option>
              </select>
            </div>

            <button
              className="discover-button"
              onClick={discoverNetwork}
              disabled={discovering}
            >
              {discovering ? "DISCOVERING..." : "DISCOVER NETWORK"}
            </button>

            <button className="secondary-button" onClick={loadTopology}>
              REFRESH MAP
            </button>
          </section>

          {message && <div className="message">{message}</div>}

          <section className="map-card">
            <div className="map-toolbar">
              <div>
                <span className="terminal-label">LIVE_TOPOLOGY</span>
                <strong>Pan / zoom / select a router</strong>
              </div>

              <div className="map-tools">
                <button onClick={() => setZoom((value) => Math.min(2.4, value * 1.15))}>
                  +
                </button>
                <button onClick={() => setZoom((value) => Math.max(0.55, value / 1.15))}>
                  −
                </button>
                <button onClick={resetView}>RESET</button>
              </div>
            </div>

            <div className="map-viewport">
              {topology.nodes.length === 0 ? (
                <div className="empty-map">
                  <div className="empty-icon">◎</div>
                  <h2>No topology discovered yet</h2>
                  <p>
                    Add routers and credentials first, then run network
                    discovery. The collector will query LLDP through SSH.
                  </p>
                </div>
              ) : (
                <svg
                  className="topology-svg"
                  viewBox={`0 0 ${bounds.width} ${bounds.height}`}
                  onWheel={handleWheel}
                  onMouseDown={handleMouseDown}
                  onMouseMove={handleMouseMove}
                  onMouseUp={() => setDragging(false)}
                  onMouseLeave={() => setDragging(false)}
                >
                  <defs>
                    <pattern
                      id="map-grid"
                      width="40"
                      height="40"
                      patternUnits="userSpaceOnUse"
                    >
                      <path
                        d="M 40 0 L 0 0 0 40"
                        fill="none"
                        stroke="rgba(66,255,154,0.07)"
                        strokeWidth="1"
                      />
                    </pattern>
                    <filter id="node-glow">
                      <feGaussianBlur stdDeviation="5" result="blur" />
                      <feMerge>
                        <feMergeNode in="blur" />
                        <feMergeNode in="SourceGraphic" />
                      </feMerge>
                    </filter>
                  </defs>

                  <rect
                    width="100%"
                    height="100%"
                    fill="#030806"
                  />
                  <rect
                    width="100%"
                    height="100%"
                    fill="url(#map-grid)"
                  />

                  <g
                    transform={`translate(${pan.x} ${pan.y}) scale(${zoom})`}
                  >
                    {topology.edges.map((edge) => {
                      const source = positions[edge.source];
                      const target = positions[edge.target];

                      if (!source || !target) return null;

                      const selected =
                        selectedKey === edge.source || selectedKey === edge.target;

                      return (
                        <g key={edge.id}>
                          <line
                            x1={source.x}
                            y1={source.y}
                            x2={target.x}
                            y2={target.y}
                            stroke={selected ? "#59ffac" : "#2d9f69"}
                            strokeWidth={selected ? 4 : 2}
                            strokeOpacity={selected ? 0.95 : 0.62}
                          />
                          <text
                            x={(source.x + target.x) / 2}
                            y={(source.y + target.y) / 2 - 7}
                            textAnchor="middle"
                            fill="#9fd9b9"
                            fontSize="10"
                            fontFamily="monospace"
                          >
                            {edge.local_interface}
                          </text>
                        </g>
                      );
                    })}

                    {topology.nodes.map((node) => {
                      const point = positions[node.key];

                      if (!point) return null;

                      const selected = selectedKey === node.key;
                      const color = nodeColor(node);

                      return (
                        <g
                          key={node.key}
                          transform={`translate(${point.x} ${point.y})`}
                          onClick={(event) => {
                            event.stopPropagation();
                            setSelectedKey(node.key);
                          }}
                          className="node"
                          style={{ cursor: "pointer" }}
                        >
                          <circle
                            r={selected ? 30 : 25}
                            fill={color}
                            opacity={selected ? 0.18 : 0.10}
                            filter="url(#node-glow)"
                          />
                          <circle
                            r={selected ? 22 : 18}
                            fill="#07120c"
                            stroke={color}
                            strokeWidth={selected ? 3 : 2}
                          />
                          <circle r="5" fill={color} />
                          <text
                            y="38"
                            textAnchor="middle"
                            fill="#edfff5"
                            fontSize="13"
                            fontWeight="700"
                          >
                            {node.name.length > 24
                              ? `${node.name.slice(0, 22)}…`
                              : node.name}
                          </text>
                          <text
                            y="54"
                            textAnchor="middle"
                            fill="#7fae93"
                            fontSize="10"
                            fontFamily="monospace"
                          >
                            {node.management_ip ?? "UNMANAGED"}
                          </text>
                        </g>
                      );
                    })}
                  </g>
                </svg>
              )}
            </div>

            <div className="legend">
              <span>
                <i className="green" /> Managed / active
              </span>
              <span>
                <i className="yellow" /> Discovered / unmanaged
              </span>
              <span>
                <i className="line" /> LLDP link
              </span>
            </div>
          </section>

          {selectedNode && (
            <section className="details-card">
              <div>
                <div className="terminal-label">SELECTED_NODE</div>
                <h2>{selectedNode.name}</h2>
                <p>
                  {selectedNode.management_ip ?? "Management IP not reported by LLDP"}
                </p>
              </div>

              <div className="details-grid">
                <div>
                  <span>Vendor</span>
                  <strong>{selectedNode.vendor?.toUpperCase() ?? "UNKNOWN"}</strong>
                </div>
                <div>
                  <span>Model</span>
                  <strong>{selectedNode.model ?? "—"}</strong>
                </div>
                <div>
                  <span>POP / Site</span>
                  <strong>{selectedNode.site_name ?? "—"}</strong>
                </div>
                <div>
                  <span>Role</span>
                  <strong>{selectedNode.router_role ?? "—"}</strong>
                </div>
                <div>
                  <span>Control</span>
                  <strong>{selectedNode.managed ? "IN INVENTORY" : "UNMANAGED"}</strong>
                </div>
                <div>
                  <span>Status</span>
                  <strong>{selectedNode.status.toUpperCase()}</strong>
                </div>
              </div>

              {selectedNode.router_id && (
                <div className="action-row">
                  <a href="/optical-check">OPTICAL CHECK</a>
                  <a href="/router-capacity">PORT CAPACITY</a>
                  <a href="/router-inventory">VIEW INVENTORY</a>
                </div>
              )}
            </section>
          )}
        </section>
      </section>

      <style>{styles}</style>
    </main>
  );
}

const styles = `
:root { color-scheme: dark; }

* { box-sizing: border-box; }

html, body {
  margin: 0;
  padding: 0;
  background: #050b08;
  font-family: Arial, Helvetica, sans-serif;
}

a { text-decoration: none; }

.topology-page {
  min-height: 100vh;
  color: #e7fff2;
  background:
    radial-gradient(circle at top left, rgba(0,255,140,.09), transparent 28%),
    radial-gradient(circle at bottom right, rgba(255,45,45,.07), transparent 28%),
    linear-gradient(180deg, #07110d 0%, #050b08 100%);
}

.grid-bg {
  position: fixed;
  inset: 0;
  pointer-events: none;
  background-image:
    linear-gradient(rgba(0,255,140,.035) 1px, transparent 1px),
    linear-gradient(90deg, rgba(0,255,140,.035) 1px, transparent 1px);
  background-size: 34px 34px;
}

.shell {
  position: relative;
  z-index: 1;
  display: grid;
  grid-template-columns: 270px 1fr;
  min-height: 100vh;
  gap: 18px;
  padding: 18px;
}

.sidebar {
  position: sticky;
  top: 18px;
  height: calc(100vh - 36px);
  display: flex;
  flex-direction: column;
  padding: 18px;
  border: 1px solid rgba(61,255,155,.16);
  border-radius: 24px;
  background: rgba(5,12,9,.88);
}

.brand {
  display: flex;
  gap: 12px;
  align-items: center;
  padding-bottom: 18px;
  border-bottom: 1px solid rgba(61,255,155,.12);
}

.brand-mark {
  width: 44px;
  height: 44px;
  display: grid;
  place-items: center;
  border-radius: 14px;
  background: linear-gradient(135deg,#22c76b,#42ff9a);
  color: #041109;
  font-weight: 900;
  font-size: 22px;
}

.brand-title { font-weight: 900; letter-spacing: .08em; }
.brand-subtitle { color:#7fb395; font-size:12px; margin-top:3px; }

.nav {
  display: grid;
  gap: 7px;
  margin-top: 22px;
}

.nav-link {
  padding: 12px 13px;
  border: 1px solid transparent;
  border-radius: 13px;
  color: #bce8ce;
  font-weight: 700;
}

.nav-link:hover, .nav-link.active {
  border-color: rgba(61,255,155,.2);
  background: rgba(35,255,138,.1);
  color: #eafff3;
}

.logout-button {
  margin-top: auto;
  padding: 12px;
  border: 1px solid rgba(255,77,77,.25);
  border-radius: 13px;
  background: rgba(255,77,77,.08);
  color: #ffc7c7;
  font-weight: 800;
  cursor: pointer;
}

.content {
  min-width: 0;
  padding: 22px;
  border: 1px solid rgba(61,255,155,.12);
  border-radius: 24px;
  background: rgba(5,12,9,.7);
}

.topbar {
  display:flex;
  align-items:flex-start;
  justify-content:space-between;
  gap:20px;
  margin-bottom:18px;
}

.terminal-label {
  color:#76dba2;
  font: 800 11px "Courier New", monospace;
  letter-spacing:.12em;
}

h1 { margin:5px 0 0; font-size:34px; }
.topbar p { max-width:760px; color:#a9cbbb; line-height:1.6; }

.stats {
  display:grid;
  grid-template-columns:repeat(3,100px);
  gap:8px;
}

.stats div {
  padding:12px;
  border:1px solid rgba(61,255,155,.12);
  border-radius:14px;
  background:rgba(3,8,6,.75);
}

.stats span, .details-grid span {
  display:block;
  color:#709985;
  font: 800 10px "Courier New", monospace;
  letter-spacing:.08em;
}

.stats strong {
  display:block;
  margin-top:7px;
  color:#42ff9a;
  font-size:22px;
}

.control-panel {
  display:flex;
  align-items:flex-end;
  flex-wrap:wrap;
  gap:12px;
  padding:15px;
  margin-bottom:14px;
  border:1px solid rgba(61,255,155,.12);
  border-radius:18px;
  background:rgba(3,8,6,.72);
}

.control-field { min-width:230px; flex:1; }
.control-field label {
  display:block;
  margin-bottom:7px;
  color:#9fcbb0;
  font-size:12px;
  font-weight:800;
}

.control-field select {
  width:100%;
  height:44px;
  padding:0 12px;
  border:1px solid rgba(61,255,155,.18);
  border-radius:12px;
  background:#07110d;
  color:#eafff3;
}

.discover-button, .secondary-button, .map-tools button {
  height:44px;
  padding:0 15px;
  border-radius:12px;
  cursor:pointer;
  font-weight:900;
}

.discover-button {
  border:0;
  background:linear-gradient(90deg,#22c76b,#42ff9a);
  color:#041109;
}

.discover-button:disabled { opacity:.6; cursor:not-allowed; }

.secondary-button, .map-tools button {
  border:1px solid rgba(61,255,155,.2);
  background:rgba(61,255,155,.06);
  color:#bfffd7;
}

.message {
  margin-bottom:14px;
  padding:12px 14px;
  border:1px solid rgba(61,255,155,.18);
  border-radius:14px;
  background:rgba(61,255,155,.07);
  color:#dffff0;
  font-family:"Courier New",monospace;
  font-size:12px;
}

.map-card, .details-card {
  border:1px solid rgba(61,255,155,.12);
  border-radius:20px;
  background:rgba(3,8,6,.72);
  overflow:hidden;
}

.map-toolbar {
  display:flex;
  align-items:center;
  justify-content:space-between;
  gap:15px;
  padding:14px 16px;
  border-bottom:1px solid rgba(61,255,155,.1);
}

.map-toolbar strong {
  display:block;
  margin-top:5px;
  color:#eafff3;
}

.map-tools { display:flex; gap:7px; }
.map-tools button { min-width:42px; }

.map-viewport {
  height:min(68vh,720px);
  min-height:520px;
  overflow:hidden;
  background:#030806;
}

.topology-svg {
  width:100%;
  height:100%;
  display:block;
  user-select:none;
  touch-action:none;
}

.legend {
  display:flex;
  flex-wrap:wrap;
  gap:18px;
  padding:11px 15px;
  border-top:1px solid rgba(61,255,155,.1);
  color:#91b9a2;
  font:12px "Courier New",monospace;
}

.legend span { display:flex; align-items:center; gap:7px; }
.legend i { width:9px; height:9px; display:inline-block; border-radius:50%; }
.legend .green { background:#42ff9a; box-shadow:0 0 8px rgba(66,255,154,.6); }
.legend .yellow { background:#ffbf47; box-shadow:0 0 8px rgba(255,191,71,.45); }
.legend .line { width:20px; height:2px; border-radius:0; background:#2d9f69; }

.empty-map {
  height:100%;
  display:grid;
  place-items:center;
  align-content:center;
  padding:40px;
  text-align:center;
}

.empty-icon { font-size:64px; color:#42ff9a; }
.empty-map h2 { margin:8px 0; }
.empty-map p { max-width:560px; color:#89a596; line-height:1.7; }

.details-card {
  display:grid;
  grid-template-columns:280px 1fr;
  gap:20px;
  padding:20px;
  margin-top:14px;
}

.details-card h2 { margin:5px 0; }
.details-card p { color:#86a895; font-family:"Courier New",monospace; }

.details-grid {
  display:grid;
  grid-template-columns:repeat(3,minmax(0,1fr));
  gap:10px;
}

.details-grid div {
  padding:13px;
  border:1px solid rgba(61,255,155,.1);
  border-radius:13px;
  background:rgba(255,255,255,.02);
}

.details-grid strong {
  display:block;
  margin-top:6px;
  color:#eafff3;
  font-size:13px;
}

.action-row {
  grid-column:1 / -1;
  display:flex;
  flex-wrap:wrap;
  gap:9px;
}

.action-row a {
  padding:10px 13px;
  border:1px solid rgba(61,255,155,.18);
  border-radius:11px;
  color:#bfffd7;
  background:rgba(61,255,155,.05);
  font:800 11px "Courier New",monospace;
}

.loading-box {
  min-height:100vh;
  display:grid;
  place-items:center;
  color:#42ff9a;
  font:700 14px "Courier New",monospace;
}

@media(max-width:1050px) {
  .shell { grid-template-columns:1fr; }
  .sidebar { position:relative; top:auto; height:auto; }
  .nav { grid-template-columns:repeat(2,minmax(0,1fr)); }
  .details-card { grid-template-columns:1fr; }
}

@media(max-width:700px) {
  .content { padding:14px; }
  .topbar { flex-direction:column; }
  .stats { grid-template-columns:repeat(3,1fr); width:100%; }
  .control-field { min-width:100%; }
  .map-viewport { min-height:430px; }
  .details-grid { grid-template-columns:1fr 1fr; }
}

@media(max-width:480px) {
  .shell { padding:10px; }
  .sidebar, .content { border-radius:17px; }
  .nav { grid-template-columns:1fr; }
  h1 { font-size:27px; }
  .stats { grid-template-columns:1fr; }
  .details-grid { grid-template-columns:1fr; }
}
`;
