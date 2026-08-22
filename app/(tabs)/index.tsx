import { useCallback, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { CalendarView } from "@/components/calendar/CalendarView";
import { ClipModal } from "@/components/calendar/ClipModal";
import { TabBar } from "@/components/calendar/TabBar";
import { useRecords } from "@/hooks/useRecords";
import { useTabStore } from "@/store/tab.store";
import { colors, font, radius, space, type } from "@/theme/tokens";

export default function HomeScreen() {
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const activeTabId = useTabStore((s) => s.activeTabId);
  // isPending이 아니라 isLoading을 쓴다. isPending은 요청이 실제로 나가지
  // 않는 상태에서도 참이라, 그 경우 스피너가 영원히 돈다.
  const { isLoading, isError, error, refetch, isFetching } = useRecords(activeTabId);

  const handleDayPress = useCallback((key: string) => setSelectedDate(key), []);
  const handleClose = useCallback(() => setSelectedDate(null), []);

  return (
    <SafeAreaView style={styles.container}>
      <TabBar />

      {/* 서버 연결 실패 안내 — 캘린더는 그대로 보여주고 위에 배너만 띄운다. */}
      {isError && (
        <View style={styles.errorBanner}>
          <Ionicons name="cloud-offline-outline" size={16} color={colors.textDanger} />
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

      {isLoading && (
        <View style={styles.loadingOverlay} pointerEvents="none">
          <ActivityIndicator size="small" color={colors.textTertiary} />
        </View>
      )}

      <ClipModal dateKey={selectedDate} onClose={handleClose} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bgPrimary },

  // 사용자를 멈춰 세우지 않는 안내 — 캘린더는 그대로 두고 위에 얹는다
  errorBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: space.s2,
    backgroundColor: colors.fillSecondary,
    paddingHorizontal: space.s6,
    paddingVertical: space.s3,
  },
  errorText: {
    flex: 1,
    color: colors.textDanger,
    fontSize: type.body3.fontSize,
    lineHeight: type.body3.lineHeight,
  },
  // ghost 버튼에 가까운 약한 위계 — 강조색은 저장 CTA에 예약해 둔다
  retryBtn: {
    paddingHorizontal: space.s3,
    paddingVertical: space.s1 + 2,
    borderRadius: radius.s,
  },
  retryText: {
    color: colors.textBrand,
    fontSize: type.labelS.fontSize,
    letterSpacing: type.labelS.letterSpacing,
    fontFamily: font.semibold,
  },

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
