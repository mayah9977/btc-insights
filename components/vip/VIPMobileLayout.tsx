type Props = {
  children: React.ReactNode;
};

export default function VIPMobileLayout({ children }: Props) {
  return (
    // ✅ 모바일 전용 레이아웃
    // ✅ Desktop(md 이상)에서는 렌더링 차단
    // ❌ 기존 구조 / 로직 변경 없음
    <div className="md:hidden space-y-6">
      {children}
    </div>
  );
}
