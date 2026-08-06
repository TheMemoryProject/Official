import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'KTN DEBKG — Optimisation Studio',
  description:
    'Differentiable Evidence-Bound Knowledge Graph: evidence-anchored reasoning, AD gradients, content-addressed optimisation traces.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
      </head>
      <body>{children}</body>
    </html>
  );
}
