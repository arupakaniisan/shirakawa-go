import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "shirakawa-go",
  description: "複数車両リアルタイム位置共有アプリ",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}
