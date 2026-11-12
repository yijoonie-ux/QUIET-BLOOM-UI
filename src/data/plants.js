import { useProfile } from './profile'
import yeonbapImg from '../assets/compose/plant-yeonbap.png'
import ruscusImg from '../assets/compose/plant-ruscus.png'
import fatsiaImg from '../assets/compose/plant-fatsia.png'
import aspidistraImg from '../assets/compose/plant-aspidistra.png'
import pittosporumImg from '../assets/compose/plant-pittosporum.png'
import camelliaImg from '../assets/compose/plant-camellia.png'
import aspleniumImg from '../assets/compose/plant-asplenium.png'
import lotusLeafImg from '../assets/compose/plant-lotus-leaf.png'
import salalImg from '../assets/compose/plant-salal.png'
import treefernImg from '../assets/compose/plant-treefern.png'
import mimosaImg from '../assets/compose/plant-mimosa.png'
import marantaImg from '../assets/compose/plant-maranta.png'
import bouvardiaImg from '../assets/compose/plant-bouvardia.png'
import hostaImg from '../assets/compose/plant-hosta.png'
import photiniaImg from '../assets/compose/plant-photinia.png'
import hypoestesImg from '../assets/compose/plant-hypoestes.png'
import pileaImg from '../assets/compose/plant-pilea.png'
import usneoidesImg from '../assets/compose/plant-usneoides.png'
import italianRuscusImg from '../assets/compose/plant-italian-ruscus.png'
import curlyWillowImg from '../assets/compose/plant-curly-willow.png'
import bambooImg from '../assets/compose/plant-bamboo.png'
import horsetailImg from '../assets/compose/plant-horsetail.png'
import cyperusImg from '../assets/compose/plant-cyperus.png'
import spireaImg from '../assets/compose/plant-spirea.png'
import steelGrassImg from '../assets/compose/plant-steel-grass.png'
import arecaImg from '../assets/compose/plant-areca.png'
import fescueImg from '../assets/compose/plant-fescue.png'
import xerographicaImg from '../assets/compose/plant-xerographica.png'
import ionanthaImg from '../assets/compose/plant-ionantha.png'
import caputMedusaeImg from '../assets/compose/plant-caput-medusae.png'
import houstonImg from '../assets/compose/plant-houston.png'
import phylicaImg from '../assets/compose/plant-phylica.png'
import juncusImg from '../assets/compose/plant-juncus.png'
import peperomiaImg from '../assets/compose/plant-peperomia.png'
import lambsEarImg from '../assets/compose/plant-lambs-ear.png'
import bostonFernImg from '../assets/compose/plant-boston-fern.png'
import dracaenaImg from '../assets/compose/plant-dracaena.png'
import carissaImg from '../assets/compose/plant-carissa.png'
import pineappleImg from '../assets/compose/plant-pineapple.png'
import monsteraImg from '../assets/compose/plant-monstera.png'
import javitaImg from '../assets/compose/plant-javita.png'
import caladiumImg from '../assets/compose/plant-caladium.png'
import eucalyptusImg from '../assets/compose/plant-eucalyptus.png'
import polyanImg from '../assets/compose/plant-polyan.png'
import clusiaImg from '../assets/compose/plant-clusia.png'
import selloumImg from '../assets/compose/plant-selloum.png'
import myrtleImg from '../assets/compose/plant-myrtle.png'
import oreganoImg from '../assets/compose/plant-oregano.png'
import lemonVerbenaImg from '../assets/compose/plant-lemon-verbena.png'
import coleusImg from '../assets/compose/plant-coleus.png'
import ivyImg from '../assets/compose/plant-ivy.png'
import cypressImg from '../assets/compose/plant-cypress.png'
import blueIceImg from '../assets/compose/plant-blue-ice.png'
import blackjackImg from '../assets/compose/plant-blackjack.png'
import senecioImg from '../assets/compose/plant-senecio.png'
import plumosaImg from '../assets/compose/plant-plumosa.png'
import dustyMillerImg from '../assets/compose/plant-dusty-miller.png'
import naengichoImg from '../assets/compose/plant-naengicho.png'
import rexBegoniaImg from '../assets/compose/plant-rex-begonia.png'
import aspidistraDetailImg from '../assets/compose/detail-aspidistra.png'

// 카드(170×160) 안 식물 사진 배치 (Figma 부케 구성 화면 기준)
// frame: 카드 기준 [left, top, width, height] / crop: 원본 이미지 [width%, height%, left%, top%]
// veil: 긴 이름이 사진에 묻히지 않게 이름 뒤에 까는 흰 번짐 [left, top, width, height, blur, 불투명 구간 끝%]
const photo = (src, frame, crop, veil) => ({ src, frame, crop, veil })

// 부케 구성 단계 (Figma: Structure / Volume / Line / Texture 화면)
export const CATEGORIES = [
  { key: 'structure', title: 'Structure', desc: '부케의 형태와 기본 구조를 잡아줘요' },
  { key: 'volume', title: 'Volume', desc: '풍성한 실루엣과 입체감을 더해줘요' },
  { key: 'line', title: 'Line', desc: '부케의 흐름과 방향감을 만들어줘요' },
  { key: 'texture', title: 'Texture', desc: '다양한 결감과 디테일을 더해줘요' },
]

// TODO: 서버 연동 전 임시 식물 목록 (Figma 부케 구성 화면 2268:18886 / 19129 / 20043 / 19399 기준)
export const PLANTS = [
  {
    name: '연밥',
    category: 'structure',
    price: 8000,
    photo: photo(yeonbapImg, [82, 13.9, 68.1, 146.09], [291.52, 199.75, -88.6, -12.85]),
    // 식물 상세 팝업 (Figma 2885:8063) — 카드 사진을 크게
    detail: {
      frame: [82, 20, 73, 156],
      crop: [291.52, 199.75, -88.6, -12.85],
      desc: ['넓고 단단한 잎으로 부케의 외곽', '형태와 안정적인 구조를 잡아줘요.'],
      lowIrritant: true,
      scent: 'LOW',
      lasting: '21 days',
      water: '2~3일 간격',
    },
  },
  { name: '루스커스', category: 'structure', price: 900, photo: photo(ruscusImg, [83.59, 9.74, 66.61, 150.25], [174.32, 119.87, -37.56, 0]) },
  { name: '팔손이', category: 'structure', price: 1200, photo: photo(fatsiaImg, [61.33, 15.8, 105.08, 144.2], [107.94, 118.18, -4.55, -11.8]) },
  {
    name: '엽란',
    category: 'structure',
    price: 900,
    photo: photo(aspidistraImg, [107, 16, 28, 144], [362.4, 107.96, -122.53, -3.42]),
    // 식물 상세 팝업 (Figma 2268:18608)
    detail: {
      image: aspidistraDetailImg,
      desc: ['넓고 단단한 잎으로 부케의 외곽', '형태와 안정적인 구조를 잡아줘요.'],
      lowIrritant: true,
      scent: 'LOW',
      lasting: '21 days',
      water: '2~3일 간격',
    },
  },
  { name: '피토스포룸', category: 'structure', price: 1400, photo: photo(pittosporumImg, [88, 16, 68, 144], [147.98, 104.63, -27.02, -1.77]) },
  { name: '카멜리아', category: 'structure', price: 4100, photo: photo(camelliaImg, [94.02, 16.42, 60.46, 143.58], [198.2, 111.28, -45.45, -5.72]) },
  { name: '아스플레니움', category: 'structure', price: 1500, photo: photo(aspleniumImg, [107, 15, 30, 145], [332.14, 104.1, -121.43, -0.93]) },
  { name: '연잎', category: 'structure', price: 3000, photo: photo(lotusLeafImg, [67, 23, 88, 137], [105.8, 102.1, -4.53, -2.1]) },
  // 저자극을 켜면 빠지는 식물 (lowIrritant: false) — Figma 무필터 화면 2849:27815
  { name: '드라세나', category: 'structure', price: 1800, lowIrritant: false, photo: photo(dracaenaImg, [67.52, 16.01, 93.22, 143.99], [110.24, 107.05, -6, -2.4]) },
  { name: '카리사', category: 'structure', price: 1800, lowIrritant: false, photo: photo(carissaImg, [89, 16, 64, 144], [131.7, 110.21, -15.65, -3.62]) },
  { name: '파인애플', category: 'structure', price: 8000, lowIrritant: false, photo: photo(pineappleImg, [77, 14, 75, 146], [134.37, 103.59, -17.18, -1.2]) },
  { name: '몬스테라', category: 'structure', price: 5000, lowIrritant: false, photo: photo(monsteraImg, [75, 20.43, 77, 139.58], [127.69, 105.21, -15.38, -1.06]) },
  { name: '자비타', category: 'structure', price: 2000, lowIrritant: false, photo: photo(javitaImg, [63, 9.01, 97, 151], [118.3, 101.32, -9.66, 0]) },
  { name: '칼라디움', category: 'structure', price: 1200, lowIrritant: false, photo: photo(caladiumImg, [87, 18.01, 67, 142], [167.57, 117.88, -35.23, -9.59]) },

  // Volume (Figma 2268:19129)
  { name: '살랄', category: 'volume', price: 900, photo: photo(salalImg, [79.95, 16.03, 68.18, 143.97], [163.8, 111.1, -30, -4.37]) },
  { name: '트리펀', category: 'volume', price: 1000, photo: photo(treefernImg, [73.86, 16.02, 76.66, 143.95], [154.06, 104.38, -27.78, -1.52]) },
  { name: '미모사', category: 'volume', price: 1000, photo: photo(mimosaImg, [63, 19, 93, 141], [129.03, 113.48, -19.35, -2.84]) },
  { name: '마란타', category: 'volume', price: 1100, photo: photo(marantaImg, [72, 16, 83, 144], [170.79, 123.01, -20.47, -9.41]) },
  { name: '부바르디아', category: 'volume', price: 2000, photo: photo(bouvardiaImg, [89.68, 16.13, 58.91, 143.85], [168.02, 105.66, -32.65, -2.07]) },
  { name: '호스타', category: 'volume', price: 2300, photo: photo(hostaImg, [88, 16, 65, 144], [155.62, 107.82, -25.27, -3.71]) },
  { name: '홍가시', category: 'volume', price: 1000, photo: photo(photiniaImg, [60, 16.01, 95, 143.99], [115.31, 101.65, -7.66, 0]) },
  {
    name: '하이포에스테스',
    category: 'volume',
    price: 900,
    photo: photo(hypoestesImg, [90, 16, 68.89, 143.99], [173.39, 106.32, -37.25, -2.02], [79, 102, 60, 28, 10, 16.807]),
  },
  {
    name: '필레아 카디에레이',
    category: 'volume',
    price: 1000,
    photo: photo(pileaImg, [85, 16, 70, 144], [174.91, 117.92, -30.91, -5.83], [87, 102, 83, 28, 10, 16.807]),
  },
  // 저자극에서 빠짐 / scent 'high'는 저향(향 노출 제어)에서도 빠짐 — Figma 2849:30382
  { name: '유칼립투스', category: 'volume', price: 1000, lowIrritant: false, scent: 'high', photo: photo(eucalyptusImg, [79, 16, 76, 144], [136.17, 106.6, -18.18, -3.65]) },
  {
    name: '폴리안 유칼립투스',
    category: 'volume',
    price: 1000,
    lowIrritant: false,
    scent: 'high',
    photo: photo(polyanImg, [78, 16, 73, 144], [150.84, 102.29, -25.98, -0.57], [100, 107, 47, 23, 10, 16.807]),
  },
  { name: '클루시아', category: 'volume', price: 2500, lowIrritant: false, photo: photo(clusiaImg, [93, 16, 54, 144], [195.76, 110.81, -51.81, -5]) },
  { name: '셀렘', category: 'volume', price: 1500, lowIrritant: false, photo: photo(selloumImg, [72, 25, 83, 134.92], [125.6, 102.96, -14.61, 0]) },
  { name: '머틀', category: 'volume', price: 1000, lowIrritant: false, scent: 'high', photo: photo(myrtleImg, [55, 21, 98, 139], [102.63, 108.33, 0, -5.09]) },
  { name: '오레가노', category: 'volume', price: 1000, lowIrritant: false, scent: 'high', photo: photo(oreganoImg, [86, 16, 63, 144], [180.42, 117.73, -41.56, -9.04]) },
  { name: '레몬버베나', category: 'volume', price: 1000, lowIrritant: false, scent: 'high', photo: photo(lemonVerbenaImg, [96, 16, 56, 143.92], [179.49, 103.46, -43.37, -1.39]) },
  { name: '콜레우스', category: 'volume', price: 1000, lowIrritant: false, photo: photo(coleusImg, [88, 23, 73, 137], [116.49, 107.25, -9.57, -0.36]) },

  // Line (Figma 2268:20043)
  { name: '수염틸란드시아', category: 'line', price: 10000, photo: photo(usneoidesImg, [98.35, 16.05, 50.48, 143.96], [209.62, 110.26, -55.08, -5.72]) },
  {
    name: '이탈리안 루스커스',
    category: 'line',
    price: 3500,
    photo: photo(italianRuscusImg, [93.83, 16.05, 59.25, 143.96], [212.61, 104.75, -59.18, -2.13], [94, 94, 76, 50, 12, 25.524]),
  },
  { name: '운룡버들', category: 'line', price: 1500, photo: photo(curlyWillowImg, [91, 17.99, 48, 142], [244.04, 109.31, -76.18, -0.75]) },
  { name: '대나무', category: 'line', price: 4000, photo: photo(bambooImg, [95.01, 11.99, 47, 148], [242.55, 102.7, -78.72, 0]) },
  { name: '속새', category: 'line', price: 800, photo: photo(horsetailImg, [117.6, 16.15, 12.1, 143.85], [1383.99, 155.26, -636.56, -6.02]) },
  { name: '시페루스', category: 'line', price: 900, photo: photo(cyperusImg, [58.01, 13.01, 102, 147], [111.63, 102.4, -4.65, -0.8]) },
  { name: '잎설유', category: 'line', price: 900, photo: photo(spireaImg, [75, 16.01, 82, 144], [119.59, 102.51, -12.84, -0.87]) },
  { name: '스틸그라스', category: 'line', price: 400, photo: photo(steelGrassImg, [90.56, 16.15, 49.68, 143.82], [495.87, 114.18, -81.92, -2.54]) },
  // 베어그라스는 디자인에서 스틸그라스와 같은 원본 이미지를 다른 영역으로 잘라 씀
  { name: '베어그라스', category: 'line', price: 400, photo: photo(steelGrassImg, [57.74, 16.03, 108.78, 143.98], [231.34, 116.51, -116.93, -10.27]) },
  { name: '아레카팜', category: 'line', price: 1500, photo: photo(arecaImg, [63.36, 16.01, 94.94, 143.99], [103.11, 101.97, -2.03, -0.56]) },
  { name: '페스큐', category: 'line', price: 600, photo: photo(fescueImg, [49.72, 16.01, 120.29, 144], [105.31, 117.29, -3.56, -9.9]) },
  // Figma 2849:35850
  { name: '아이비', category: 'line', price: 1000, lowIrritant: false, photo: photo(ivyImg, [87, 16, 59, 137], [174.26, 100, -44.49, 0]) },
  { name: '사이프러스', category: 'line', price: 1500, lowIrritant: false, scent: 'high', photo: photo(cypressImg, [81.96, 16, 72, 144], [142.33, 106.75, -32.35, -3.96]) },
  { name: '블루아이스', category: 'line', price: 1500, lowIrritant: false, scent: 'high', photo: photo(blueIceImg, [83.01, 16, 78, 144], [123.77, 101.12, -12.3, -0.11]) },

  // Texture (Figma 2268:19399)
  {
    name: '세로그라피카',
    category: 'texture',
    price: 25000,
    photo: photo(xerographicaImg, [57.2, 16.05, 108.19, 119.54], [100.18, 113.29, -0.09, -6.33], [59, 96, 83, 43, 10, 16.807]),
  },
  { name: '이오난사', category: 'texture', price: 1000, photo: photo(ionanthaImg, [67, 16, 86, 132], [107.84, 105.77, -5.88, -3.21]) },
  { name: '카풋메두사', category: 'texture', price: 5000, photo: photo(caputMedusaeImg, [68, 16, 86, 132], [104.05, 102.21, -2.03, -1.33]) },
  { name: '휴스톤', category: 'texture', price: 9000, photo: photo(houstonImg, [48, 23, 117, 112], [103.81, 109, -1.9, 0]) },
  { name: '필리카', category: 'texture', price: 900, photo: photo(phylicaImg, [87, 13, 52, 147], [283.55, 133.64, -99.22, -3.88]) },
  { name: '나선골풀', category: 'texture', price: 450, photo: photo(juncusImg, [95.3, 16.05, 33.66, 143.95], [289.52, 101.53, -109.28, 0]) },
  { name: '페페로미아', category: 'texture', price: 1300, photo: photo(peperomiaImg, [87.74, 16.13, 63.53, 143.87], [184.87, 119.15, -41.16, -8.89]) },
  { name: '램스이어', category: 'texture', price: 1000, photo: photo(lambsEarImg, [70.7, 16.14, 72.22, 143.87], [147.77, 111.27, -20.22, -5.38]) },
  { name: '보스턴펀', category: 'texture', price: 800, photo: photo(bostonFernImg, [92.83, 16.01, 33.18, 143.99], [346.35, 106.41, -120.5, -3.06]) },
  // Figma 2849:33640
  { name: '블랙잭', category: 'texture', price: 1300, lowIrritant: false, scent: 'high', photo: photo(blackjackImg, [85, 16, 53, 144], [234.03, 107.63, -64.65, -3.41]) },
  { name: '세네시오', category: 'texture', price: 1300, lowIrritant: false, photo: photo(senecioImg, [90, 9, 52, 151], [215.38, 111.26, -59.62, -3.97]) },
  { name: '플루모사', category: 'texture', price: 1000, lowIrritant: false, photo: photo(plumosaImg, [50, 13, 112, 147], [100, 101.59, 0, -0.11]) },
  { name: '더스티밀러', category: 'texture', price: 1000, lowIrritant: false, photo: photo(dustyMillerImg, [82, 16, 79, 144], [123.47, 102.54, -23.47, -0.56]) },
  { name: '냉이초', category: 'texture', price: 900, lowIrritant: false, photo: photo(naengichoImg, [86, 15, 58, 145], [169.33, 101.65, -45.33, -0.13]) },
  { name: '렉스 베고니아', category: 'texture', price: 2000, lowIrritant: false, photo: photo(rexBegoniaImg, [77, 27, 82, 133], [132.14, 108.03, -16.07, -3.28]) },
]

// 유지력 순 정렬 순서 (Figma 부케 구성 화면 그대로 — 조건에 따라 카드 배치가 조금씩 다름)
// all: 무필터 / lowIrritant: 저자극(저자극+저향도 같음) / lowScent: 저향만
const LASTING_ORDER = {
  all: [
    '연밥', '루스커스', '엽란', '팔손이', '드라세나', '파인애플', '피토스포룸', '몬스테라', '카멜리아', '카리사', '아스플레니움', '연잎', '자비타', '칼라디움',
    '살랄', '유칼립투스', '폴리안 유칼립투스', '클루시아', '셀렘', '트리펀', '미모사', '머틀', '마란타', '부바르디아', '호스타', '오레가노', '레몬버베나', '콜레우스', '홍가시', '하이포에스테스', '필레아 카디에레이',
    '아이비', '수염틸란드시아', '이탈리안 루스커스', '운룡버들', '대나무', '사이프러스', '블루아이스', '속새', '시페루스', '잎설유', '스틸그라스', '베어그라스', '아레카팜', '페스큐',
    '세로그라피카', '이오난사', '카풋메두사', '휴스톤', '블랙잭', '세네시오', '필리카', '플루모사', '나선골풀', '더스티밀러', '페페로미아', '램스이어', '냉이초', '렉스 베고니아', '보스턴펀',
  ],
  lowIrritant: [
    '연밥', '루스커스', '엽란', '팔손이', '카멜리아', '피토스포룸', '아스플레니움', '연잎',
    '살랄', '트리펀', '미모사', '마란타', '부바르디아', '호스타', '홍가시', '하이포에스테스', '필레아 카디에레이',
    '수염틸란드시아', '이탈리안 루스커스', '운룡버들', '대나무', '시페루스', '잎설유', '속새', '스틸그라스', '베어그라스', '아레카팜', '페스큐',
    '세로그라피카', '이오난사', '카풋메두사', '휴스톤', '필리카', '나선골풀', '페페로미아', '램스이어', '보스턴펀',
  ],
  lowScent: [
    '연밥', '루스커스', '엽란', '팔손이', '드라세나', '파인애플', '피토스포룸', '몬스테라', '카멜리아', '카리사', '아스플레니움', '연잎', '자비타', '칼라디움',
    '살랄', '클루시아', '셀렘', '트리펀', '미모사', '마란타', '부바르디아', '호스타', '콜레우스', '홍가시', '하이포에스테스', '필레아 카디에레이',
    '아이비', '수염틸란드시아', '이탈리안 루스커스', '운룡버들', '대나무', '시페루스', '잎설유', '속새', '스틸그라스', '베어그라스', '아레카팜', '페스큐',
    '세로그라피카', '이오난사', '카풋메두사', '휴스톤', '세네시오', '필리카', '플루모사', '나선골풀', '더스티밀러', '페페로미아', '램스이어', '냉이초', '렉스 베고니아', '보스턴펀',
  ],
}

// 유지력 순위 (작을수록 오래감) — 대체 소재 추천에서 '유지력 비슷'을 가릴 때 씀
export const lastingRank = (name) => LASTING_ORDER.all.indexOf(name)

const lastingOrder = (profile) =>
  profile.lowIrritant ? LASTING_ORDER.lowIrritant : profile.lowScent ? LASTING_ORDER.lowScent : LASTING_ORDER.all

// 띄어쓰기·대소문자 차이는 무시하고 비교
const normalize = (text) => text.replace(/\s+/g, '').toLowerCase()

// 사용자가 입력한 제외 식물에 해당하는지.
// 이름이 같거나, 입력어(2글자 이상)가 식물 이름에 포함되면 제외 (예: '루스커스' → '이탈리안 루스커스'도 제외)
export function isExcludedPlant(plantName, excludedPlants) {
  const name = normalize(plantName)
  return excludedPlants.some((entry) => {
    const term = normalize(entry)
    if (!term) return false
    return name === term || (term.length >= 2 && name.includes(term))
  })
}

// 부케 구성에 보여줄 식물: 제외 식물을 뺀 목록
export function getAvailablePlants(excludedPlants, category) {
  return PLANTS.filter(
    (plant) => (!category || plant.category === category) && !isExcludedPlant(plant.name, excludedPlants),
  )
}

// 부케 구성에 보여줄 추천 목록: Edit Conditions의 모든 조건을 반영
// - 제외 식물: 목록에서 뺌
// - 저자극 / 향 노출 제어: 식물 데이터의 lowIrritant(false) / scent('high')로 걸러냄
// - 추천 기준: 유지력 → Figma 화면 순서(LASTING_ORDER) / 예산 → 가격 낮은 순 (같은 가격은 유지력 순)
export function getRecommendedPlants(profile, category) {
  let list = getAvailablePlants(profile.excludedPlants, category)
  if (profile.lowIrritant) list = list.filter((plant) => plant.lowIrritant !== false)
  if (profile.lowScent) list = list.filter((plant) => plant.scent !== 'high')

  const order = lastingOrder(profile)
  const rank = (plant) => order.indexOf(plant.name)
  list = [...list].sort((a, b) => rank(a) - rank(b))
  if (profile.criteria[0] === '예산') list.sort((a, b) => a.price - b.price)
  return list
}

// 부케 구성 화면에서 사용: 현재 프로필 조건이 반영된 목록 (조건이 바뀌면 자동 갱신)
export function useRecommendedPlants(category) {
  return getRecommendedPlants(useProfile(), category)
}
