import type { Metadata } from 'next';
import { IBM_Plex_Sans } from 'next/font/google';
import './globals.css';

const ibmPlexSans = IBM_Plex_Sans({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-ibm-plex-sans',
});

export const metadata: Metadata = {
  title: {
    default: 'Prisma UML Viewer',
    template: '%s | Prisma UML Viewer',
  },
  description:
    'A online tool to visualize and explore your Prisma schema as an interactive ERD diagram.',
  keywords: [
    'prisma',
    'uml',
    'erd',
    'diagram',
    'database',
    'schema',
    'visualization',
    'prisma schema',
    'database diagram',
    'entity relationship diagram',
    'prisma viewer',
    'schema visualization',
    'prisma 7',
    'prisma 6',
    'prisma 5',
  ],
  authors: [{ name: 'Jessy DAVID', url: 'https://jessy-david.dev' }],
  creator: 'Jessy DAVID',
  publisher: 'Jessy DAVID',
  metadataBase: new URL('https://prisma.jessy-david.dev'),
  alternates: {
    canonical: '/',
  },
  icons: {
    icon: [
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: '/apple-touch-icon.png',
    shortcut: '/favicon.ico',
  },
  manifest: '/manifest.json',
  openGraph: {
    title: 'Prisma UML Viewer',
    description:
      ' A online tool to visualize and explore your Prisma schema as an interactive ERD diagram. ',
    type: 'website',
    locale: 'en_US',
    url: 'https://prisma.jessy-david.dev',
    siteName: 'Prisma UML Viewer',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Prisma UML Viewer',
    description: 'Visualize your Prisma schemas as interactive UML/ERD diagrams',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  category: 'technology',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${ibmPlexSans.variable} font-sans antialiased`}>{children}</body>
    </html>
  );
}
