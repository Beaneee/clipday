import { Ionicons } from "@expo/vector-icons";
import { useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useClipStore } from "@/store/clip.store";

const DAY_LABELS = ["일", "월", "화", "수", "목", "금", "토"];

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

  const days = useMemo(() => {
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    return { firstDay, daysInMonth };
  }, [year, month]);

  const today = useMemo(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  }, []);

  const toKey = (day: number) =>
    `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

  const prev = () =>
    setCursor(({ year, month }) =>
      month === 0 ? { year: year - 1, month: 11 } : { year, month: month - 1 }
    );

  const next = () =>
    setCursor(({ year, month }) =>
      month === 11 ? { year: year + 1, month: 0 } : { year, month: month + 1 }
    );

  const cells: (number | null)[] = [
    ...Array(days.firstDay).fill(null),
    ...Array.from({ length: days.daysInMonth }, (_, i) => i + 1),
  ];

  // pad to complete last row
  while (cells.length % 7 !== 0) cells.push(null);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={prev} hitSlop={12}>
          <Ionicons name="chevron-back" size={22} color="#000" />
        </Pressable>
        <Text style={styles.title}>
          {year}년 {month + 1}월
        </Text>
        <Pressable onPress={next} hitSlop={12}>
          <Ionicons name="chevron-forward" size={22} color="#000" />
        </Pressable>
      </View>

      {/* Day labels */}
      <View style={styles.row}>
        {DAY_LABELS.map((d) => (
          <Text key={d} style={[styles.label, d === "일" && styles.sun, d === "토" && styles.sat]}>
            {d}
          </Text>
        ))}
      </View>

      {/* Grid */}
      {Array.from({ length: cells.length / 7 }, (_, row) => (
        <View key={row} style={styles.row}>
          {cells.slice(row * 7, row * 7 + 7).map((day, col) => {
            if (!day) return <View key={col} style={styles.cell} />;
            const key = toKey(day);
            const hasClip = (clips[key]?.length ?? 0) > 0;
            const isToday = key === today;
            const isSun = col === 0;
            const isSat = col === 6;

            return (
              <Pressable
                key={col}
                style={styles.cell}
                onPress={() => onDayPress(key)}
              >
                <View style={[styles.dayCircle, isToday && styles.todayCircle]}>
                  <Text
                    style={[
                      styles.dayText,
                      isSun && styles.sun,
                      isSat && styles.sat,
                      isToday && styles.todayText,
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
  container: { backgroundColor: "#fff", paddingHorizontal: 16, paddingBottom: 8 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 16,
  },
  title: { fontSize: 18, fontWeight: "600" },
  row: { flexDirection: "row" },
  label: {
    flex: 1,
    textAlign: "center",
    fontSize: 12,
    color: "#999",
    paddingVertical: 6,
  },
  cell: { flex: 1, alignItems: "center", paddingVertical: 4 },
  dayCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
  },
  todayCircle: { backgroundColor: "#000" },
  dayText: { fontSize: 14, color: "#1a1a1a" },
  todayText: { color: "#fff", fontWeight: "600" },
  sun: { color: "#e74c3c" },
  sat: { color: "#3498db" },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: "#000",
    marginTop: 2,
  },
});
