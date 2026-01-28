import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Switch,
  Modal,
  TextInput,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  LogOut,
  User,
  Phone,
  Mail,
  Building,
  Bell,
  Lock,
  ChevronRight,
  X,
  Edit2, // 🆕 Importando ícone de editar
} from "lucide-react-native";
import { useAuth } from "../contexts/AuthContext";
import { supabase } from "../lib/supabase";
import * as Crypto from "expo-crypto";
// import { NotificationService } from '../services/NotificationService'; // Descomente após instalar expo-notifications

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const [editingRole, setEditingRole] = useState(false);
  const [customRole, setCustomRole] = useState(user?.role || "");

  const handleSaveRole = async () => {
    if (!customRole.trim()) {
      Alert.alert("Erro", "A função não pode estar vazia");
      setCustomRole(user?.role || "");
      setEditingRole(false);
      return;
    }

    try {
      const { error } = await supabase
        .from("users")
        .update({ role: customRole.trim() })
        .eq("id", user.id);

      if (error) throw error;

      Alert.alert("Sucesso", "Função atualizada!");
      setEditingRole(false);
    } catch (error) {
      console.error("Erro ao atualizar função:", error);
      Alert.alert("Erro", "Não foi possível atualizar a função");
      setCustomRole(user?.role || "");
      setEditingRole(false);
    }
  };

  // Estados do formulário de senha
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const handleRefresh = async () => {
    setRefreshing(true);
    // Simula recarregar dados do perfil
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setRefreshing(false);
  };

  const handleLogout = async () => {
    Alert.alert("Sair da Conta", "Tem certeza que deseja sair?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Sair",
        style: "destructive",
        onPress: async () => {
          await logout();
          // Não precisa navegar - o AuthStack vai detectar automaticamente
          // que o user é null e mostrar a tela de Login
        },
      },
    ]);
  };

  const handleChangePassword = async () => {
    // Validações
    if (!currentPassword || !newPassword || !confirmPassword) {
      Alert.alert("Erro", "Preencha todos os campos");
      return;
    }

    if (newPassword.length < 6) {
      Alert.alert("Erro", "A nova senha deve ter pelo menos 6 caracteres");
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert("Erro", "As senhas não conferem");
      return;
    }

    setChangingPassword(true);

    try {
      // 1. Buscar usuário atual
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("password")
        .eq("id", user.id)
        .single();

      if (userError) throw userError;

      // 2. Verificar senha atual
      const currentPasswordHash = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        currentPassword,
      );

      if (userData.password !== currentPasswordHash) {
        Alert.alert("Erro", "Senha atual incorreta");
        setChangingPassword(false);
        return;
      }

      // 3. Hash da nova senha
      const newPasswordHash = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        newPassword,
      );

      // 4. Atualizar senha no banco
      const { error: updateError } = await supabase
        .from("users")
        .update({
          password: newPasswordHash,
          must_change_password: false,
        })
        .eq("id", user.id);

      if (updateError) throw updateError;

      Alert.alert("Sucesso", "Senha alterada com sucesso!");
      setShowPasswordModal(false);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error) {
      console.error("Erro ao alterar senha:", error);
      Alert.alert("Erro", "Não foi possível alterar a senha");
    } finally {
      setChangingPassword(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      {/* TopBar fixo */}
      <View style={styles.topBar}>
        <Image
          source={require("../../assets/frontiers.png")}
          style={styles.logoImage}
          resizeMode="contain"
        />
      </View>

      <ScrollView
        style={styles.container}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor="#000"
          />
        }
      >
        {/* Header do Perfil */}
        <View style={styles.header}>
          <View style={styles.avatar}>
            <User size={40} color="#ffffff" />
          </View>
          <Text style={styles.name}>{user?.name || "Usuário"}</Text>
          <Text style={styles.sector}>
            {user?.sector || "Setor não informado"}
          </Text>
        </View>

        {/* Informações Pessoais */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Informações Pessoais</Text>

          <View style={styles.infoCard}>
            <View style={styles.infoIcon}>
              <Phone size={20} color="#000" />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Telefone</Text>
              <Text style={styles.infoValue}>{user?.phone || "-"}</Text>
            </View>
          </View>

          <View style={styles.infoCard}>
            <View style={styles.infoIcon}>
              <Mail size={20} color="#000" />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Email</Text>
              <Text style={styles.infoValue}>{user?.email || "-"}</Text>
            </View>
          </View>

          <View style={styles.infoCard}>
            <View style={styles.infoIcon}>
              <Building size={20} color="#000" />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Setor</Text>
              <Text style={styles.infoValue}>{user?.sector || "-"}</Text>
            </View>
          </View>

          {/* 🆕 CAMPO DE FUNÇÃO CORRIGIDO - DENTRO DO CARD */}
          <View style={styles.infoCard}>
            <View style={styles.infoIcon}>
              <User size={20} color="#000" />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Função</Text>
              {editingRole ? (
                <TextInput
                  style={styles.infoInput}
                  value={customRole}
                  onChangeText={setCustomRole}
                  onBlur={handleSaveRole}
                  autoFocus
                  placeholder="Ex: Líder de Célula"
                  placeholderTextColor="#999"
                />
              ) : (
                <Text style={styles.infoValue}>
                  {user?.role || (user?.is_admin ? "Administrador" : "Membro")}
                </Text>
              )}
            </View>
            {/* Botão de editar */}
            <TouchableOpacity
              onPress={() => {
                if (editingRole) {
                  handleSaveRole();
                } else {
                  setEditingRole(true);
                }
              }}
              style={styles.editButton}
            >
              <Edit2 size={18} color="#000" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Configurações */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Configurações</Text>

          {/* Notificações */}
          <TouchableOpacity style={styles.settingCard} activeOpacity={0.7}>
            <View style={styles.settingLeft}>
              <View style={styles.settingIcon}>
                <Bell size={20} color="#000" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.settingTitle}>Notificações</Text>
                <Text style={styles.settingDescription}>
                  Receber avisos de novos posts e mensagens
                </Text>
              </View>
            </View>
            <Switch
              value={notificationsEnabled}
              onValueChange={setNotificationsEnabled}
              trackColor={{ false: "#ddd", true: "#000" }}
              thumbColor={notificationsEnabled ? "#fcd030" : "#f4f3f4"}
            />
          </TouchableOpacity>

          {/* Alterar Senha */}
          <TouchableOpacity
            style={styles.settingCard}
            onPress={() => setShowPasswordModal(true)}
            activeOpacity={0.7}
          >
            <View style={styles.settingLeft}>
              <View style={styles.settingIcon}>
                <Lock size={20} color="#000" />
              </View>
              <View>
                <Text style={styles.settingTitle}>Alterar Senha</Text>
                <Text style={styles.settingDescription}>
                  Trocar sua senha de acesso
                </Text>
              </View>
            </View>
            <ChevronRight size={20} color="#999" />
          </TouchableOpacity>
        </View>

        {/* Botão de Logout */}
        <View style={styles.section}>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <LogOut size={20} color="#ffffff" />
            <Text style={styles.logoutText}>Sair da Conta</Text>
          </TouchableOpacity>
        </View>

        {/* Versão do App */}
        <View style={styles.footer}>
          <Text style={styles.version}>Versão 1.0.0</Text>
          <Text style={styles.copyright}>© 2026 Frontiers</Text>
        </View>
      </ScrollView>

      {/* Modal de Alteração de Senha */}
      <Modal
        visible={showPasswordModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowPasswordModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Alterar Senha</Text>
              <TouchableOpacity
                onPress={() => setShowPasswordModal(false)}
                style={styles.closeButton}
              >
                <X size={24} color="#000" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Senha Atual</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Digite sua senha atual"
                  value={currentPassword}
                  onChangeText={setCurrentPassword}
                  secureTextEntry
                  editable={!changingPassword}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Nova Senha</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Digite a nova senha (mín. 6 caracteres)"
                  value={newPassword}
                  onChangeText={setNewPassword}
                  secureTextEntry
                  editable={!changingPassword}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Confirmar Nova Senha</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Digite a nova senha novamente"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry
                  editable={!changingPassword}
                />
              </View>

              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.cancelButton]}
                  onPress={() => setShowPasswordModal(false)}
                  disabled={changingPassword}
                >
                  <Text style={styles.cancelButtonText}>Cancelar</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.modalButton, styles.confirmButton]}
                  onPress={handleChangePassword}
                  disabled={changingPassword}
                >
                  {changingPassword ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.confirmButtonText}>Alterar</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#f9f9f9",
  },
  topBar: {
    backgroundColor: "#000",
    height: 80,
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    elevation: 4,
    marginTop: 10,
    marginBottom: 0,
  },
  logoImage: {
    width: 200,
    height: 130,
  },
  container: {
    flex: 1,
  },
  header: {
    alignItems: "center",
    paddingVertical: 32,
    backgroundColor: "#ffffff",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#000",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  name: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#000",
  },
  sector: {
    fontSize: 14,
    color: "#777",
    marginTop: 4,
  },
  section: {
    paddingHorizontal: 16,
    paddingVertical: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#000",
    marginBottom: 16,
  },
  infoCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#eee",
  },
  infoIcon: {
    marginRight: 12,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    color: "#999",
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000",
  },

  infoInput: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000",
    borderBottomWidth: 2,
    borderBottomColor: "#fcd030",
    paddingVertical: 4,
  },

  // 🆕 Estilo para o botão de editar
  editButton: {
    padding: 8,
    marginLeft: 8,
  },

  settingCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#eee",
  },
  settingLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  settingIcon: {
    marginRight: 12,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000",
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 12,
    color: "#999",
  },
  logoutButton: {
    backgroundColor: "#ff6b6b",
    borderRadius: 12,
    paddingVertical: 16,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  logoutText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "bold",
  },
  footer: {
    alignItems: "center",
    paddingVertical: 32,
    paddingBottom: 48,
  },
  version: {
    fontSize: 12,
    color: "#999",
    marginBottom: 4,
  },
  copyright: {
    fontSize: 11,
    color: "#ccc",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 16,
    width: "100%",
    maxWidth: 400,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#000",
  },
  closeButton: {
    padding: 4,
  },
  modalBody: {
    padding: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#000",
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
    backgroundColor: "#f9f9f9",
  },
  modalActions: {
    flexDirection: "row",
    gap: 12,
    marginTop: 8,
  },
  modalButton: {
    flex: 1,
    padding: 14,
    borderRadius: 8,
    alignItems: "center",
  },
  cancelButton: {
    backgroundColor: "#f5f5f5",
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#666",
  },
  confirmButton: {
    backgroundColor: "#000000",
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
  },
});