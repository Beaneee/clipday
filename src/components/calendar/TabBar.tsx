import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useDeleteTabRecords } from "@/hooks/useRecords";
import { useTabStore } from "@/store/tab.store";
import { colors, noWebOutline, radius, size, space, type } from "@/theme/tokens";
import type { Tab } from "@/types/tab";

export function TabBar() {
  const tabs = useTabStore((s) => s.tabs);
  const activeTabId = useTabStore((s) => s.activeTabId);
  const setActiveTab = useTabStore((s) => s.setActiveTab);
  const addTab = useTabStore((s) => s.addTab);
  const renameTab = useTabStore((s) => s.renameTab);
  const removeTab = useTabStore((s) => s.removeTab);
  const deleteTabRecords = useDeleteTabRecords();

  // 이름 입력 모달: 새 탭 생성 또는 기존 탭 이름 변경
  const [nameModal, setNameModal] = useState<
    { mode: "create" } | { mode: "rename"; tab: Tab } | null
  >(null);
  const [name, setName] = useState("");
  const [editing, setEditing] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<Tab | null>(null);

  const openCreate = () => {
    setName("");
    setNameModal({ mode: "create" });
  };

  const openRename = (tab: Tab) => {
    setName(tab.name);
    setNameModal({ mode: "rename", tab });
  };

  const closeModal = () => {
    setNameModal(null);
    setName("");
  };

  const submit = () => {
    if (!name.trim() || !nameModal) return;
    if (nameModal.mode === "create") addTab(name);
    else renameTab(nameModal.tab.id, name);
    closeModal();
  };

  const confirmDelete = (tab: Tab) => {
    if (tabs.length <= 1) return; // 마지막 탭은 삭제 불가
    setPendingDelete(tab);
  };

  const doDelete = () => {
    if (!pendingDelete) return;
    const { id } = pendingDelete;
    removeTab(id);
    // 서버에 남은 해당 탭 기록도 함께 정리한다. 실패해도 탭 삭제 자체는 되돌리지 않는다.
    deleteTabRecords.mutate(id, {
      onError: (e) => {
        if (__DEV__) console.warn("[tabs] 서버 기록 삭제 실패:", e);
      },
    });
    setPendingDelete(null);
    if (tabs.length <= 2) setEditing(false); // 삭제 후 1개만 남으면 편집 종료
  };

  return (
    <View style={styles.wrap}>
      <View style={styles.bar}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.row}
          style={styles.scroll}
        >
          {tabs.map((t) => {
            const active = t.id === activeTabId;
            const deletable = editing && tabs.length > 1;
            return (
              <Pressable
                key={t.id}
                onPress={() => (editing ? openRename(t) : setActiveTab(t.id))}
                style={[styles.chip, active && styles.chipActive]}
              >
                <View style={styles.chipInner}>
                  <Text
                    style={[styles.chipText, active && styles.chipTextActive]}
                  >
                    {t.name}
                  </Text>
                  {deletable && (
                    <Pressable
                      onPress={() => confirmDelete(t)}
                      hitSlop={10}
                      style={styles.chipClose}
                    >
                      <Ionicons
                        name="close-circle"
                        size={16}
                        color={active ? colors.textAlt : colors.textDanger}
                      />
                    </Pressable>
                  )}
                </View>
              </Pressable>
            );
          })}

          <Pressable style={styles.addBtn} onPress={openCreate} hitSlop={8}>
            <Ionicons name="add" size={20} color={colors.textSecondary} />
          </Pressable>
        </ScrollView>

        {tabs.length > 1 && (
          <Pressable
            style={styles.editBtn}
            onPress={() => setEditing((e) => !e)}
            hitSlop={8}
          >
            <Ionicons
              name={editing ? "checkmark" : "create-outline"}
              size={20}
              color={editing ? colors.textPrimary : colors.textTertiary}
            />
          </Pressable>
        )}
      </View>

      {/* 탭 이름 입력 모달 (생성 / 이름 변경 공용) */}
      <Modal
        visible={!!nameModal}
        transparent
        animationType="fade"
        onRequestClose={closeModal}
      >
        <Pressable style={styles.backdrop} onPress={closeModal}>
          <Pressable style={styles.card} onPress={() => {}}>
            <Text style={styles.cardTitle}>
              {nameModal?.mode === "rename" ? "탭 이름 변경" : "새 탭"}
            </Text>
            <TextInput
              style={[styles.input, noWebOutline]}
              placeholder="테마 이름 (예: 여행, 운동)"
              placeholderTextColor={colors.textPlaceholder}
              value={name}
              onChangeText={setName}
              autoFocus
              selectTextOnFocus
              onSubmitEditing={submit}
              returnKeyType="done"
              maxLength={12}
            />
            <View style={styles.cardActions}>
              <Pressable
                style={[styles.cardBtn, styles.cancelBtn]}
                onPress={closeModal}
              >
                <Text style={styles.cancelText}>취소</Text>
              </Pressable>
              <Pressable
                style={[
                  styles.cardBtn,
                  styles.createBtn,
                  !name.trim() && styles.createBtnDisabled,
                ]}
                onPress={submit}
                disabled={!name.trim()}
              >
                <Text style={styles.createText}>
                  {nameModal?.mode === "rename" ? "변경" : "생성"}
                </Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* 탭 삭제 확인 모달 */}
      <Modal
        visible={!!pendingDelete}
        transparent
        animationType="fade"
        onRequestClose={() => setPendingDelete(null)}
      >
        <Pressable
          style={styles.backdrop}
          onPress={() => setPendingDelete(null)}
        >
          <Pressable style={styles.card} onPress={() => {}}>
            <Text style={styles.cardTitle}>탭 삭제</Text>
            <Text style={styles.cardBody}>
              '{pendingDelete?.name}' 탭과 저장된 기록이 모두 삭제됩니다.
            </Text>
            <View style={styles.cardActions}>
              <Pressable
                style={[styles.cardBtn, styles.cancelBtn]}
                onPress={() => setPendingDelete(null)}
              >
                <Text style={styles.cancelText}>취소</Text>
              </Pressable>
              <Pressable
                style={[styles.cardBtn, styles.deleteBtn]}
                onPress={doDelete}
              >
                <Text style={styles.createText}>삭제</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.lineDefault,
  },
  bar: { flexDirection: "row", alignItems: "center" },
  scroll: { flexShrink: 1 },
  row: {
    alignItems: "center",
    paddingHorizontal: space.s6,
    paddingVertical: space.s3,
    gap: space.s2,
  },
  editBtn: {
    width: size.minTouch,
    alignSelf: "stretch",
    alignItems: "center",
    justifyContent: "center",
    borderLeftWidth: StyleSheet.hairlineWidth,
    borderLeftColor: colors.lineDefault,
  },

  // chip: 34px full pill. resting은 흰 배경 + 헤어라인, active는 grey-900으로 뒤집힌다
  chip: {
    height: size.chip,
    justifyContent: "center",
    paddingHorizontal: space.s4,
    borderRadius: radius.full,
    backgroundColor: colors.bgPrimary,
    borderWidth: 1,
    borderColor: colors.lineDefault,
  },
  chipActive: {
    backgroundColor: colors.fillPrimary,
    borderColor: colors.fillPrimary,
  },
  chipInner: { flexDirection: "row", alignItems: "center", gap: space.s1 + 2 },
  chipText: {
    fontSize: type.labelS.fontSize,
    lineHeight: type.labelS.lineHeight,
    letterSpacing: type.labelS.letterSpacing,
    color: colors.textSecondary,
    fontWeight: "600",
  },
  chipTextActive: { color: colors.textAlt, fontWeight: "600" },
  chipClose: { marginRight: -2 },

  addBtn: {
    width: size.chip,
    height: size.chip,
    borderRadius: radius.full,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.lineDefault,
  },

  backdrop: {
    flex: 1,
    backgroundColor: colors.overlayScrim,
    alignItems: "center",
    justifyContent: "center",
    padding: space.s8,
  },
  // dialog: radius 20, 24 inner padding
  card: {
    width: "100%",
    maxWidth: 340,
    backgroundColor: colors.bgElevated,
    borderRadius: radius.xxl,
    padding: space.s6,
  },
  cardTitle: {
    fontSize: type.title1.fontSize,
    lineHeight: type.title1.lineHeight,
    letterSpacing: type.title1.letterSpacing,
    fontWeight: "700",
    color: colors.textPrimary,
    marginBottom: space.s4,
  },
  cardBody: {
    fontSize: type.body2.fontSize,
    lineHeight: type.body2.lineHeight,
    letterSpacing: type.body2.letterSpacing,
    color: colors.textSecondary,
    marginTop: -space.s1,
    marginBottom: space.s5,
  },
  input: {
    height: size.textField,
    borderWidth: 1,
    borderColor: colors.lineDefault,
    backgroundColor: colors.fillSecondary,
    borderRadius: radius.m,
    paddingHorizontal: space.s4,
    fontSize: type.body2.fontSize,
    letterSpacing: type.body2.letterSpacing,
    color: colors.textPrimary,
    marginBottom: space.s4,
  },

  // dialog CTA: 48 높이 + radius 14
  cardActions: { flexDirection: "row", gap: space.s2 },
  cardBtn: {
    flex: 1,
    height: size.buttonL,
    borderRadius: radius.l,
    alignItems: "center",
    justifyContent: "center",
  },
  cancelBtn: { backgroundColor: colors.fillSecondary },
  cancelText: {
    color: colors.textSecondary,
    fontSize: type.labelM.fontSize,
    letterSpacing: type.labelM.letterSpacing,
    fontWeight: "600",
  },
  createBtn: { backgroundColor: colors.fillBrand },
  createBtnDisabled: { opacity: colors.disabledOpacity },
  createText: {
    color: colors.textAlt,
    fontSize: type.labelM.fontSize,
    letterSpacing: type.labelM.letterSpacing,
    fontWeight: "600",
  },
  deleteBtn: { backgroundColor: colors.fillDanger },
});
