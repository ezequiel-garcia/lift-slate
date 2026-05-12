export default function HomePage() {
  return (
    <div style={s.container}>
      <div style={s.logo}>LIFTSLATE</div>
      <h1 style={s.heading}>Train with precision.</h1>
      <p style={s.subtitle}>
        Track your strength maxes and auto-calculate percentage-based training
        weights. Built for powerlifters, weightlifters, and anyone who trains
        with a barbell.
      </p>

      <div style={s.storeRow}>
        <a
          href="https://apps.apple.com/app/liftslate/id6763856675"
          style={s.primaryButton}
        >
          Download on the App Store
        </a>
      </div>

      <div style={s.features}>
        <div style={s.feature}>
          <span style={s.featureIcon}>⬆</span>
          <p style={s.featureText}>Log 1RMs and training maxes</p>
        </div>
        <div style={s.feature}>
          <span style={s.featureIcon}>%</span>
          <p style={s.featureText}>Auto-calculate weights from percentages</p>
        </div>
        <div style={s.feature}>
          <span style={s.featureIcon}>🏋</span>
          <p style={s.featureText}>Join a gym and follow coach workouts</p>
        </div>
      </div>

      <footer style={s.footer}>
        <a href="/privacy" style={s.footerLink}>
          Privacy Policy
        </a>
        <span style={s.footerDivider}>·</span>
        <a href="/terms" style={s.footerLink}>
          Terms of Service
        </a>
        <span style={s.footerDivider}>·</span>
        <a href="/support" style={s.footerLink}>
          Support
        </a>
        <p style={s.copyright}>© 2026 Ezequiel Garcia</p>
      </footer>
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  container: {
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "48px 24px",
    gap: "24px",
    textAlign: "center",
  },
  logo: {
    fontSize: "13px",
    letterSpacing: "4px",
    color: "#AAFF45",
    fontWeight: 600,
  },
  heading: {
    fontSize: "40px",
    fontWeight: 700,
    color: "#fff",
    margin: 0,
    lineHeight: 1.2,
  },
  subtitle: {
    fontSize: "17px",
    color: "#888",
    maxWidth: "420px",
    lineHeight: 1.6,
    margin: 0,
  },
  storeRow: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
    alignItems: "center",
    marginTop: "8px",
  },
  primaryButton: {
    display: "inline-block",
    padding: "14px 32px",
    background: "#AAFF45",
    color: "#000",
    borderRadius: "12px",
    fontWeight: 700,
    fontSize: "16px",
    textDecoration: "none",
  },
  secondaryButton: {
    display: "inline-block",
    padding: "14px 32px",
    border: "1px solid #333",
    borderRadius: "12px",
    color: "#fff",
    fontSize: "16px",
    textDecoration: "none",
  },
  features: {
    display: "flex",
    flexDirection: "column",
    gap: "16px",
    marginTop: "16px",
    width: "100%",
    maxWidth: "320px",
  },
  feature: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    background: "#111",
    borderRadius: "12px",
    padding: "14px 18px",
  },
  featureIcon: {
    fontSize: "18px",
    width: "24px",
    textAlign: "center",
  },
  featureText: {
    fontSize: "15px",
    color: "#aaa",
    margin: 0,
  },
  footer: {
    marginTop: "32px",
    display: "flex",
    flexWrap: "wrap",
    justifyContent: "center",
    alignItems: "center",
    gap: "8px",
    flexDirection: "row",
  },
  footerLink: {
    fontSize: "13px",
    color: "#555",
    textDecoration: "none",
  },
  footerDivider: {
    color: "#333",
    fontSize: "13px",
  },
  copyright: {
    width: "100%",
    fontSize: "12px",
    color: "#333",
    margin: "4px 0 0",
  },
};
