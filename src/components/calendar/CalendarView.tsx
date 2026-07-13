import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useMemo, useState } from "react";
import { Dimensions, Pressable, StyleSheet, Text, View } from "react-native";
import { useClipStore } from "@/store/clip.store";

const DAY_LABELS = ["월", "화", "수", "목", "금", "토", "일"];
const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CELL_SIZE = Math.floor(SCREEN_WIDTH / 7);
const CELL_HEIGHT = CELL_SIZE * 1.3;

type Props = {
  onDayPress: (dateKey: string) => void;
};

export function CalendarView({ onDayPress }: Props) {
  const clipsMap = useClipStore((s) => s.clips);

  const [cursor, setCursor] = useState(() => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() };
  });

  const { year, month } = cursor;

  const today = useMemo(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  }, []);

  const cells = useMemo(() => {
    const firstDow = new Date(year, month, 1).getDay();
    const offset = (firstDow + 6) % 7;
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const arr: (number | null)[] = [
      ...Array(offset).fill(null),
      ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
    ];
    while (arr.length % 7 !== 0) arr.push(null);
    return arr;
  }, [year, month]);

  const toKey = (day: number) =>
    `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

  const prevMonth = () =>
    setCursor(({ year, month }) =>
      month === 0 ? { year: year - 1, month: 11 } : { year, month: month - 1 }
    );

  const nextMonth = () =>
    setCursor(({ year, month }) =>
      month === 11 ? { year: year + 1, month: 0 } : { year, month: month + 1 }
    );

  return (
    <View style={styles.container}>
      {/* 헤더 */}
      <View style={styles.header}>
        <Pressable onPress={prevMonth} hitSlop={16} style={styles.arrow}>
          <Ionicons name="chevron-back" size={22} color="#333" />
        </Pressable>
        <Text style={styles.monthTitle}>{year}년 {month + 1}월</Text>
        <Pressable onPress={nextMonth} hitSlop={16} style={styles.arrow}>
          <Ionicons name="chevron-forward" size={22} color="#333" />
        </Pressable>
      </View>

      {/* 요일 라벨 */}
      <View style={styles.labelRow}>
        {DAY_LABELS.map((d, i) => (
          <View key={d} style={styles.labelCell}>
            <Text style={[styles.labelText, i === 6 && styles.sundayLabel]}>{d}</Text>
          </View>
        ))}
      </View>

      {/* 날짜 그리드 */}
      {Array.from({ length: cells.length / 7 }, (_, row) => (
        <View key={row} style={styles.row}>
          {cells.slice(row * 7, row * 7 + 7).map((day, col) => {
            if (!day) {
              return <View key={col} style={[styles.cell, col < 6 && styles.borderRight]} />;
            }

            const key = toKey(day);
            const isToday = key === today;
            const isSun = col === 6;
            const clip = clipsMap[key]?.[0];

            return (
              <Pressable
                key={col}
                style={({ pressed }) => [
                  styles.cell,
                  col < 6 && styles.borderRight,
                  pressed && styles.pressed,
                ]}
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

                {/* 사진 위 어두운 오버레이 */}
                {clip && <View style={styles.overlay} />}

                {/* 날짜 숫자 */}
                <View style={[styles.dayBadge, isToday && styles.todayBadge]}>
                  <Text
                    style={[
                      styles.dayText,
                      isSun && !clip && styles.sundayText,
                      clip && styles.dayTextOnPhoto,
                      isToday && styles.todayText,
                    ]}
                  >
                    {day}
                  </Text>
                </View>

                {/* 메모 미리보기 */}
                {clip?.memo ? (
                  <Text style={styles.memoPreview} numberOfLines={1}>
                    {clip.memo}
                  </Text>
                ) : null}
              </Pressable>
            );
          })}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: "#fff" },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  arrow: { padding: 4 },
  monthTitle: { fontSize: 18, fontWeight: "600", color: "#111" },

  labelRow: { flexDirection: "row" },
  labelCell: { width: CELL_SIZE, alignItems: "center", paddingVertical: 6 },
  labelText: { fontSize: 11, color: "#aaa" },
  sundayLabel: { color: "#e74c3c" },

  row: { flexDirection: "row" },

  cell: {
    width: CELL_SIZE,
    height: CELL_HEIGHT,
    overflow: "hidden",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#e8e8e8",
    justifyContent: "flex-start",
    alignItems: "flex-start",
    padding: 5,
  },
  borderRight: {
    borderRightWidth: StyleSheet.hairlineWidth,
    borderRightColor: "#e8e8e8",
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
  todayBadge: {
    backgroundColor: "#111",
  },
  dayText: { fontSize: 12, color: "#222", fontWeight: "500" },
  sundayText: { color: "#e74c3c" },
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
});
