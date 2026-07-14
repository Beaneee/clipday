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
import { useTabStore } from "@/store/tab.store";
import type { Clip } from "@/types/clip";

type Props = {
  dateKey: string | null;
  onClose: () => void;
};

export function ClipModal({ dateKey, onClose }: Props) {
  const activeTabId = useTabStore((s) => s.activeTabId);
  const addClip = useClipStore((s) => s.addClip);
  const removeClip = useClipStore((s) => s.removeClip);
  const clipsMap = useClipStore((s) => s.clips);
  const existing = dateKey
    ? (clipsMap[activeTabId]?.[dateKey]?.[0] ?? null)
    : null;

  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [memo, setMemo] = useState("");
  const [saving, setSaving] = useState(false);

  const pickImage = useCallback(async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      quality: 0.9,
    });
    if (!result.canceled) setPhotoUri(result.assets[0].uri);
  }, []);

  const handleSave = useCallback(async () => {
    if (!dateKey || !photoUri) return;
    setSaving(true);

    // 기존 클립 교체
    if (existing) removeClip(activeTabId, dateKey, existing.id);

    const clip: Clip = {
      id: `${dateKey}-${Date.now()}`,
      dateKey,
      photoUri,
      memo,
      createdAt: new Date().toISOString(),
    };
    addClip(activeTabId, clip);
    setPhotoUri(null);
    setMemo("");
    setSaving(false);
    onClose();
  }, [dateKey, photoUri, memo, addClip, removeClip, existing, activeTabId, onClose]);

  const handleDelete = useCallback(() => {
    if (!dateKey || !existing) return;
    removeClip(activeTabId, dateKey, existing.id);
    onClose();
  }, [dateKey, existing, removeClip, activeTabId, onClose]);

  // 모달 열릴 때 기존 데이터 세팅
  const onShow = useCallback(() => {
    if (existing) {
      setPhotoUri(existing.photoUri);
      setMemo(existing.memo);
    } else {
      setPhotoUri(null);
      setMemo("");
    }
  }, [existing]);

  const formatDate = (key: string) => {
    const [y, m, d] = key.split("-");
    return `${y}년 ${Number(m)}월 ${Number(d)}일`;
  };

  const displayUri = photoUri;

  return (
    <Modal
      visible={!!dateKey}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
      onShow={onShow}
    >
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={styles.handleBar} />

        {/* 헤더 */}
        <View style={styles.header}>
          <Text style={styles.dateText}>{dateKey ? formatDate(dateKey) : ""}</Text>
          <View style={styles.headerActions}>
            {existing && (
              <Pressable onPress={handleDelete} hitSlop={12} style={styles.deleteBtn}>
                <Ionicons name="trash-outline" size={20} color="#e74c3c" />
              </Pressable>
            )}
            <Pressable onPress={onClose} hitSlop={12}>
              <Ionicons name="close" size={24} color="#111" />
            </Pressable>
          </View>
        </View>

        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.body}
          keyboardShouldPersistTaps="handled"
        >
          {/* 사진 영역 */}
          <Pressable style={styles.photoPicker} onPress={pickImage}>
            {displayUri ? (
              <>
                <Image source={{ uri: displayUri }} style={styles.preview} contentFit="cover" />
                <View style={styles.changeOverlay}>
                  <Ionicons name="camera-outline" size={22} color="#fff" />
                  <Text style={styles.changeText}>사진 변경</Text>
                </View>
              </>
            ) : (
              <View style={styles.placeholder}>
                <Ionicons name="image-outline" size={48} color="#ccc" />
                <Text style={styles.placeholderText}>사진을 추가해주세요</Text>
              </View>
            )}
          </Pressable>

          {/* 메모 */}
          <TextInput
            style={styles.memoInput}
            placeholder="오늘 하루를 기록해보세요..."
            placeholderTextColor="#bbb"
            multiline
            value={memo}
            onChangeText={setMemo}
          />

          {/* 저장 버튼 */}
          <Pressable
            style={[styles.saveButton, (!photoUri || saving) && styles.saveButtonDisabled]}
            onPress={handleSave}
            disabled={!photoUri || saving}
          >
            {saving ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.saveButtonText}>
                {existing ? "수정 완료" : "저장"}
              </Text>
            )}
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: "#fff" },
  handleBar: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#ddd",
    alignSelf: "center",
    marginTop: 12,
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
  dateText: { fontSize: 17, fontWeight: "600", color: "#111" },
  headerActions: { flexDirection: "row", alignItems: "center", gap: 16 },
  deleteBtn: { padding: 2 },

  body: { padding: 20, paddingBottom: 48 },

  photoPicker: {
    width: "100%",
    height: 260,
    borderRadius: 14,
    overflow: "hidden",
    backgroundColor: "#f5f5f5",
    marginBottom: 16,
  },
  preview: { width: "100%", height: "100%" },
  changeOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "rgba(0,0,0,0.3)",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  changeText: { color: "#fff", fontSize: 13, fontWeight: "500" },
  placeholder: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  placeholderText: { color: "#bbb", fontSize: 14 },

  memoInput: {
    borderWidth: 1,
    borderColor: "#eee",
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    minHeight: 110,
    textAlignVertical: "top",
    marginBottom: 20,
    color: "#111",
    lineHeight: 22,
  },

  saveButton: {
    backgroundColor: "#111",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
  },
  saveButtonDisabled: { backgroundColor: "#ddd" },
  saveButtonText: { color: "#fff", fontSize: 16, fontWeight: "600" },
});
