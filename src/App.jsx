import { useLayoutEffect } from 'react'
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router'
import Home from './pages/Home'
import MakeBloom from './pages/MakeBloom'
import EditConditions from './pages/EditConditions'
import Compose from './pages/Compose'
import Onboarding from './pages/Onboarding'
import MyPage from './pages/MyPage'
import BloomPreview from './pages/BloomPreview'
import MyBlooms from './pages/MyBlooms'
import BloomDetails from './pages/BloomDetails'
import BloomCard from './pages/BloomCard'
import BloomPrint from './pages/BloomPrint'
import Realize from './pages/Realize'
import { isOnboarded } from './data/onboarding'

// 화면이 바뀌면 맨 위부터 (이전 화면의 스크롤 위치가 남지 않게)
function ScrollToTop() {
  const { pathname } = useLocation()
  useLayoutEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])
  return null
}

// 첫 진입(새로고침·링크 재접속 포함)은 온보딩부터, 끝나면 홈
function StartGate() {
  return isOnboarded() ? <Home /> : <Navigate to="/onboarding" replace />
}

function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<StartGate />} />
        <Route path="/onboarding" element={<Onboarding />} />
        <Route path="/make" element={<MakeBloom />} />
        <Route path="/edit" element={<EditConditions />} />
        <Route path="/compose" element={<Compose />} />
        <Route path="/mypage" element={<MyPage />} />
        <Route path="/preview" element={<BloomPreview />} />
        <Route path="/blooms" element={<MyBlooms />} />
        <Route path="/blooms/:id" element={<BloomDetails />} />
        <Route path="/complete" element={<BloomDetails variant="complete" />} />
        <Route path="/card" element={<BloomCard />} />
        {/* 카드 생성 · My Blooms 저장 (실물 출력 없음) — /print는 예전 주소 */}
        <Route path="/saved" element={<BloomPrint />} />
        <Route path="/print" element={<Navigate to="/saved" replace />} />
        <Route path="/realize" element={<Realize />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
