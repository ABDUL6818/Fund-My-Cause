// Root layout — locale-specific layout in [locale]/layout.tsx handles html/body.
import { WalletProvider } from '@/contexts/WalletContext';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <WalletProvider>{children}</WalletProvider>;
}