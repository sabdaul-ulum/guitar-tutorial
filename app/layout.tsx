import './globals.css';
import { ProgressProvider } from '../features/progress/components/ProgressProvider.tsx';
import { AudioProvider } from '../features/audio/components/AudioProvider.tsx';
import AppShell from '../components/layout/AppShell.tsx';
export const metadata = {
  title: 'Petik — Belajar gitar, satu chord dulu',
  description: 'Belajar chord gitar secara bertahap dengan pemeriksaan senar dan latihan ritme adaptif.'
};
export default function RootLayout({
  children
}: { children: React.ReactNode }) {
  return <html lang="id"><body><ProgressProvider><AudioProvider><AppShell>{children}</AppShell></AudioProvider></ProgressProvider></body></html>;
}
