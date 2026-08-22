import { Image } from "expo-image";
import { memo, useEffect } from "react";
import { Dimensions, Pressable, StyleSheet, Text, View } from "react-native";
import { Calendar, LocaleConfig, type DateData } from "react-native-calendars";
import { toAbsoluteImageUrl } from "@/api/client";
import { useRecordsByDate } from "@/hooks/useRecords";
import { useHolidayStore } from "@/store/holiday.store";
import { useTabStore } from "@/store/tab.store";
import { colors, radius, space, type } from "@/theme/tokens";
import type { DailyRecord } from "@/types/record";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CELL_SIZE = SCREEN_WIDTH / 7;
const CELL_HEIGHT = CELL_SIZE * 1.18;

// 한국어 로케일
LocaleConfig.locales.ko = {
  monthNames: [
    "1월", "2월", "3월", "4월", "5월", "6월",
    "7월", "8월", "9월", "10월", "11월", "12월",
  ],
  monthNamesShort: [
    "1월", "2월", "3월", "4월", "5월", "6월",
    "7월", "8월", "9월", "10월", "11월", "12월",
  ],
  dayNames: ["일요일", "월요일", "화요일", "수요일", "목요일", "금요일", "토요일"],
  dayNamesShort: ["일", "월", "화", "수", "목", "금", "토"],
  today: "오늘",
};
LocaleConfig.defaultLocale = "ko";

type Props = {
  onDayPress: (dateKey: string) => void;
};

type DayProps = {
  date?: DateData;
  state?: string;
  record?: DailyRecord;
  onDayPress: (dateKey: string) => void;
};

const DayCell = memo(function DayCell({ date, state, record, onDayPress }: DayProps) {
  const key = date?.dateString;
  const year = key ? Number(key.slice(0, 4)) : undefined;
  const holidayName = useHolidayStore((s) =>
    key && year ? s.byYear[year]?.[key] : undefined
  );
  const photoUrl = toAbsoluteImageUrl(record?.imageUrl);

  if (!key || !date) return <View style={styles.cell} />;

  const isToday = state === "today";
  const dow = new Date(`${key}T00:00:00`).getDay(); // 0=일, 6=토
  const isRed = dow === 0 || !!holidayName; // 일요일 · 공휴일
  const isBlue = dow === 6; // 토요일

  return (
    <Pressable
      style={({ pressed }) => [styles.cell, pressed && styles.pressed]}
      onPress={() => onDayPress(key)}
    >
      {/* 사진 배경 */}
      {photoUrl && (
        <Image
          source={{ uri: photoUrl }}
          style={[StyleSheet.absoluteFill, styles.photo]}
          contentFit="cover"
        />
      )}
      {photoUrl && <View style={styles.overlay} />}

      {/* 날짜 숫자 */}
      <View style={[styles.dayBadge, isToday && styles.todayBadge]}>
        <Text
          style={[
            styles.dayText,
            isRed && !photoUrl && styles.redText,
            isBlue && !photoUrl && styles.blueText,
            photoUrl && styles.dayTextOnPhoto,
            isToday && styles.todayText,
          ]}
        >
          {date.day}
        </Text>
      </View>

      {/* 하단: 메모 미리보기(우선) 또는 공휴일명 */}
      {record?.memo ? (
        <Text style={[styles.memoPreview, !photoUrl && styles.memoPreviewNoPhoto]} numberOfLines={1}>
          {record.memo}
        </Text>
      ) : holidayName ? (
        <Text style={styles.holidayLabel} numberOfLines={1}>
          {holidayName}
        </Text>
      ) : null}
    </Pressable>
  );
});

export function CalendarView({ onDayPress }: Props) {
  const ensureYear = useHolidayStore((s) => s.ensureYear);
  const activeTabId = useTabStore((s) => s.activeTabId);
  const { byDate } = useRecordsByDate(activeTabId);

  // 처음 보이는 달의 연도 로드
  useEffect(() => {
    ensureYear(new Date().getFullYear());
  }, [ensureYear]);

  return (
    <Calendar
      firstDay={0}
      hideExtraDays
      monthFormat="yyyy년 M월"
      enableSwipeMonths
      onMonthChange={(m) => ensureYear(m.year)}
      dayComponent={({ date, state }) => (
        <DayCell
          date={date}
          state={state}
          record={date ? byDate[date.dateString] : undefined}
          onDayPress={onDayPress}
        />
      )}
      theme={{
        calendarBackground: colors.bgPrimary,
        textSectionTitleColor: colors.textTertiary,
        textDayHeaderFontSize: type.captionS.fontSize,
        arrowColor: colors.textSecondary,
        monthTextColor: colors.textPrimary,
        textMonthFontSize: type.h4.fontSize,
        textMonthFontWeight: "700",
        // @ts-expect-error - 내부 스타일시트 오버라이드
        "stylesheet.calendar.main": {
          container: { padding: 0, backgroundColor: colors.bgPrimary },
          week: { marginVertical: 0, flexDirection: "row", justifyContent: "space-around" },
        },
      }}
    />
  );
}

const styles = StyleSheet.create({
  // 격자선을 긋지 않는다 — 평면 캔버스 위에 사진 카드만 얹는다
  cell: {
    width: CELL_SIZE,
    height: CELL_HEIGHT,
    justifyContent: "flex-start",
    alignItems: "flex-start",
    padding: space.s1 - 1,
  },
  // 눌림은 그림자가 아니라 오버레이로 표현한다
  pressed: { opacity: 0.92 },

  photo: {
    margin: space.s1 - 1,
    borderRadius: radius.m,
  },
  // 사진 위 글자가 읽히도록 얹는 최소한의 톤
  overlay: {
    ...StyleSheet.absoluteFill,
    margin: space.s1 - 1,
    borderRadius: radius.m,
    backgroundColor: "rgba(1, 10, 37, 0.28)",
  },

  dayBadge: {
    minWidth: 24,
    height: 24,
    borderRadius: radius.full,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: space.s1,
    marginLeft: space.s1 - 2,
    marginTop: space.s1 - 2,
  },
  todayBadge: { backgroundColor: colors.fillPrimary },
  dayText: {
    fontSize: type.caption.fontSize,
    lineHeight: type.caption.lineHeight,
    letterSpacing: type.caption.letterSpacing,
    fontWeight: "500",
    color: colors.textSecondary,
  },
  redText: { color: colors.textDanger },
  blueText: { color: colors.textBrand },
  dayTextOnPhoto: { color: colors.textAlt, fontWeight: "700" },
  todayText: { color: colors.textAlt, fontWeight: "700" },

  memoPreview: {
    position: "absolute",
    bottom: space.s1 + 2,
    left: space.s1 + 2,
    right: space.s1 + 2,
    fontSize: type.captionS.fontSize - 1,
    lineHeight: type.captionS.lineHeight,
    color: colors.textAlt,
    fontWeight: "600",
  },
  memoPreviewNoPhoto: { color: colors.textTertiary, fontWeight: "500" },
  holidayLabel: {
    marginLeft: space.s1 - 2,
    marginTop: space.s1 / 2,
    maxWidth: CELL_SIZE - space.s2,
    fontSize: type.captionS.fontSize - 1,
    lineHeight: type.captionS.lineHeight,
    color: colors.textDanger,
    fontWeight: "500",
  },
});
