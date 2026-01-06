type Props = {
  children: React.ReactNode;
};

export default function VIPMobileLayout({ children }: Props) {
  return (
    // ✅ 모바일 전용 레이아웃 역할만 수행
    // ❌ padding / width / background 책임 제거
    <div className="space-y-6">
      {children}
    </div>
  );
}
