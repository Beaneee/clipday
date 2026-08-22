import { StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors, font, size, space, type } from "@/theme/tokens";

export default function ProfileScreen() {
  return (
    <SafeAreaView style={styles.container}>
      {/* top-app-bar: 56pt, 좌측 정렬 타이틀 */}
      <View style={styles.appBar}>
        <Text style={styles.title}>프로필</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bgPrimary },
  appBar: {
    height: size.topAppBar,
    justifyContent: "center",
    paddingHorizontal: space.s6,
  },
  title: {
    fontSize: type.h3.fontSize,
    lineHeight: type.h3.lineHeight,
    letterSpacing: type.h3.letterSpacing,
    fontFamily: font.bold,
    color: colors.textPrimary,
  },
});
