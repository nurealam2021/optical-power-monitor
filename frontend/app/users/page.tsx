"use client";

import { useEffect, useState } from "react";
import { getApiBaseUrl } from "../lib/api";

type UserItem = {
  id: number;
  name: string;
  email: string;
  role: string;
  is_active?: boolean;
  created_at?: string;
};


function getRoleLabel(role: string) {
  return role.replace("_", " ").toUpperCase();
}

export default function UsersPage() {
  const [users, setUsers] = useState<UserItem[]>([]);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("12345678");
  const [role, setRole] = useState("user");

  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [listLoading, setListLoading] = useState(true);

  useEffect(() => {
    loadUsers();
  }, []);

  function getToken() {
    return localStorage.getItem("bahon_token");
  }

  async function loadUsers() {
    const token = getToken();

    if (!token) {
      window.location.href = "/login";
      return;
    }

    setListLoading(true);

    try {
      const apiBaseUrl = getApiBaseUrl();

      const response = await fetch(`${apiBaseUrl}/api/users`, {
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
        setMessage(`Failed to load users: ${errorText}`);
        return;
      }

      const data = await response.json();

      if (Array.isArray(data)) {
        setUsers(data);
      } else if (Array.isArray(data.items)) {
        setUsers(data.items);
      } else if (Array.isArray(data.users)) {
        setUsers(data.users);
      } else {
        setUsers([]);
      }
    } catch {
      setMessage("Connection failed while loading users.");
    } finally {
      setListLoading(false);
    }
  }

  async function addUser() {
    const token = getToken();

    if (!token) {
      window.location.href = "/login";
      return;
    }

    setLoading(true);
    setMessage("Creating user...");

    try {
      const apiBaseUrl = getApiBaseUrl();

      const response = await fetch(`${apiBaseUrl}/api/users`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name,
          email,
          password,
          role,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setMessage(`Create failed: ${JSON.stringify(data)}`);
        return;
      }

      setMessage("User created successfully.");

      setName("");
      setEmail("");
      setPassword("12345678");
      setRole("user");

      await loadUsers();
    } catch {
      setMessage("Connection failed while creating user.");
    } finally {
      setLoading(false);
    }
  }

  async function deleteUser(userId: number) {
    const token = getToken();

    if (!token) {
      window.location.href = "/login";
      return;
    }

    const confirmed = window.confirm("Are you sure you want to delete this user?");

    if (!confirmed) {
      return;
    }

    setMessage("Deleting user...");

    try {
      const apiBaseUrl = getApiBaseUrl();

      const response = await fetch(`${apiBaseUrl}/api/users/${userId}`, {
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

      setMessage("User deleted successfully.");
      await loadUsers();
    } catch {
      setMessage("Connection failed while deleting user.");
    }
  }

  async function resetPassword(userId: number) {
    const token = getToken();

    if (!token) {
      window.location.href = "/login";
      return;
    }

    const newPassword = window.prompt(
      "Enter new password for this user:",
      "12345678"
    );

    if (!newPassword) {
      return;
    }

    setMessage("Resetting password...");

    try {
      const apiBaseUrl = getApiBaseUrl();

      const response = await fetch(`${apiBaseUrl}/api/users/${userId}/password`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          password: newPassword,
          new_password: newPassword,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        setMessage(`Password reset failed: ${JSON.stringify(data)}`);
        return;
      }

      setMessage("Password reset successfully.");
    } catch {
      setMessage("Connection failed while resetting password.");
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
              <a href="/users" className="nav-link active">
                Users
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
                <div className="terminal-label">USER_MANAGEMENT</div>
                <h1>Users</h1>
                <p>
                  Create and manage application users. Admin and Super Admin can
                  add operators, admins, and manage access.
                </p>
              </div>

              <button type="button" className="refresh-button" onClick={loadUsers}>
                Refresh
              </button>
            </header>

            <div className="main-grid">
              <section className="form-card">
                <div className="card-header">
                  <span>ADD_USER</span>
                  <strong>Create User</strong>
                </div>

                <label className="field-label">
                  Full Name
                  <input
                    className="field-input"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    placeholder="Example: Md. Nur-E-Alam"
                  />
                </label>

                <label className="field-label">
                  Email Address
                  <input
                    className="field-input"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="Example: user@bahon.com"
                  />
                </label>

                <label className="field-label">
                  Password
                  <input
                    className="field-input"
                    type="password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="Minimum 8 characters"
                  />
                </label>

                <label className="field-label">
                  Role
                  <select
                    className="field-input"
                    value={role}
                    onChange={(event) => setRole(event.target.value)}
                  >
                    <option value="operator">user</option>
                    <option value="admin">Admin</option>
                    <option value="super_admin">Super Admin</option>
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
                  onClick={addUser}
                  disabled={loading}
                >
                  {loading ? "Creating..." : "Create User"}
                </button>
              </section>

              <section className="list-card">
                <div className="card-header">
                  <span>USER_LIST</span>
                  <strong>{users.length} Users</strong>
                </div>

                {listLoading && <div className="empty-state">Loading users...</div>}

                {!listLoading && users.length === 0 && (
                  <div className="empty-state">No users found.</div>
                )}

                {!listLoading && users.length > 0 && (
                  <div className="user-list">
                    {users.map((user) => (
                      <div key={user.id} className="user-item">
                        <div className="user-main">
                          <div className="user-name">{user.name}</div>
                          <div className="user-email">{user.email}</div>
                          <div className="user-meta">
                            ID: {user.id}
                            {user.created_at
                              ? ` · Created: ${new Date(
                                  user.created_at
                                ).toLocaleString()}`
                              : ""}
                          </div>
                        </div>

                        <div className="user-actions">
                          <span className="role-pill">
                            {getRoleLabel(user.role)}
                          </span>

                          <button
                            type="button"
                            className="reset-button"
                            onClick={() => resetPassword(user.id)}
                          >
                            Reset Password
                          </button>

                          <button
                            type="button"
                            className="delete-button"
                            onClick={() => deleteUser(user.id)}
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    ))}
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
        .card-header span {
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
          text-align: center;
        }

        .user-list {
          display: grid;
          gap: 12px;
        }

        .user-item {
          border: 1px solid rgba(61, 255, 155, 0.12);
          background: rgba(255, 255, 255, 0.025);
          border-radius: 18px;
          padding: 16px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
        }

        .user-name {
          font-weight: 900;
          color: #f0fff7;
          font-size: 17px;
        }

        .user-email {
          margin-top: 6px;
          color: #9fbead;
          font-size: 13px;
          font-family: "Courier New", Courier, monospace;
        }

        .user-meta {
          margin-top: 5px;
          color: #7f9f8d;
          font-size: 13px;
        }

        .user-actions {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
          justify-content: flex-end;
        }

        .role-pill {
          border-radius: 999px;
          padding: 8px 10px;
          font-size: 12px;
          font-family: "Courier New", Courier, monospace;
          font-weight: 900;
          background: rgba(66, 255, 154, 0.14);
          color: #42ff9a;
          border: 1px solid rgba(66, 255, 154, 0.35);
        }

        .reset-button {
          border: 1px solid rgba(91, 192, 255, 0.28);
          background: rgba(91, 192, 255, 0.08);
          color: #bfeaff;
          border-radius: 12px;
          padding: 9px 12px;
          cursor: pointer;
          font-weight: 800;
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

          .refresh-button {
            width: 100%;
          }

          h1 {
            font-size: 28px;
          }

          .nav {
            grid-template-columns: 1fr;
          }

          .user-item {
            flex-direction: column;
            align-items: flex-start;
          }

          .user-actions {
            width: 100%;
            justify-content: flex-start;
          }
        }
      `}</style>
    </>
  );
}
