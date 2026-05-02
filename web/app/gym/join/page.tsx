"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function JoinContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [launched, setLaunched] = useState(false);

  useEffect(() => {
    if (!token) return;
    // Try to open the native app
    window.location.href = `liftslate://gym/join?token=${token}`;
    setLaunched(true);
  }, [token]);

  if (!token) {
    return (
      <div style={styles.container}>
        <div style={styles.logo}>LIFTSLATE</div>
        <p style={styles.subtitle}>Invalid invite link.</p>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.logo}>LIFTSLATE</div>
      <h1 style={styles.heading}>You&apos;re invited!</h1>
      <p style={styles.subtitle}>
        {launched
          ? "Opening LiftSlate… if nothing happened, download the app first."
          : "Opening LiftSlate…"}
      </p>

      <a
        href={`liftslate://gym/join?token=${token}`}
        style={styles.primaryButton}
      >
        Open in LiftSlate
      </a>

      <div style={styles.storeRow}>
        <a
          href="https://apps.apple.com/app/liftslate/id6745012400"
          style={styles.storeButton}
        >
          App Store
        </a>
        <a
          href="https://play.google.com/store/apps/details?id=com.iekekel.LiftSlate"
          style={styles.storeButton}
        >
          Google Play
        </a>
      </div>

      <p style={styles.hint}>
        After installing, tap &quot;Open in LiftSlate&quot; above.
      </p>
    </div>
  );
}

export default function JoinPage() {
  return (
    <Suspense>
      <JoinContent />
    </Suspense>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "24px",
    gap: "16px",
    textAlign: "center",
  },
  logo: {
    fontSize: "13px",
    letterSpacing: "4px",
    color: "#AAFF45",
    fontWeight: 600,
    marginBottom: "8px",
  },
  heading: {
    fontSize: "28px",
    fontWeight: 700,
    margin: 0,
    color: "#fff",
  },
  subtitle: {
    fontSize: "16px",
    color: "#888",
    margin: 0,
    maxWidth: "300px",
  },
  primaryButton: {
    display: "inline-block",
    marginTop: "8px",
    padding: "14px 32px",
    background: "#AAFF45",
    color: "#000",
    borderRadius: "12px",
    fontWeight: 700,
    fontSize: "16px",
    textDecoration: "none",
  },
  storeRow: {
    display: "flex",
    gap: "12px",
    flexWrap: "wrap",
    justifyContent: "center",
  },
  storeButton: {
    display: "inline-block",
    padding: "12px 24px",
    border: "1px solid #333",
    borderRadius: "10px",
    color: "#fff",
    fontSize: "14px",
    textDecoration: "none",
  },
  hint: {
    fontSize: "13px",
    color: "#555",
    margin: 0,
    maxWidth: "280px",
  },
};
