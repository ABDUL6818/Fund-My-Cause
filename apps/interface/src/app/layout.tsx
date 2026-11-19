// Root layout — locale-specific layout in [locale]/layout.tsx handles html/body.
// Shared design tokens are imported once here so every route (including
// locale-specific layouts) inherits a single token source.
import "../styles/tokens.css";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return children;
}