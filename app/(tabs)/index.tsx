import { useCallback, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { CalendarView } from "@/components/calendar/CalendarView";
import { ClipModal } from "@/components/calendar/ClipModal";
import { TabBar } from "@/components/calendar/TabBar";
import { useRecords } from "@/hooks/useRecords";
import { useTabStore } from "@/store/tab.store";

export default function HomeScreen() {
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const activeTabId = useTabStore((s) => s.activeTabId);
  const { isPending, isError, error, refetch, isFetching } = useRecords(activeTabId);

  const handleDayPress = useCallback((key: string) => setSelectedDate(key), []);
  const handleClose = useCallback(() => setSelectedDate(null), []);

  return (
    <SafeAreaView style={styles.container}>
      <TabBar />

      {/* 서버 연결 실패 안내 — 캘린더는 그대로 보여주고 위에 배너만 띄운다. */}
      {isError && (
        <View style={styles.errorBanner}>
          <Ionicons name="cloud-offline-outline" size={16} color="#c0392b" />
          <Text style={styles.errorText} numberOfLines={2}>
            {error instanceof Error ? error.message : "기록을 불러오지 못했습니다."}
          </Text>
          <Pressable onPress={() => refetch()} hitSlop={8} style={styles.retryBtn}>
            <Text style={styles.retryText}>{isFetching ? "재시도 중" : "재시도"}</Text>
          </Pressable>
        </View>
      )}

      <ScrollView bounces={false}>
        <CalendarView onDayPress={handleDayPress} />
      </ScrollView>

      {isPending && (
        <View style={styles.loadingOverlay} pointerEvents="none">
          <ActivityIndicator size="small" color="#111" />
        </View>
      )}

      <ClipModal dateKey={selectedDate} onClose={handleClose} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },

  errorBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#fdecea",
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  errorText: { flex: 1, color: "#c0392b", fontSize: 12 },
  retryBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: "#c0392b",
  },
  retryText: { color: "#fff", fontSize: 12, fontWeight: "600" },

  loadingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
  },
});
