'use client';

export function ExtremeWarningModal({
  onConfirm,
}: {
  onConfirm: () => void;
}) {
  return (
    <div style={{ padding: 24 }}>
      <h2>고급 분석 기능 안내</h2>
      <p>
        본 기능은 시장 데이터를 분석하기 위한 참고용
        시각화 도구입니다.
      </p>
      <p>
        투자 판단의 근거로 사용해서는 안 되며,
        모든 책임은 사용자 본인에게 있습니다.
      </p>
      <button onClick={onConfirm}>
        확인하고 계속
      </button>
    </div>
  );
}
