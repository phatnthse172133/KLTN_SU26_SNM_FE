import type { Metadata } from "next";
import "@styles/globals.css";
import { AuthProvider } from "@/application/context/AuthContext";
import { NotificationProvider } from "@/application/context/NotificationContext";
import { ToastProvider } from "@/presentation/components/shared/ToastContext";
import { ToastContainer } from "@/presentation/components/shared/ToastContainer";
import { RealtimeProvider } from "@/presentation/components/shared/RealtimeProvider";
import { ChatRealtimeProvider } from "@/application/context/ChatRealtimeContext";

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
        <AuthProvider>
          <RealtimeProvider>
            <ChatRealtimeProvider>
            <NotificationProvider>
              <ToastProvider>
                {children}
                <ToastContainer />
              </ToastProvider>
            </NotificationProvider>
            </ChatRealtimeProvider>
          </RealtimeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}