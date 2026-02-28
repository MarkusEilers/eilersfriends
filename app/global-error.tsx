"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="de">
      <body>
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh", fontFamily: "system-ui" }}>
          <div style={{ textAlign: "center" }}>
            <h1 style={{ fontSize: "2rem", fontWeight: 700, marginBottom: "1rem" }}>Etwas ist schiefgelaufen</h1>
            <button onClick={() => reset()} style={{ padding: "0.5rem 1rem", cursor: "pointer" }}>
              Erneut versuchen
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
