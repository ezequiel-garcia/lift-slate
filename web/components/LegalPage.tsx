import type { ReactNode } from "react";

export function LegalPage({
  title,
  effectiveDate,
  children,
}: {
  title: string;
  effectiveDate: string;
  children: ReactNode;
}) {
  return (
    <div style={s.page}>
      <a href="/" style={s.logo}>
        LIFTSLATE
      </a>
      <div style={s.container}>
        <h1 style={s.h1}>{title}</h1>
        <p style={s.date}>Effective date: {effectiveDate}</p>
        {children}
        <div style={s.footer}>© 2026 Ezequiel Garcia. All rights reserved.</div>
      </div>
    </div>
  );
}

export const s: Record<string, React.CSSProperties> = {
  page: {
    padding: "32px 16px 64px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "24px",
  },
  logo: {
    fontSize: "13px",
    letterSpacing: "4px",
    color: "#AAFF45",
    fontWeight: 600,
    textDecoration: "none",
  },
  container: {
    maxWidth: "720px",
    width: "100%",
    display: "flex",
    flexDirection: "column",
    gap: "0",
  },
  h1: {
    fontSize: "28px",
    fontWeight: 700,
    color: "#fff",
    margin: "0 0 8px",
  },
  date: {
    fontSize: "14px",
    color: "#555",
    margin: "0 0 32px",
  },
  h2: {
    fontSize: "18px",
    fontWeight: 600,
    color: "#fff",
    margin: "32px 0 12px",
  },
  h3: {
    fontSize: "15px",
    fontWeight: 600,
    color: "#ccc",
    margin: "20px 0 8px",
  },
  p: {
    fontSize: "15px",
    color: "#888",
    lineHeight: "1.7",
    margin: "0 0 12px",
  },
  ul: {
    paddingLeft: "20px",
    margin: "0 0 12px",
    display: "flex",
    flexDirection: "column",
    gap: "6px",
  },
  li: {
    fontSize: "15px",
    color: "#888",
    lineHeight: "1.6",
  },
  a: {
    color: "#AAFF45",
    textDecoration: "none",
  },
  strong: {
    color: "#ccc",
    fontWeight: 600,
  },
  footer: {
    marginTop: "48px",
    paddingTop: "24px",
    borderTop: "1px solid #1a1a1a",
    fontSize: "13px",
    color: "#444",
  },
};
