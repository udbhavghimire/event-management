import "./globals.css";
import AuthSessionProvider from "./components/SessionProvider";

export const metadata = {
  title: "EventFlow – Event Management Platform",
  description: "Create, manage, and attend events with ease.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50 text-slate-900">
        <AuthSessionProvider>{children}</AuthSessionProvider>
      </body>
    </html>
  );
}
