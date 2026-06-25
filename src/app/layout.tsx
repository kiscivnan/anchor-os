import type { Metadata } from "next";

import { AppShell } from "@/components/app-shell";
import { StoreProvider } from "@/lib/store-context";

import "./globals.css";

export const metadata: Metadata = {
  title: "锚点 OS",
  description: "锚点 OS 项目骨架",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body>
        <StoreProvider>
          <AppShell>{children}</AppShell>
        </StoreProvider>
      </body>
    </html>
  );
}
