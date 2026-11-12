// 부케 구성 안내 딤: 페이지를 새로 불러올 때마다(새로고침·링크 재접속) 한 번씩 보여줌.
// 앱 안에서 화면을 오가며 다시 들어올 때는 반복하지 않음
let seenThisLoad = false

// 부케 구성 화면에 들어올 때 안내가 나올지 (안내 중엔 하단 안내 문구를 숨김)
export const isGuidePending = () => !seenThisLoad

export function markGuideSeen() {
  seenThisLoad = true
}
