import localFont from "next/font/local";
import "./globals.css";

const mainFont = localFont({
  src: "../public/font/ndot-47-inspired-by-nothing.otf",
  variable: "--font-main",
});

export const metadata = {
  title: "Compare AI Models",
  description: "A tool to compare various AI models",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={mainFont.className}>
      <body className="antialiased">{children}</body>
    </html>
  );
}
