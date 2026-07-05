import { useMemo, useState } from "react";
import { Dimensions, Pressable, StyleSheet, Text, View } from "react-native";
import { useClipStore } from "@/store/clip.store";

// 월요일 시작
const DAY_LABELS = ["월", "화", "수", "목", "금", "토", "일"];

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CELL_WIDTH = SCREEN_WIDTH / 7;
const CELL_HEIGHT = 80;

type Props = {
  onDayPress: (dateKey: string) => void;
};

export function CalendarView({ onDayPress }: Props) {
  const clips = useClipStore((s) => s.clips);

  const [cursor, setCursor] = useState(() => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() };
  });

  const { year, month } = cursor;

  const today = useMemo(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  }, []);

  // 월요일 시작 기준 firstDay 계산 (0=월 ... 6=일)
  const cells = useMemo(() => {
    const firstDow = new Date(year, month, 1).getDay(); // 0=일
    const offset = (firstDow + 6) % 7; // 월요일 기준 offset
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

  const monthLabel = `${year}년 ${month + 1}월`;

  return (
    <View style={styles.container}>
      {/* Month header */}
      <Pressable
        onPress={() =>
          setCursor(({ year, month }) =>
            month === 0 ? { year: year - 1, month: 11 } : { year, month: month - 1 }
          )
        }
        style={styles.headerSide}
      />
      <View style={styles.headerWrap}>
        <Pressable
          onPress={() =>
            setCursor(({ year, month }) =>
              month === 0 ? { year: year - 1, month: 11 } : { year, month: month - 1 }
            )
          }
          hitSlop={16}
        />
        <Text style={styles.monthTitle}>{monthLabel}</Text>
        <Pressable
          onPress={() =>
            setCursor(({ year, month }) =>
              month === 11 ? { year: year + 1, month: 0 } : { year, month: month + 1 }
            )
          }
          hitSlop={16}
        />
      </View>

      {/* Day labels */}
      <View style={styles.row}>
        {DAY_LABELS.map((d) => (
          <View key={d} style={styles.labelCell}>
            <Text style={styles.labelText}>{d}</Text>
          </View>
        ))}
      </View>

      {/* Divider */}
      <View style={styles.divider} />

      {/* Grid */}
      {Array.from({ length: cells.length / 7 }, (_, row) => (
        <View key={row} style={styles.row}>
          {cells.slice(row * 7, row * 7 + 7).map((day, col) => {
            if (!day)
              return (
                <View key={col} style={[styles.cell, col < 6 && styles.cellBorderRight]} />
              );

            const key = toKey(day);
            const isToday = key === today;
            const hasClip = (clips[key]?.length ?? 0) > 0;
            const isSun = col === 6;

            return (
              <Pressable
                key={col}
                style={({ pressed }) => [
                  styles.cell,
                  col < 6 && styles.cellBorderRight,
                  pressed && styles.cellPressed,
                ]}
                onPress={() => onDayPress(key)}
              >
                <View style={[styles.dayCircle, isToday && styles.todayCircle]}>
                  <Text
                    style={[
                      styles.dayText,
                      isSun && styles.sundayText,
                      isToday && styles.todayDayText,
                    ]}
                  >
                    {day}
                  </Text>
                </View>
                {hasClip && <View style={styles.dot} />}
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

  headerWrap: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 20,
  },
  headerSide: { position: "absolute" },
  monthTitle: {
    fontSize: 17,
    fontWeight: "400",
    color: "#555",
    letterSpacing: 0.3,
  },

  row: { flexDirection: "row" },

  labelCell: {
    width: CELL_WIDTH,
    alignItems: "center",
    paddingVertical: 8,
  },
  labelText: { fontSize: 13, color: "#aaa" },

  divider: { height: StyleSheet.hairlineWidth, backgroundColor: "#e0e0e0" },

  cell: {
    width: CELL_WIDTH,
    height: CELL_HEIGHT,
    alignItems: "center",
    paddingTop: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#e0e0e0",
  },
  cellBorderRight: {
    borderRightWidth: StyleSheet.hairlineWidth,
    borderRightColor: "#e0e0e0",
  },
  cellPressed: { backgroundColor: "#f5f5f5" },

  dayCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
  },
  todayCircle: {
    borderWidth: 1.5,
    borderColor: "#222",
  },
  dayText: { fontSize: 14, color: "#222" },
  sundayText: { color: "#e74c3c" },
  todayDayText: { fontWeight: "600" },

  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#555",
    marginTop: 4,
  },
});
