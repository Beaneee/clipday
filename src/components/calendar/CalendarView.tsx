import { Image } from "expo-image";
import { memo, useEffect } from "react";
import { Dimensions, Pressable, StyleSheet, Text, View } from "react-native";
import { Calendar, LocaleConfig, type DateData } from "react-native-calendars";
import { useClipStore } from "@/store/clip.store";
import { useHolidayStore } from "@/store/holiday.store";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CELL_SIZE = SCREEN_WIDTH / 7;
const CELL_HEIGHT = CELL_SIZE * 1.3;

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
  onDayPress: (dateKey: string) => void;
};

const DayCell = memo(function DayCell({ date, state, onDayPress }: DayProps) {
  const key = date?.dateString;
  const year = key ? Number(key.slice(0, 4)) : undefined;
  const clip = useClipStore((s) => (key ? s.clips[key]?.[0] : undefined));
  const holidayName = useHolidayStore((s) =>
    key && year ? s.byYear[year]?.[key] : undefined
  );

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
      {clip && (
        <Image
          source={{ uri: clip.photoUri }}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
        />
      )}
      {clip && <View style={styles.overlay} />}

      {/* 날짜 숫자 */}
      <View style={[styles.dayBadge, isToday && styles.todayBadge]}>
        <Text
          style={[
            styles.dayText,
            isRed && !clip && styles.redText,
            isBlue && !clip && styles.blueText,
            clip && styles.dayTextOnPhoto,
            isToday && styles.todayText,
          ]}
        >
          {date.day}
        </Text>
      </View>

      {/* 하단: 메모 미리보기(우선) 또는 공휴일명 */}
      {clip?.memo ? (
        <Text style={styles.memoPreview} numberOfLines={1}>
          {clip.memo}
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
        <DayCell date={date} state={state} onDayPress={onDayPress} />
      )}
      theme={{
        calendarBackground: "#fff",
        textSectionTitleColor: "#aaa",
        textDayHeaderFontSize: 11,
        arrowColor: "#333",
        monthTextColor: "#111",
        textMonthFontSize: 18,
        textMonthFontWeight: "600",
        // @ts-expect-error - 내부 스타일시트 오버라이드
        "stylesheet.calendar.main": {
          container: { padding: 0, backgroundColor: "#fff" },
          week: { marginVertical: 0, flexDirection: "row", justifyContent: "space-around" },
        },
      }}
    />
  );
}

const styles = StyleSheet.create({
  cell: {
    width: CELL_SIZE,
    height: CELL_HEIGHT,
    overflow: "hidden",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#e8e8e8",
    borderRightWidth: StyleSheet.hairlineWidth,
    borderRightColor: "#e8e8e8",
    justifyContent: "flex-start",
    alignItems: "flex-start",
    padding: 5,
  },
  pressed: { opacity: 0.85 },

  overlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "rgba(0,0,0,0.18)",
  },

  dayBadge: {
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 3,
  },
  todayBadge: { backgroundColor: "#111" },
  dayText: { fontSize: 12, color: "#222", fontWeight: "500" },
  redText: { color: "#e74c3c" },
  blueText: { color: "#3b6fd4" },
  dayTextOnPhoto: { color: "#fff", fontWeight: "600" },
  todayText: { color: "#fff", fontWeight: "700" },

  memoPreview: {
    position: "absolute",
    bottom: 4,
    left: 4,
    right: 4,
    fontSize: 9,
    color: "#fff",
    fontWeight: "500",
  },
  holidayLabel: {
    position: "absolute",
    bottom: 4,
    left: 4,
    right: 4,
    fontSize: 9,
    color: "#e74c3c",
    fontWeight: "500",
  },
});
