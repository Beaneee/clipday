import { Platform } from "react-native";

/**
 * DESIGN.md(토스 디자인 시스템 핸드오프)에서 뽑은 디자인 토큰.
 *
 * 문서의 색은 OKLCH로 적혀 있는데 React Native가 읽지 못해 sRGB hex로 변환해 두었다.
 * 값을 고칠 일이 있으면 DESIGN.md의 OKLCH를 원본으로 삼는다.
 */

/** 원시 팔레트. 새 role을 만들 때만 직접 참조하고, 평소에는 아래 semantic을 쓴다. */
const palette = {
  blue500: "#2887EE",
  blue600: "#1065CC",
  blue700: "#0D56BC",
  blue50: "#EAF5FF",

  // 순수 무채색이 아니라 살짝 차가운 navy 기운이 도는 중성색
  grey900: "#141F2C",
  grey800: "#2D3A48",
  grey700: "#4B5765",
  grey600: "#6A7480",
  grey500: "#87919C",
  grey400: "#A7B0B9",
  grey300: "#C5CBD2",
  grey200: "#DEE3E7",
  grey100: "#EEF1F4",
  grey50: "#F6F8FA",
  white: "#FFFFFF",

  red500: "#F03848",
  green500: "#007738",
  orange500: "#FF8800",
  navy900: "#010A25",
} as const;

/** navy-900 기반 알파 토큰. */
const alpha = {
  fgTertiary: "rgba(1, 10, 37, 0.58)",
  fgQuaternary: "rgba(1, 10, 37, 0.28)",
  lineSubtle: "rgba(0, 0, 0, 0.08)",
  overlayScrim: "rgba(0, 0, 0, 0.56)",
  overlayPress: "rgba(0, 0, 0, 0.26)",
} as const;

export const colors = {
  // Fill (배경·표면)
  fillBrand: palette.blue500,
  fillBrandPressed: palette.blue600,
  fillBrandWeak: palette.blue50,
  fillPrimary: palette.grey900,
  fillSecondary: palette.grey100,
  fillWeak: palette.grey50,
  fillDanger: palette.red500,
  fillSuccess: palette.green500,
  fillWarning: palette.orange500,

  // Background
  bgPrimary: palette.white,
  bgSecondary: palette.grey100,
  bgElevated: palette.white,

  // Text
  textPrimary: palette.grey900,
  textSecondary: palette.grey700,
  textTertiary: alpha.fgTertiary,
  textPlaceholder: alpha.fgQuaternary,
  textDisabled: palette.grey400,
  textAlt: palette.white,
  textBrand: palette.blue500,
  textDanger: palette.red500,

  // Line
  lineDefault: palette.grey200,
  lineSubtle: alpha.lineSubtle,
  lineStrong: palette.grey400,
  lineBrand: palette.blue500,

  // Overlay & state
  overlayScrim: alpha.overlayScrim,
  overlayPress: alpha.overlayPress,
  disabledOpacity: 0.3,
} as const;

/** 4px 베이스 사다리. 화면 바깥 여백 24, 행 간격 16, 밀접 요소 8이 기본이다. */
export const space = {
  s1: 4,
  s2: 8,
  s3: 12,
  s4: 16,
  s5: 20,
  s6: 24,
  s7: 28,
  s8: 32,
  s10: 40,
  s12: 48,
  s16: 64,
  s20: 80,
} as const;

/** 라운드 사다리. 버튼은 사이즈와 짝을 이룬다 — XL 16 / L 14 / M 12 / S 10. */
export const radius = {
  xs: 4,
  s: 8,
  m: 12,
  l: 14,
  xl: 16,
  xxl: 20,
  xxxl: 24,
  xxxxl: 32,
  full: 999,
} as const;

/**
 * 타입 램프. 문서의 line-height는 배수라서 px로 환산해 두었다
 * (React Native는 배수를 받지 않는다). tracking은 em을 px로 환산했다.
 */
export const type = {
  h1: { fontSize: 28, lineHeight: 36, letterSpacing: -0.56, fontWeight: "700" },
  h2: { fontSize: 24, lineHeight: 31, letterSpacing: -0.48, fontWeight: "700" },
  h3: { fontSize: 22, lineHeight: 29, letterSpacing: -0.33, fontWeight: "700" },
  h4: { fontSize: 20, lineHeight: 27, letterSpacing: -0.3, fontWeight: "700" },
  title1: { fontSize: 18, lineHeight: 26, letterSpacing: -0.18, fontWeight: "600" },
  title2: { fontSize: 17, lineHeight: 25, letterSpacing: -0.17, fontWeight: "600" },
  body1: { fontSize: 17, lineHeight: 26, letterSpacing: -0.085, fontWeight: "400" },
  body2: { fontSize: 15, lineHeight: 23, letterSpacing: -0.075, fontWeight: "400" },
  body3: { fontSize: 13, lineHeight: 20, letterSpacing: 0, fontWeight: "400" },
  labelL: { fontSize: 17, lineHeight: 21, letterSpacing: -0.085, fontWeight: "700" },
  labelM: { fontSize: 15, lineHeight: 19, letterSpacing: -0.075, fontWeight: "600" },
  labelS: { fontSize: 13, lineHeight: 16, letterSpacing: 0, fontWeight: "600" },
  caption: { fontSize: 12, lineHeight: 17, letterSpacing: 0, fontWeight: "500" },
  captionS: { fontSize: 11, lineHeight: 15, letterSpacing: 0, fontWeight: "500" },
} as const;

/**
 * 그림자. 평면이 기본이고 떠 있는 표면에서만 쓴다.
 * RN은 그림자 두 겹을 못 받으므로 각 토큰의 바깥 겹만 옮겼다.
 */
export const shadow = {
  // menu
  s1: {
    shadowColor: palette.navy900,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  // tooltip
  s2: {
    shadowColor: palette.navy900,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  // dialog
  s3: {
    shadowColor: palette.navy900,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.1,
    shadowRadius: 32,
    elevation: 8,
  },
  // bottom sheet — 위로 드리운다
  sheet: {
    shadowColor: palette.navy900,
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 8,
  },
} as const;

/** 모션. 바운스·오버슈트 없이 이 안에서만 움직인다. */
export const motion = {
  durFast: 120,
  durBase: 200,
  durSlow: 320,
} as const;

/** 컴포넌트 치수 — 문서에 명시된 값만 옮겼다. */
export const size = {
  buttonXL: 56,
  buttonL: 48,
  buttonM: 40,
  buttonS: 32,
  textField: 48,
  chip: 34,
  topAppBar: 56,
  /** 모든 인터랙티브 표면이 지켜야 하는 최소 hit area. */
  minTouch: 44,
} as const;

/**
 * 웹에서 입력에 붙는 브라우저 기본 outline을 없앤다.
 * focus 표시는 토큰 보더로 직접 그리므로 검은 outline이 겹치면 안 된다.
 */
export const noWebOutline = Platform.select({
  web: { outlineStyle: "none" },
  default: {},
}) as object;

export { palette };
