export default function AppFooter() {
  return (
    <footer style={styles.footer}>
      <div style={styles.inner}>
        <span>
          Developed by <strong>Md. Nur-E-Alam </strong>
        </span>

        <span style={styles.separator}>|</span>

        <span>
          Contact: <strong>01581627176</strong>
        </span>

        <span style={styles.separator}>|</span>

        <span>
          Email: <strong>nurealam.csedu@gmail.com</strong>
        </span>
      </div>
    </footer>
  );
}

const styles: Record<string, React.CSSProperties> = {
  footer: {
    position: "fixed",
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 9999,
    borderTop: "1px solid rgba(61, 255, 155, 0.18)",
    background: "rgba(3, 8, 6, 0.92)",
    backdropFilter: "blur(14px)",
    color: "#bce8ce",
    fontFamily: "Arial, Helvetica, sans-serif",
    fontSize: 13,
    boxShadow: "0 -10px 30px rgba(0, 255, 140, 0.08)",
  },
  inner: {
    minHeight: 38,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    flexWrap: "wrap",
    padding: "8px 14px",
    textAlign: "center",
  },
  separator: {
    color: "rgba(188, 232, 206, 0.45)",
  },
};