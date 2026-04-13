import './globals.css'

export const metadata = {
  title: 'MealLog - ご飯専用SNS',
  description: '今日食べた朝・昼・夜ごはんを記録・シェア',
}

export default function RootLayout({ children }) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  )
}
