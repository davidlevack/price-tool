import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Price Tool",
  description: "Price Tool Application",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}