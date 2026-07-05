import { useCallback, useState } from "react";
import { ScrollView, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { CalendarView } from "@/components/calendar/CalendarView";
import { ClipModal } from "@/components/calendar/ClipModal";

export default function HomeScreen() {
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const handleDayPress = useCallback((key: string) => setSelectedDate(key), []);
  const handleClose = useCallback(() => setSelectedDate(null), []);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView bounces={false}>
        <CalendarView onDayPress={handleDayPress} />
      </ScrollView>

      <ClipModal dateKey={selectedDate} onClose={handleClose} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
});
