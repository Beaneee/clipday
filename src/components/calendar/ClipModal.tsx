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
import { colors, noWebOutline, radius, size, space, type } from "@/theme/tokens";

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
  const [memoFocused, setMemoFocused] = useState(false);

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
    if (!result.canceled) {
      const asset = result.assets[0];
      setPhoto({
        kind: "local",
        uri: asset.uri,
        mimeType: asset.mimeType,
        fileName: asset.fileName,
      });
    }
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
    setMemoFocused(false);
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
                <Ionicons name="trash-outline" size={20} color={busy ? colors.textDisabled : colors.textDanger} />
              </Pressable>
            )}
            <Pressable onPress={onClose} hitSlop={12} disabled={busy}>
              <Ionicons name="close" size={24} color={colors.textPrimary} />
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
                  <Ionicons name="camera-outline" size={20} color={colors.textAlt} />
                  <Text style={styles.changeText}>사진 변경</Text>
                </View>
              </>
            ) : (
              <View style={styles.placeholder}>
                <Ionicons name="image-outline" size={32} color={colors.textDisabled} />
                <Text style={styles.placeholderText}>사진을 추가해주세요</Text>
              </View>
            )}
          </Pressable>

          {/* 메모 */}
          <TextInput
            style={[styles.memoInput, noWebOutline, memoFocused && styles.memoInputFocused]}
            onFocus={() => setMemoFocused(true)}
            onBlur={() => setMemoFocused(false)}
            placeholder="오늘 하루를 기록해보세요..."
            placeholderTextColor={colors.textPlaceholder}
            multiline
            value={memo}
            onChangeText={setMemo}
            editable={!busy}
          />

          {/* 에러 안내 */}
          {error && (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle-outline" size={16} color={colors.textDanger} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {/* 저장 버튼 */}
          <Pressable
            style={({ pressed }) => [
              styles.saveButton,
              pressed && styles.saveButtonPressed,
              (!photo || busy) && styles.saveButtonDisabled,
            ]}
            onPress={handleSave}
            disabled={!photo || busy}
          >
            {saveMutation.isPending ? (
              <ActivityIndicator color={colors.textAlt} size="small" />
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
  flex: { flex: 1, backgroundColor: colors.bgPrimary },
  handleBar: {
    width: 36,
    height: 4,
    borderRadius: radius.full,
    backgroundColor: colors.lineDefault,
    alignSelf: "center",
    marginTop: space.s3,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    height: size.topAppBar,
    paddingHorizontal: space.s6,
  },
  dateText: {
    fontSize: type.h4.fontSize,
    lineHeight: type.h4.lineHeight,
    letterSpacing: type.h4.letterSpacing,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  headerActions: { flexDirection: "row", alignItems: "center", gap: space.s5 },
  deleteBtn: { padding: space.s1 / 2 },

  body: { padding: space.s6, paddingBottom: space.s12 },

  photoPicker: {
    width: "100%",
    height: 260,
    borderRadius: radius.xl,
    overflow: "hidden",
    backgroundColor: colors.fillSecondary,
    marginBottom: space.s4,
  },
  preview: { width: "100%", height: "100%" },
  changeOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "rgba(1, 10, 37, 0.36)",
    alignItems: "center",
    justifyContent: "center",
    gap: space.s1 + 2,
  },
  changeText: {
    color: colors.textAlt,
    fontSize: type.labelS.fontSize,
    lineHeight: type.labelS.lineHeight,
    fontWeight: "600",
  },
  placeholder: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: space.s2,
  },
  placeholderText: {
    color: colors.textTertiary,
    fontSize: type.body2.fontSize,
    lineHeight: type.body2.lineHeight,
    letterSpacing: type.body2.letterSpacing,
  },

  // text-field: resting은 grey-100 채움 + 헤어라인, focus는 흰 배경 + 브랜드 보더
  memoInput: {
    borderWidth: 1,
    borderColor: colors.lineDefault,
    backgroundColor: colors.fillSecondary,
    borderRadius: radius.m,
    padding: space.s4,
    fontSize: type.body2.fontSize,
    lineHeight: type.body2.lineHeight,
    letterSpacing: type.body2.letterSpacing,
    minHeight: 112,
    textAlignVertical: "top",
    marginBottom: space.s5,
    color: colors.textPrimary,
  },
  memoInputFocused: {
    backgroundColor: colors.bgPrimary,
    borderColor: colors.lineBrand,
    borderWidth: 1.5,
  },

  errorBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: space.s2,
    backgroundColor: colors.fillSecondary,
    borderRadius: radius.m,
    padding: space.s4,
    marginBottom: space.s4,
  },
  errorText: {
    color: colors.textDanger,
    fontSize: type.body3.fontSize,
    lineHeight: type.body3.lineHeight,
    flex: 1,
  },

  // XL 버튼: 56 높이 + radius 16 + label-l
  saveButton: {
    height: size.buttonXL,
    backgroundColor: colors.fillBrand,
    borderRadius: radius.xl,
    alignItems: "center",
    justifyContent: "center",
  },
  saveButtonPressed: { backgroundColor: colors.fillBrandPressed },
  // disabled는 부분 회색이 아니라 노드 전체 불투명도로 처리한다
  saveButtonDisabled: { opacity: colors.disabledOpacity },
  saveButtonText: {
    color: colors.textAlt,
    fontSize: type.labelL.fontSize,
    lineHeight: type.labelL.lineHeight,
    letterSpacing: type.labelL.letterSpacing,
    fontWeight: "700",
  },
});
