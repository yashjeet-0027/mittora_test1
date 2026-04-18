import "./globals.css";

export const metadata = {
  title: "Mittora — Powered by Earth",
  description:
    "Discover Mittora: handcrafted clay vessels forged through fire and tradition, refined for modern living. The Kalindi Edition.",
  keywords: ["Mittora", "clay", "handcrafted", "pottery", "Kalindi", "earth"],
  openGraph: {
    title: "Mittora — Powered by Earth",
    description:
      "Handcrafted clay vessels forged through fire and tradition.",
    type: "website",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;1,300;1,400&family=Inter:wght@300;400;500;600&family=JetBrains+Mono:wght@300;400;500&family=Playfair+Display:ital,wght@0,400;0,500;0,600;0,700;0,800;0,900;1,400;1,500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-black antialiased">{children}</body>
    </html>
  );
}
