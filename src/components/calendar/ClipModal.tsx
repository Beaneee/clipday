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
import { toAbsoluteImageUrl } from "@/api/client";
import {
  useDeleteRecord,
  useRecordsByDate,
  useSaveRecord,
  type PhotoSelection,
} from "@/hooks/useRecords";
import { useTabStore } from "@/store/tab.store";

type Props = {
  dateKey: string | null;
  onClose: () => void;
};

function errorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return "알 수 없는 오류가 발생했습니다.";
}

export function ClipModal({ dateKey, onClose }: Props) {
  const activeTabId = useTabStore((s) => s.activeTabId);
  const { byDate } = useRecordsByDate(activeTabId);
  const existing = dateKey ? (byDate[dateKey] ?? null) : null;

  const saveMutation = useSaveRecord(activeTabId);
  const deleteMutation = useDeleteRecord(activeTabId);

  const [photo, setPhoto] = useState<PhotoSelection>(null);
  const [memo, setMemo] = useState("");
  const [error, setError] = useState<string | null>(null);

  const busy = saveMutation.isPending || deleteMutation.isPending;
  const displayUri =
    photo?.kind === "server"
      ? toAbsoluteImageUrl(photo.imageUrl)
      : (photo?.uri ?? null);

  const pickImage = useCallback(async () => {
    setError(null);
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      quality: 0.9,
    });
    if (!result.canceled) setPhoto({ kind: "local", uri: result.assets[0].uri });
  }, []);

  const handleSave = useCallback(() => {
    if (!dateKey || !photo) return;
    setError(null);
    saveMutation.mutate(
      { dateKey, memo, photo, existing },
      {
        onSuccess: () => {
          setPhoto(null);
          setMemo("");
          onClose();
        },
        onError: (e) => setError(errorMessage(e)),
      }
    );
  }, [dateKey, photo, memo, existing, saveMutation, onClose]);

  const handleDelete = useCallback(() => {
    if (!existing) return;
    setError(null);
    deleteMutation.mutate(existing.id, {
      onSuccess: () => {
        setPhoto(null);
        setMemo("");
        onClose();
      },
      onError: (e) => setError(errorMessage(e)),
    });
  }, [existing, deleteMutation, onClose]);

  // 모달이 열릴 때 서버에 있는 기존 기록을 입력값으로 채운다.
  const onShow = useCallback(() => {
    setError(null);
    if (existing) {
      setPhoto(existing.imageUrl ? { kind: "server", imageUrl: existing.imageUrl } : null);
      setMemo(existing.memo ?? "");
    } else {
      setPhoto(null);
      setMemo("");
    }
  }, [existing]);

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
              <Pressable
                onPress={handleDelete}
                hitSlop={12}
                style={styles.deleteBtn}
                disabled={busy}
              >
                <Ionicons name="trash-outline" size={20} color={busy ? "#f0b8b2" : "#e74c3c"} />
              </Pressable>
            )}
            <Pressable onPress={onClose} hitSlop={12} disabled={busy}>
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
          <Pressable style={styles.photoPicker} onPress={pickImage} disabled={busy}>
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
            editable={!busy}
          />

          {/* 에러 안내 */}
          {error && (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle-outline" size={16} color="#e74c3c" />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {/* 저장 버튼 */}
          <Pressable
            style={[styles.saveButton, (!photo || busy) && styles.saveButtonDisabled]}
            onPress={handleSave}
            disabled={!photo || busy}
          >
            {saveMutation.isPending ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.saveButtonText}>{existing ? "수정 완료" : "저장"}</Text>
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

  errorBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#fdecea",
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
  },
  errorText: { color: "#c0392b", fontSize: 13, flex: 1 },

  saveButton: {
    backgroundColor: "#111",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
  },
  saveButtonDisabled: { backgroundColor: "#ddd" },
  saveButtonText: { color: "#fff", fontSize: 16, fontWeight: "600" },
});
