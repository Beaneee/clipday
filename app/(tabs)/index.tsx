import { useCallback, useState } from "react";
import { StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { CalendarView } from "@/components/calendar/CalendarView";
import { ClipModal } from "@/components/calendar/ClipModal";

export default function HomeScreen() {
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const handleDayPress = useCallback((key: string) => setSelectedDate(key), []);
  const handleClose = useCallback(() => setSelectedDate(null), []);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.flex}>
        <CalendarView onDayPress={handleDayPress} />
      </View>

      <ClipModal dateKey={selectedDate} onClose={handleClose} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  flex: { flex: 1 },
});
