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
                        color={active ? "#fff" : "#e74c3c"}
                      />
                    </Pressable>
                  )}
                </View>
              </Pressable>
            );
          })}

          <Pressable style={styles.addBtn} onPress={openCreate} hitSlop={8}>
            <Ionicons name="add" size={20} color="#111" />
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
              color={editing ? "#111" : "#888"}
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
              style={styles.input}
              placeholder="테마 이름 (예: 여행, 운동)"
              placeholderTextColor="#bbb"
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
    borderBottomColor: "#eee",
  },
  bar: { flexDirection: "row", alignItems: "center" },
  scroll: { flexShrink: 1 },
  row: {
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  editBtn: {
    width: 48,
    alignSelf: "stretch",
    alignItems: "center",
    justifyContent: "center",
    borderLeftWidth: StyleSheet.hairlineWidth,
    borderLeftColor: "#eee",
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 18,
    backgroundColor: "#f2f2f2",
  },
  chipActive: { backgroundColor: "#111" },
  chipInner: { flexDirection: "row", alignItems: "center", gap: 6 },
  chipText: { fontSize: 14, color: "#888", fontWeight: "500" },
  chipTextActive: { color: "#fff", fontWeight: "600" },
  chipClose: {
    marginRight: -2, // 오른쪽 여백 보정
  },

  addBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#ddd",
  },

  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
  },
  card: {
    width: "100%",
    maxWidth: 340,
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
  },
  cardTitle: { fontSize: 17, fontWeight: "700", color: "#111", marginBottom: 14 },
  cardBody: {
    fontSize: 14,
    color: "#555",
    lineHeight: 20,
    marginTop: -4,
    marginBottom: 18,
  },
  input: {
    borderWidth: 1,
    borderColor: "#eee",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: "#111",
    marginBottom: 16,
  },
  cardActions: { flexDirection: "row", gap: 10 },
  cardBtn: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: "center",
  },
  cancelBtn: { backgroundColor: "#f2f2f2" },
  cancelText: { color: "#555", fontSize: 15, fontWeight: "600" },
  createBtn: { backgroundColor: "#111" },
  createBtnDisabled: { backgroundColor: "#ddd" },
  createText: { color: "#fff", fontSize: 15, fontWeight: "600" },
  deleteBtn: { backgroundColor: "#e74c3c" },
});
