import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { Image } from "expo-image";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useClipStore } from "@/store/clip.store";
import type { Clip } from "@/types/clip";

type Props = {
  dateKey: string | null;
  onClose: () => void;
};

export function ClipModal({ dateKey, onClose }: Props) {
  const addClip = useClipStore((s) => s.addClip);
  const clipsMap = useClipStore((s) => s.clips);
  const clips = dateKey ? (clipsMap[dateKey] ?? []) : [];

  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [memo, setMemo] = useState("");
  const [saving, setSaving] = useState(false);

  const pickImage = useCallback(async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      quality: 0.8,
    });
    if (!result.canceled) setPhotoUri(result.assets[0].uri);
  }, []);

  const handleSave = useCallback(async () => {
    if (!dateKey || !photoUri) return;
    setSaving(true);
    const clip: Clip = {
      id: `${dateKey}-${Date.now()}`,
      dateKey,
      photoUri,
      memo,
      createdAt: new Date().toISOString(),
    };
    addClip(clip);
    setPhotoUri(null);
    setMemo("");
    setSaving(false);
  }, [dateKey, photoUri, memo, addClip]);

  const formatDate = (key: string) => {
    const [y, m, d] = key.split("-");
    return `${y}년 ${Number(m)}월 ${Number(d)}일`;
  };

  return (
    <Modal
      visible={!!dateKey}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        {/* Handle bar */}
        <View style={styles.handleBar} />

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.dateText}>{dateKey ? formatDate(dateKey) : ""}</Text>
          <Pressable onPress={onClose} hitSlop={12}>
            <Ionicons name="close" size={24} color="#000" />
          </Pressable>
        </View>

        <ScrollView style={styles.flex} contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
          {/* Photo picker */}
          <Pressable style={styles.photoPicker} onPress={pickImage}>
            {photoUri ? (
              <Image source={{ uri: photoUri }} style={styles.preview} contentFit="cover" />
            ) : (
              <View style={styles.placeholder}>
                <Ionicons name="image-outline" size={40} color="#bbb" />
                <Text style={styles.placeholderText}>사진 추가</Text>
              </View>
            )}
          </Pressable>

          {/* Memo */}
          <TextInput
            style={styles.memoInput}
            placeholder="오늘의 메모를 입력하세요..."
            placeholderTextColor="#bbb"
            multiline
            value={memo}
            onChangeText={setMemo}
          />

          {/* Save button */}
          <Pressable
            style={[styles.saveButton, (!photoUri || saving) && styles.saveButtonDisabled]}
            onPress={handleSave}
            disabled={!photoUri || saving}
          >
            {saving ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.saveButtonText}>저장</Text>
            )}
          </Pressable>

          {/* Existing clips */}
          {clips.length > 0 && (
            <View style={styles.existingSection}>
              <Text style={styles.existingTitle}>이 날의 클립 ({clips.length})</Text>
              {clips.map((clip) => (
                <ClipItem key={clip.id} clip={clip} />
              ))}
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function ClipItem({ clip }: { clip: Clip }) {
  const removeClip = useClipStore((s) => s.removeClip);

  return (
    <View style={styles.clipItem}>
      <Image source={{ uri: clip.photoUri }} style={styles.clipThumb} contentFit="cover" />
      <View style={styles.clipMeta}>
        <Text style={styles.clipMemo} numberOfLines={2}>
          {clip.memo || "메모 없음"}
        </Text>
      </View>
      <Pressable onPress={() => removeClip(clip.dateKey, clip.id)} hitSlop={8}>
        <Ionicons name="trash-outline" size={18} color="#ccc" />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  handleBar: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#e0e0e0",
    alignSelf: "center",
    marginTop: 12,
    marginBottom: 4,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#eee",
  },
  dateText: { fontSize: 17, fontWeight: "600" },
  body: { padding: 20, paddingBottom: 40 },
  photoPicker: {
    width: "100%",
    height: 220,
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "#f5f5f5",
    marginBottom: 16,
  },
  preview: { width: "100%", height: "100%" },
  placeholder: { flex: 1, alignItems: "center", justifyContent: "center", gap: 8 },
  placeholderText: { color: "#bbb", fontSize: 14 },
  memoInput: {
    borderWidth: 1,
    borderColor: "#eee",
    borderRadius: 10,
    padding: 12,
    fontSize: 15,
    minHeight: 100,
    textAlignVertical: "top",
    marginBottom: 16,
    color: "#1a1a1a",
  },
  saveButton: {
    backgroundColor: "#000",
    borderRadius: 10,
    padding: 14,
    alignItems: "center",
    marginBottom: 28,
  },
  saveButtonDisabled: { backgroundColor: "#ccc" },
  saveButtonText: { color: "#fff", fontSize: 16, fontWeight: "600" },
  existingSection: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: "#eee", paddingTop: 20 },
  existingTitle: { fontSize: 14, fontWeight: "600", color: "#666", marginBottom: 12 },
  clipItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 12,
  },
  clipThumb: { width: 56, height: 56, borderRadius: 8 },
  clipMeta: { flex: 1 },
  clipMemo: { fontSize: 14, color: "#333" },
});
