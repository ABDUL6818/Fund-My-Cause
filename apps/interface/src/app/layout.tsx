// Root layout — locale-specific layout in [locale]/layout.tsx handles html/body.
import { ToastProvider } from '@/components/toast/ToastProvider';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <ToastProvider>{children}</ToastProvider>;
}