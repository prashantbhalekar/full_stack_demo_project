import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Full Stack Demo",
  description: "Auth + approval onboarding flow",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <main>{children}</main>
      </body>
    </html>
  );
}
