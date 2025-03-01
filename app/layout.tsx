import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Sidebar from '../components/ui/Sidebar';
import { ReactQueryProvider } from '@/lib/providers/ReactQueryProvider';
import { ToastProvider } from '@/components/ui/toast';

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Shopify Viewer",
  description: "View and analyze your Shopify store data",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ReactQueryProvider>
          <ToastProvider>
            <div className="flex h-screen bg-gray-100">
              <Sidebar />
              <main className="flex-1 overflow-auto p-6">
                {children}
              </main>
            </div>
          </ToastProvider>
        </ReactQueryProvider>
      </body>
    </html>
  );
}
