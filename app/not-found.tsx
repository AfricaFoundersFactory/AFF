import Link from "next/link";

export default function RootNotFound() {
  return (
    <html lang="fr">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "#001A2D",
          color: "#F3F6F5",
          fontFamily: "Inter, system-ui, sans-serif",
          textAlign: "center",
          padding: "24px",
        }}
      >
        <div style={{ color: "#17C99A", fontWeight: 700, letterSpacing: "0.1em", marginBottom: 24 }}>
          404
        </div>
        <h1 style={{ fontSize: 28, fontWeight: 600, margin: "0 0 16px" }}>
          Cette page n&apos;existe pas encore. / This page hasn&apos;t been built yet.
        </h1>
        <Link
          href="/fr"
          style={{
            background: "#0B6B52",
            color: "#F3F6F5",
            borderRadius: 8,
            padding: "14px 26px",
            fontSize: "14.5px",
            fontWeight: 600,
            textDecoration: "none",
          }}
        >
          Retour à l&apos;accueil / Back to home
        </Link>
      </body>
    </html>
  );
}
