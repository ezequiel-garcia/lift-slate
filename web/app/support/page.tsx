export default function SupportPage() {
  return (
    <div style={styles.container}>
      <div style={styles.logo}>LIFTSLATE</div>
      <h1 style={styles.heading}>Support</h1>
      <p style={styles.subtitle}>
        Having an issue or need help? We&apos;re here for you.
      </p>

      <a href="mailto:liftslate.support@gmail.com" style={styles.primaryButton}>
        Email Support
      </a>

      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>Common Questions</h2>

        <div style={styles.faqItem}>
          <p style={styles.question}>How do I log a max?</p>
          <p style={styles.answer}>
            Go to My Lifts, tap any exercise, and use the &quot;Log Max&quot;
            button to record a new 1RM or training reference.
          </p>
        </div>

        <div style={styles.faqItem}>
          <p style={styles.question}>How do I switch between kg and lbs?</p>
          <p style={styles.answer}>
            Go to your Profile and toggle your unit preference. All weights are
            stored in kg and converted for display.
          </p>
        </div>

        <div style={styles.faqItem}>
          <p style={styles.question}>How do I join a gym?</p>
          <p style={styles.answer}>
            Ask your coach for an invite link or code. Tap the link to open
            LiftSlate and join automatically, or enter the code manually in the
            Gym tab.
          </p>
        </div>

        <div style={styles.faqItem}>
          <p style={styles.question}>How do I delete my account?</p>
          <p style={styles.answer}>
            Go to Profile → Settings → Delete Account. This permanently removes
            all your data.
          </p>
        </div>
      </div>

      <p style={styles.footer}>
        For anything else, email us at{" "}
        <a href="mailto:liftslate.support@gmail.com" style={styles.link}>
          liftslate.support@gmail.com
        </a>
      </p>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    padding: "48px 24px",
    gap: "24px",
    maxWidth: "600px",
    margin: "0 auto",
  },
  logo: {
    fontSize: "13px",
    letterSpacing: "4px",
    color: "#AAFF45",
    fontWeight: 600,
  },
  heading: {
    fontSize: "32px",
    fontWeight: 700,
    margin: 0,
    color: "#fff",
  },
  subtitle: {
    fontSize: "16px",
    color: "#888",
    margin: 0,
    textAlign: "center",
    maxWidth: "360px",
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
  section: {
    width: "100%",
    display: "flex",
    flexDirection: "column",
    gap: "16px",
    marginTop: "8px",
  },
  sectionTitle: {
    fontSize: "18px",
    fontWeight: 600,
    color: "#fff",
    margin: 0,
  },
  faqItem: {
    background: "#111",
    borderRadius: "12px",
    padding: "16px 20px",
    display: "flex",
    flexDirection: "column",
    gap: "6px",
  },
  question: {
    fontSize: "15px",
    fontWeight: 600,
    color: "#fff",
    margin: 0,
  },
  answer: {
    fontSize: "14px",
    color: "#888",
    margin: 0,
    lineHeight: "1.5",
  },
  footer: {
    fontSize: "14px",
    color: "#555",
    textAlign: "center",
    marginTop: "8px",
  },
  link: {
    color: "#AAFF45",
    textDecoration: "none",
  },
};
