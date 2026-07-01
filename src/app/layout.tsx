import type { Metadata } from "next";
import "@styles/globals.css";
import { AuthProvider } from "@/application/context/AuthContext";

export const metadata: Metadata = {
  title: "Smart Night Market",
  description: "Booth owner dashboard",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
