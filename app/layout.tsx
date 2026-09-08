import './globals.css';
export const metadata = {
  title: '베베숲 고객 경험 설문',
  description: '물티슈를 선택하고 사용한 경험을 들려주세요.',
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
