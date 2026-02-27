export default function NotFound() {
  return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh", fontFamily: "system-ui" }}>
      <div style={{ textAlign: "center" }}>
        <h1 style={{ fontSize: "3rem", fontWeight: 700, marginBottom: "1rem" }}>404</h1>
        <p style={{ fontSize: "1.25rem", color: "#666" }}>Seite nicht gefunden</p>
        <a href="/" style={{ color: "#2563eb", textDecoration: "underline", marginTop: "1rem", display: "inline-block" }}>
          Zurück zur Startseite
        </a>
      </div>
    </div>
  );
}
