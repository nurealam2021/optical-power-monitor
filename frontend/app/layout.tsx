import type { Metadata } from "next";

import AppFooter from "./components/AppFooter";

export const metadata: Metadata = {
  title: "Optical Power Monitor",
  description:
    "Live RX/TX Optical Power Checker for Huawei, ZTE, and Cisco Routers",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body style={{ margin: 0, paddingBottom: 48 }}>
        {children}
        <AppFooter />
      </body>
    </html>
  );
}