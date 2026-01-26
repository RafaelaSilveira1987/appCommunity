// src/screens/AdminApprovalScreen.js
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Image,
  TextInput,
  Share,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  Check,
  X,
  Mail,
  Phone,
  Users,
  UserCheck,
  UserX,
  Clock,
  Search,
  Download,
} from "lucide-react-native";
import ApprovalService from "../services/ApprovalService";
import { supabase } from "../lib/supabase";

export default function AdminApprovalScreen() {
  const [requests, setRequests] = useState([]);
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [processingId, setProcessingId] = useState(null);
  const [activeTab, setActiveTab] = useState("requests");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    filterUsers();
  }, [searchQuery, users]);

  const loadData = async (isRefreshing = false) => {
    if (isRefreshing) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    await Promise.all([loadRequests(), loadUsers()]);

    if (isRefreshing) {
      setRefreshing(false);
    } else {
      setLoading(false);
    }
  };

  const loadRequests = async () => {
    const result = await ApprovalService.getPendingRequests();
    if (result.success) {
      setRequests(result.data || []);
    }
  };

  const loadUsers = async () => {
    try {
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Erro ao carregar usuários:", error);
        return;
      }

      setUsers(data || []);
    } catch (error) {
      console.error("Erro ao carregar usuários:", error);
    }
  };

  const filterUsers = () => {
    if (!searchQuery.trim()) {
      setFilteredUsers(users);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = users.filter(
      (user) =>
        user.name?.toLowerCase().includes(query) ||
        user.email?.toLowerCase().includes(query) ||
        user.phone?.includes(query) ||
        user.sector?.toLowerCase().includes(query),
    );
    setFilteredUsers(filtered);
  };

  const exportUsers = async () => {
    try {
      const csv = generateCSV(filteredUsers);

      await Share.share({
        message: csv,
        title: "Lista de Usuários - Frontiers",
      });
    } catch (error) {
      console.error("Erro ao exportar:", error);
      Alert.alert("Erro", "Não foi possível exportar a lista");
    }
  };

  const generateCSV = (data) => {
    const headers =
      "Nome,Email,Telefone,Setor,Status,Admin,Cadastro,Último Acesso\n";
    const rows = data
      .map((user) => {
        const isActive = user.is_active || user.active;
        const lastAccess = user.last_login_at
          ? new Date(user.last_login_at).toLocaleDateString("pt-BR")
          : "Nunca";

        return [
          user.name || "",
          user.email || "",
          user.phone || "",
          user.sector || "",
          isActive ? "Ativo" : "Inativo",
          user.is_admin ? "Sim" : "Não",
          new Date(user.created_at).toLocaleDateString("pt-BR"),
          lastAccess,
        ].join(",");
      })
      .join("\n");

    return headers + rows;
  };

  const handleApprove = (request) => {
    if (!request.password) {
      Alert.alert(
        "Erro",
        "Esta solicitação não possui senha. Peça ao usuário para solicitar acesso novamente.",
      );
      return;
    }

    Alert.alert(
      "Confirmar Aprovação",
      `Deseja aprovar o acesso de ${request.name}?\n\n` +
        `📧 Email: ${request.email}\n` +
        `📱 Telefone: ${request.phone}\n` +
        `👥 Setor: ${request.sector}\n\n` +
        `A senha foi definida pelo usuário na solicitação.`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Aprovar",
          onPress: () => confirmApproval(request),
        },
      ],
    );
  };

  const confirmApproval = async (request) => {
    setProcessingId(request.id);
    const result = await ApprovalService.approveRequest(request);
    setProcessingId(null);

    if (result.success) {
      Alert.alert(
        "Sucesso!",
        `Usuário ${request.name} foi aprovado com sucesso!\n\n` +
          `✅ Adicionado ao setor: ${request.sector}\n` +
          `✅ Pode fazer login com telefone e senha cadastrados\n\n` +
          `⚠️ O usuário precisará trocar a senha no primeiro login.`,
        [{ text: "OK", onPress: () => loadData() }],
      );
    } else {
      Alert.alert("Erro", result.message);
    }
  };

  const handleReject = (request) => {
    Alert.alert(
      "Confirmar Rejeição",
      `Deseja rejeitar a solicitação de ${request.name}?`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Rejeitar",
          style: "destructive",
          onPress: async () => {
            setProcessingId(request.id);
            const result = await ApprovalService.rejectRequest(request.id);
            setProcessingId(null);

            if (result.success) {
              Alert.alert("Sucesso", result.message);
              loadData();
            } else {
              Alert.alert("Erro", result.message);
            }
          },
        },
      ],
    );
  };

  const toggleUserStatus = async (userId, currentStatus, userName) => {
    const newStatus = !currentStatus;
    const action = newStatus ? "ativar" : "inativar";

    Alert.alert(
      `${action.charAt(0).toUpperCase() + action.slice(1)} Usuário`,
      `Deseja ${action} ${userName}?`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: action.charAt(0).toUpperCase() + action.slice(1),
          onPress: async () => {
            try {
              const { error } = await supabase
                .from("users")
                .update({
                  is_active: newStatus,
                  active: newStatus,
                })
                .eq("id", userId);

              if (error) throw error;

              Alert.alert(
                "Sucesso",
                `Usuário ${newStatus ? "ativado" : "inativado"} com sucesso`,
              );
              loadUsers();
            } catch (error) {
              console.error("Erro ao alterar status:", error);
              Alert.alert(
                "Erro",
                "Não foi possível alterar o status do usuário",
              );
            }
          },
        },
      ],
    );
  };

  const getLastAccessText = (lastLogin) => {
    if (!lastLogin) {
      return "Nunca acessou";
    }

    const now = new Date();
    const login = new Date(lastLogin);
    const diffTime = Math.abs(now - login);
    const diffMinutes = Math.ceil(diffTime / (1000 * 60));
    const diffHours = Math.ceil(diffTime / (1000 * 60 * 60));
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffMinutes < 60) return `${diffMinutes} min atrás`;
    if (diffHours < 24) return `${diffHours}h atrás`;
    if (diffDays === 1) return "Ontem";
    if (diffDays < 7) return `${diffDays} dias atrás`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} semanas atrás`;
    return `${Math.floor(diffDays / 30)} meses atrás`;
  };

  const renderRequest = ({ item }) => {
    const isProcessing = processingId === item.id;

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.name}>{item.name}</Text>
          <View style={styles.sectorBadge}>
            <Users size={12} color="#0047AB" />
            <Text style={styles.sectorText}>{item.sector}</Text>
          </View>
        </View>

        <View style={styles.cardBody}>
          <View style={styles.infoRow}>
            <Mail size={14} color="#666" />
            <Text style={styles.infoText}>{item.email}</Text>
          </View>
          <View style={styles.infoRow}>
            <Phone size={14} color="#666" />
            <Text style={styles.infoText}>{item.phone}</Text>
          </View>
        </View>

        <View style={styles.cardFooter}>
          <Text style={styles.dateText}>
            Solicitado em:{" "}
            {new Date(item.created_at).toLocaleDateString("pt-BR")}
          </Text>

          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.button, styles.rejectButton]}
              onPress={() => handleReject(item)}
              disabled={isProcessing}
            >
              {isProcessing ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <X size={16} color="#fff" />
                  <Text style={styles.buttonText}>Rejeitar</Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.approveButton]}
              onPress={() => handleApprove(item)}
              disabled={isProcessing}
            >
              {isProcessing ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <Check size={16} color="#fff" />
                  <Text style={styles.buttonText}>Aprovar</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  const renderUser = ({ item }) => {
    const isActive = item.is_active === true || item.active === true;

    return (
      <View style={styles.userCard}>
        <View style={styles.userHeader}>
          <View style={styles.userNameSection}>
            <Text style={styles.userName}>{item.name}</Text>
            {item.is_admin && (
              <View style={styles.adminBadge}>
                <Text style={styles.adminBadgeText}>ADMIN</Text>
              </View>
            )}
          </View>
          <View
            style={[
              styles.statusBadge,
              isActive ? styles.statusActive : styles.statusInactive,
            ]}
          >
            <Text style={styles.statusText}>
              {isActive ? "Ativo" : "Inativo"}
            </Text>
          </View>
        </View>

        <View style={styles.userBody}>
          <View style={styles.infoRow}>
            <Mail size={14} color="#666" />
            <Text style={styles.infoText}>{item.email}</Text>
          </View>
          <View style={styles.infoRow}>
            <Phone size={14} color="#666" />
            <Text style={styles.infoText}>{item.phone || "Não informado"}</Text>
          </View>
          <View style={styles.infoRow}>
            <Users size={14} color="#666" />
            <Text style={styles.infoText}>{item.sector || "Sem setor"}</Text>
          </View>
          <View style={styles.infoRow}>
            <Clock size={14} color="#666" />
            <Text style={styles.infoText}>
              Último acesso: {getLastAccessText(item.last_login_at)}
            </Text>
          </View>
        </View>

        <View style={styles.userFooter}>
          <TouchableOpacity
            style={[
              styles.toggleButton,
              isActive ? styles.deactivateButton : styles.activateButton,
            ]}
            onPress={() => toggleUserStatus(item.id, isActive, item.name)}
          >
            {isActive ? (
              <>
                <UserX size={16} color="#fff" />
                <Text style={styles.toggleButtonText}>Inativar</Text>
              </>
            ) : (
              <>
                <UserCheck size={16} color="#fff" />
                <Text style={styles.toggleButtonText}>Ativar</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.topBar}>
        <Image
          source={require("../../assets/frontiers.png")}
          style={styles.logoImage}
          resizeMode="contain"
        />
      </View>

      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === "requests" && styles.tabActive]}
          onPress={() => setActiveTab("requests")}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "requests" && styles.tabTextActive,
            ]}
          >
            Solicitações ({requests.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === "users" && styles.tabActive]}
          onPress={() => setActiveTab("users")}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "users" && styles.tabTextActive,
            ]}
          >
            Usuários ({filteredUsers.length})
          </Text>
        </TouchableOpacity>
      </View>

      {activeTab === "users" && (
        <View style={styles.searchContainer}>
          <View style={styles.searchBar}>
            <Search size={20} color="#999" />
            <TextInput
              style={styles.searchInput}
              placeholder="Buscar por nome, email, telefone ou setor..."
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
          <TouchableOpacity style={styles.exportButton} onPress={exportUsers}>
            <Download size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      )}

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0047AB" />
        </View>
      ) : (
        <>
          {activeTab === "requests" ? (
            requests.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>
                  Nenhuma solicitação pendente
                </Text>
              </View>
            ) : (
              <FlatList
                data={requests}
                keyExtractor={(item) => item.id}
                renderItem={renderRequest}
                contentContainerStyle={styles.list}
                refreshing={refreshing}
                onRefresh={() => loadData(true)}
              />
            )
          ) : filteredUsers.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>
                {searchQuery
                  ? "Nenhum usuário encontrado"
                  : "Nenhum usuário cadastrado"}
              </Text>
            </View>
          ) : (
            <FlatList
              data={filteredUsers}
              keyExtractor={(item) => item.id}
              renderItem={renderUser}
              contentContainerStyle={styles.list}
              refreshing={refreshing}
              onRefresh={() => loadData(true)}
            />
          )}
        </>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
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
    marginBottom: 10,
  },
  logoImage: {
    width: 200,
    height: 130,
  },
  tabs: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: "center",
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  tabActive: {
    borderBottomColor: "#0047AB",
  },
  tabText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#999",
  },
  tabTextActive: {
    color: "#0047AB",
  },
  searchContainer: {
    flexDirection: "row",
    padding: 16,
    gap: 8,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  searchBar: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
    borderRadius: 8,
    paddingHorizontal: 12,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 10,
    fontSize: 14,
    color: "#000",
  },
  exportButton: {
    backgroundColor: "#4CAF50",
    width: 44,
    height: 44,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyText: {
    fontSize: 16,
    color: "#999",
  },
  list: {
    padding: 16,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  name: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#000",
    flex: 1,
  },
  sectorBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#E3F2FD",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  sectorText: {
    fontSize: 12,
    color: "#0047AB",
    fontWeight: "600",
  },
  cardBody: {
    gap: 8,
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  infoText: {
    fontSize: 14,
    color: "#666",
    flex: 1,
  },
  cardFooter: {
    borderTopWidth: 1,
    borderTopColor: "#eee",
    paddingTop: 12,
  },
  dateText: {
    fontSize: 12,
    color: "#999",
    marginBottom: 12,
  },
  actions: {
    flexDirection: "row",
    gap: 8,
  },
  button: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 12,
    borderRadius: 8,
    gap: 4,
  },
  approveButton: {
    backgroundColor: "#4CAF50",
  },
  rejectButton: {
    backgroundColor: "#f44336",
  },
  buttonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 14,
  },
  userCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  userHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  userNameSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flex: 1,
  },
  userName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#000",
  },
  adminBadge: {
    backgroundColor: "#fcd030",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  adminBadgeText: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#000",
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusActive: {
    backgroundColor: "#d4edda",
  },
  statusInactive: {
    backgroundColor: "#f8d7da",
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
  },
  userBody: {
    gap: 8,
    marginBottom: 12,
  },
  userFooter: {
    borderTopWidth: 1,
    borderTopColor: "#eee",
    paddingTop: 12,
  },
  toggleButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 12,
    borderRadius: 8,
    gap: 6,
  },
  activateButton: {
    backgroundColor: "#4CAF50",
  },
  deactivateButton: {
    backgroundColor: "#fcd030",
  },
  toggleButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 14,
  },
});
