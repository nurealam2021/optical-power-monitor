export default function HomePage() {
  return (
    <>
      <main className="landing-page">
        <div className="background-grid" />
        <div className="background-glow glow-one" />
        <div className="background-glow glow-two" />

        <section className="hero-wrapper">
          <div className="hero-card">
            <div className="hero-topbar">
              <div className="window-dots">
                <span className="dot red" />
                <span className="dot yellow" />
                <span className="dot green" />
              </div>

              <div className="terminal-label">
                ISP/IIG/NTTN/Datacenter // Optical Power Monitor
              </div>
            </div>

            <div className="hero-content">
              <div className="badge-row">
                <span className="badge">ISP/IIG/NTTN/Datacenter</span>
                <span className="badge badge-outline">Secure Mode</span>
                <span className="badge badge-outline">RO</span>
              </div>

              <h1 className="hero-title">
                ISP/IIG/NTTN/Datacenter Optical Power
                <span className="hero-highlight"> Monitor</span>
              </h1>

              <p className="hero-subtitle">
                Secure live optical power monitoring for Huawei, ZTE, and Cisco
                routers using read-only access. Built for operations teams.
              </p>

              <div className="feature-grid">
                <div className="feature-card">
                  <div className="feature-label">VENDORS</div>
                  <div className="feature-value">Huawei / ZTE / Cisco</div>
                  <div className="feature-meta">Multi-vendor support</div>
                </div>

                <div className="feature-card">
                  <div className="feature-label">MODE</div>
                  <div className="feature-value">RX / TX Live Check</div>
                  <div className="feature-meta">Per router interface</div>
                </div>

                <div className="feature-card">
                  <div className="feature-label">ACCESS</div>
                  <div className="feature-value">Show Command Only</div>
                  <div className="feature-meta">No privileged mode needed</div>
                </div>

                <div className="feature-card">
                  <div className="feature-label">PLATFORM</div>
                  <div className="feature-value">Mobile + Desktop</div>
                  <div className="feature-meta">Responsive UI ready</div>
                </div>
              </div>

              <div className="status-panel">
                <div className="status-line">
                  <span className="status-key">SYSTEM_STATUS</span>
                  <span className="status-value online">ONLINE</span>
                </div>
                <div className="status-line">
                  <span className="status-key">BACKEND_API</span>
                  <span className="status-value">CONNECTED</span>
                </div>
                <div className="status-line">
                  <span className="status-key">SECURITY_PROFILE</span>
                  <span className="status-value">Developed By ISP/IIG/NTTN/Datacenter Operation Team</span>
                </div>
              </div>

              <div className="button-row">
                <a href="/login" className="primary-button">
                  Access Console
                </a>

                <a href="/login" className="secondary-button">
                  Operator Login
                </a>
              </div>
            </div>
          </div>
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
          background: #07110d;
          font-family: Arial, Helvetica, sans-serif;
        }

        body {
          color: #e7fff2;
        }

        a {
          text-decoration: none;
        }

        .landing-page {
          min-height: 100vh;
          position: relative;
          overflow: hidden;
          background:
            radial-gradient(circle at top left, rgba(0, 255, 140, 0.08), transparent 30%),
            radial-gradient(circle at bottom right, rgba(255, 60, 60, 0.06), transparent 25%),
            linear-gradient(180deg, #07110d 0%, #081510 40%, #050b08 100%);
        }

        .background-grid {
          position: absolute;
          inset: 0;
          background-image:
            linear-gradient(rgba(0, 255, 140, 0.06) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0, 255, 140, 0.06) 1px, transparent 1px);
          background-size: 32px 32px;
          mask-image: linear-gradient(to bottom, rgba(0,0,0,0.45), rgba(0,0,0,0.9));
          pointer-events: none;
        }

        .background-glow {
          position: absolute;
          border-radius: 999px;
          filter: blur(100px);
          pointer-events: none;
        }

        .glow-one {
          width: 320px;
          height: 320px;
          background: rgba(0, 255, 140, 0.10);
          top: 60px;
          left: -60px;
        }

        .glow-two {
          width: 340px;
          height: 340px;
          background: rgba(255, 40, 40, 0.08);
          bottom: -40px;
          right: -40px;
        }

        .hero-wrapper {
          position: relative;
          z-index: 1;
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 24px;
        }

        .hero-card {
          width: 100%;
          max-width: 1180px;
          border: 1px solid rgba(61, 255, 155, 0.18);
          background: rgba(5, 12, 9, 0.88);
          backdrop-filter: blur(12px);
          border-radius: 24px;
          overflow: hidden;
          box-shadow:
            0 0 0 1px rgba(0, 255, 140, 0.04),
            0 20px 60px rgba(0, 0, 0, 0.55),
            0 0 30px rgba(0, 255, 140, 0.08);
        }

        .hero-topbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          padding: 14px 18px;
          border-bottom: 1px solid rgba(61, 255, 155, 0.12);
          background: linear-gradient(180deg, rgba(10, 22, 16, 0.95), rgba(8, 15, 11, 0.95));
        }

        .window-dots {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .dot {
          width: 12px;
          height: 12px;
          border-radius: 999px;
          display: inline-block;
        }

        .dot.red {
          background: #ff4d4d;
          box-shadow: 0 0 8px rgba(255, 77, 77, 0.5);
        }

        .dot.yellow {
          background: #ffbf47;
          box-shadow: 0 0 8px rgba(255, 191, 71, 0.4);
        }

        .dot.green {
          background: #2fff89;
          box-shadow: 0 0 8px rgba(47, 255, 137, 0.6);
        }

        .terminal-label {
          font-size: 12px;
          color: #8ebda2;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          font-family: "Courier New", Courier, monospace;
          text-align: right;
        }

        .hero-content {
          padding: 34px 24px 28px;
        }

        .badge-row {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          margin-bottom: 20px;
        }

        .badge {
          padding: 8px 12px;
          border-radius: 999px;
          background: rgba(35, 255, 138, 0.14);
          border: 1px solid rgba(61, 255, 155, 0.25);
          color: #a7ffca;
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          font-family: "Courier New", Courier, monospace;
        }

        .badge-outline {
          background: rgba(255, 255, 255, 0.02);
          color: #d2efe0;
        }

        .hero-title {
          margin: 0;
          font-size: 38px;
          line-height: 1.1;
          font-weight: 800;
          letter-spacing: -0.02em;
          color: #f1fff7;
        }

        .hero-highlight {
          color: #59ffac;
          text-shadow: 0 0 16px rgba(89, 255, 172, 0.35);
        }

        .hero-subtitle {
          max-width: 850px;
          margin-top: 18px;
          margin-bottom: 28px;
          color: #b8d8c6;
          font-size: 16px;
          line-height: 1.75;
        }

        .feature-grid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 16px;
        }

        .feature-card {
          border: 1px solid rgba(61, 255, 155, 0.14);
          background: linear-gradient(180deg, rgba(9, 22, 16, 0.8), rgba(5, 12, 9, 0.9));
          border-radius: 18px;
          padding: 18px;
          box-shadow: inset 0 0 0 1px rgba(255,255,255,0.015);
        }

        .feature-label {
          color: #76dba2;
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          font-family: "Courier New", Courier, monospace;
        }

        .feature-value {
          margin-top: 10px;
          color: #f0fff7;
          font-size: 18px;
          font-weight: 700;
          line-height: 1.4;
        }

        .feature-meta {
          margin-top: 8px;
          color: #89a596;
          font-size: 13px;
        }

        .status-panel {
          margin-top: 24px;
          border: 1px solid rgba(61, 255, 155, 0.12);
          background: rgba(3, 8, 6, 0.75);
          border-radius: 18px;
          padding: 18px;
        }

        .status-line {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          padding: 10px 0;
          border-bottom: 1px dashed rgba(61, 255, 155, 0.10);
          font-family: "Courier New", Courier, monospace;
        }

        .status-line:last-child {
          border-bottom: none;
        }

        .status-key {
          color: #7fb395;
          font-size: 13px;
          letter-spacing: 0.08em;
        }

        .status-value {
          color: #dffff0;
          font-size: 13px;
          font-weight: 700;
          letter-spacing: 0.06em;
        }

        .status-value.online {
          color: #48ff98;
          text-shadow: 0 0 10px rgba(72, 255, 152, 0.4);
        }

        .button-row {
          display: flex;
          flex-wrap: wrap;
          gap: 14px;
          margin-top: 28px;
        }

        .primary-button,
        .secondary-button {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-height: 50px;
          padding: 0 20px;
          border-radius: 14px;
          font-weight: 700;
          transition: all 0.2s ease;
        }

        .primary-button {
          background: linear-gradient(90deg, #22c76b, #42ff9a);
          color: #041109;
          box-shadow: 0 10px 24px rgba(0, 255, 140, 0.22);
        }

        .primary-button:hover {
          transform: translateY(-1px);
          box-shadow: 0 14px 28px rgba(0, 255, 140, 0.28);
        }

        .secondary-button {
          border: 1px solid rgba(61, 255, 155, 0.20);
          background: rgba(255, 255, 255, 0.02);
          color: #dffff0;
        }

        .secondary-button:hover {
          background: rgba(61, 255, 155, 0.08);
          transform: translateY(-1px);
        }

        @media (max-width: 980px) {
          .feature-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }

          .hero-title {
            font-size: 32px;
          }
        }

        @media (max-width: 640px) {
          .hero-wrapper {
            padding: 14px;
          }

          .hero-content {
            padding: 22px 16px 20px;
          }

          .hero-topbar {
            flex-direction: column;
            align-items: flex-start;
          }

          .terminal-label {
            text-align: left;
          }

          .feature-grid {
            grid-template-columns: 1fr;
          }

          .hero-title {
            font-size: 28px;
          }

          .hero-subtitle {
            font-size: 15px;
          }

          .button-row {
            flex-direction: column;
          }

          .primary-button,
          .secondary-button {
            width: 100%;
          }

          .status-line {
            flex-direction: column;
            align-items: flex-start;
          }
        }
      `}</style>
    </>
  );
}