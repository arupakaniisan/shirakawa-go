import type { Metadata } from "next";

export const metadata: Metadata = {
  metadataBase: new URL("https://shirakawa-go-nabe.vercel.app"),
  title: "shirakawa-go",
  description:
    "合宿・旅行・イベントで活躍！複数台の車の位置をリアルタイムで共有。「あいつら今どこ？」をゼロにする、みんなのドライブ位置共有アプリ。",
  openGraph: {
    title: "shirakawa-go — みんなの車、今どこ？",
    description:
      "合宿・旅行・イベントで活躍！複数台の車の位置をリアルタイムで共有。「あいつら今どこ？」をゼロにする、みんなのドライブ位置共有アプリ。",
    type: "website",
  },
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
