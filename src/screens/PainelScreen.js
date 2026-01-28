import React, { useState, useCallback } from "react";
import { useFocusEffect } from "@react-navigation/native";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  TextInput,
  Modal,
  RefreshControl,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  Users,
  UserCheck,
  UserX,
  Calendar as CalendarIcon,
  Plus,
  Trash2,
  Edit,
} from "lucide-react-native";
import { supabase } from "../lib/supabase";
import { useAuth } from "../contexts/AuthContext";

export default function PainelScreen() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  // Estados de usuários
  const [totalUsers, setTotalUsers] = useState(0);
  const [activeUsers, setActiveUsers] = useState(0);
  const [inactiveUsers, setInactiveUsers] = useState(0);

  // Estado do versículo do dia
  const [verseOfTheDay, setVerseOfTheDay] = useState(null);
  const [loadingVerse, setLoadingVerse] = useState(true);

  // Estados de eventos
  const [events, setEvents] = useState([]);
  const [showEventModal, setShowEventModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [eventForm, setEventForm] = useState({
    title: "",
    description: "",
    event_date: "",
  });

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, []),
  );

  async function loadData(isRefreshing = false) {
    if (isRefreshing) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      await checkAdmin();
      await Promise.all([loadUserStats(), loadEvents(), loadVerseOfTheDay()]);
    } catch (err) {
      console.error("Erro ao carregar dados:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  async function checkAdmin() {
    if (!user?.id) return;

    try {
      const { data, error } = await supabase
        .from("users")
        .select("is_admin")
        .eq("id", user.id)
        .single();

      if (!error) {
        setIsAdmin(data?.is_admin === true);
      }
    } catch (err) {
      console.error("Erro ao verificar admin:", err);
    }
  }

  async function loadUserStats() {
    try {
      const { count: total } = await supabase
        .from("users")
        .select("*", { count: "exact", head: true });

      setTotalUsers(total || 0);

      const { count: active } = await supabase
        .from("users")
        .select("*", { count: "exact", head: true })
        .eq("is_active", true);

      setActiveUsers(active || total || 0);

      const { count: inactive } = await supabase
        .from("users")
        .select("*", { count: "exact", head: true })
        .eq("is_active", false);

      setInactiveUsers(inactive || 0);
    } catch (err) {
      console.error("Erro ao carregar estatísticas:", err);
    }
  }

  async function loadEvents() {
    try {
      const { data, error } = await supabase
        .from("important_dates")
        .select("*")
        .order("event_date", { ascending: true });

      if (!error) {
        setEvents(data || []);
      }
    } catch (err) {
      console.error("Erro ao carregar eventos:", err);
    }
  }

  async function loadVerseOfTheDay() {
    try {
      setLoadingVerse(true);

      // Pega a data atual no formato YYYY-MM-DD
      const today = new Date().toISOString().split("T")[0];

      // Busca o versículo do dia
      const { data, error } = await supabase
        .from("verse_of_the_day")
        .select("*")
        .eq("date", today)
        .single();

      if (error) {
        console.log("Nenhum versículo para hoje, buscando aleatório...");
        // Se não houver versículo para hoje, pega um aleatório
        const { data: randomVerse } = await supabase
          .from("verse_of_the_day")
          .select("*")
          .limit(1)
          .order("date", { ascending: false })
          .single();

        setVerseOfTheDay(randomVerse);
      } else {
        setVerseOfTheDay(data);
      }
    } catch (err) {
      console.error("Erro ao carregar versículo:", err);
    } finally {
      setLoadingVerse(false);
    }
  }

  const handleDateChange = (text) => {
    // Se o usuário estiver apagando, não aplica a máscara para não travar
    if (text.length < eventForm.event_date.length) {
      setEventForm({ ...eventForm, event_date: text });
      return;
    }

    // Remove tudo que não é dígito
    let cleaned = text.replace(/\D/g, "");

    // Limita a 8 dígitos (DDMMYYYY)
    if (cleaned.length > 8) cleaned = cleaned.slice(0, 8);

    // Aplica a máscara DD/MM/YYYY
    let formatted = "";
    for (let i = 0; i < cleaned.length; i++) {
      if (i === 2 || i === 4) {
        formatted += "/";
      }
      formatted += cleaned[i];
    }

    setEventForm({ ...eventForm, event_date: formatted });
  };

  function openEventModal(event = null) {
    if (event) {
      setEditingEvent(event);
      const [year, month, day] = event.event_date.split("-");
      const formattedDate = `${day}/${month}/${year}`;
      setEventForm({
        title: event.title,
        description: event.description || "",
        event_date: formattedDate,
      });
    } else {
      setEditingEvent(null);
      setEventForm({
        title: "",
        description: "",
        event_date: "",
      });
    }
    setShowEventModal(true);
  }

  async function handleSaveEvent() {
    if (!eventForm.title || !eventForm.event_date) {
      Alert.alert("Erro", "Preencha o título e a data do evento.");
      return;
    }

    const dateRegex = /^(\d{2})\/(\d{2})\/(\d{4})$/;
    const match = eventForm.event_date.match(dateRegex);

    if (!match) {
      Alert.alert("Erro", "Use o formato DD/MM/AAAA para a data.");
      return;
    }

    const [, day, month, year] = match;
    const formattedDate = `${year}-${month}-${day}`;

    try {
      if (editingEvent) {
        const { error } = await supabase
          .from("important_dates")
          .update({
            title: eventForm.title,
            description: eventForm.description,
            event_date: formattedDate,
          })
          .eq("id", editingEvent.id);

        if (error) throw error;
        Alert.alert("Sucesso", "Evento atualizado!");
      } else {
        const { error } = await supabase.from("important_dates").insert({
          title: eventForm.title,
          description: eventForm.description,
          event_date: formattedDate,
        });

        if (error) throw error;
        Alert.alert("Sucesso", "Evento criado!");
      }

      setShowEventModal(false);
      loadEvents();
    } catch (err) {
      console.error("Erro ao salvar evento:", err);
      Alert.alert("Erro", "Não foi possível salvar o evento.");
    }
  }

  async function handleDeleteEvent(eventId) {
    Alert.alert(
      "Excluir Evento",
      "Tem certeza que deseja excluir este evento?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Excluir",
          style: "destructive",
          onPress: async () => {
            try {
              const { error } = await supabase
                .from("important_dates")
                .delete()
                .eq("id", eventId);

              if (error) throw error;
              Alert.alert("Sucesso", "Evento excluído!");
              loadEvents();
            } catch (err) {
              Alert.alert("Erro", "Não foi possível excluir o evento.");
            }
          },
        },
      ],
    );
  }

  function formatDate(dateString) {
    const [year, month, day] = dateString.split("-");
    const months = [
      "Jan",
      "Fev",
      "Mar",
      "Abr",
      "Mai",
      "Jun",
      "Jul",
      "Ago",
      "Set",
      "Out",
      "Nov",
      "Dez",
    ];
    return { day, month: months[parseInt(month) - 1] };
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#000" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <View style={styles.topBar}>
          <Image
            source={require("../../assets/frontiers.png")}
            style={styles.logoImage}
            resizeMode="contain"
          />
        </View>

        <ScrollView
          style={styles.container}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => loadData(true)}
              tintColor="#000"
            />
          }
        >
          <View style={styles.header}>
            <Text style={styles.title}>Painel Geral</Text>
            <Text style={styles.subtitle}>
              Estatísticas e eventos importantes
            </Text>
          </View>

          {/* Estatísticas de Usuários */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Usuários</Text>
            <View style={styles.statsGrid}>
              <View style={[styles.statCard, styles.statCardTotal]}>
                <Users size={24} color="#fff" />
                <Text style={styles.statNumber}>{totalUsers}</Text>
                <Text style={styles.statLabel}>Total</Text>
              </View>
              <View style={[styles.statCard, styles.statCardActive]}>
                <UserCheck size={24} color="#fff" />
                <Text style={styles.statNumber}>{activeUsers}</Text>
                <Text style={styles.statLabel}>Ativos</Text>
              </View>
              <View style={[styles.statCard, styles.statCardInactive]}>
                <UserX size={24} color="#fff" />
                <Text style={styles.statNumber}>{inactiveUsers}</Text>
                <Text style={styles.statLabel}>Inativos</Text>
              </View>
            </View>
          </View>

          {/* Versículo do Dia */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Versículo do Dia</Text>
            {loadingVerse ? (
              <View style={styles.verseCard}>
                <ActivityIndicator size="small" color="#0047AB" />
              </View>
            ) : verseOfTheDay ? (
              <View style={styles.verseCard}>
                <Text style={styles.verseText}>"{verseOfTheDay.text}"</Text>
                <Text style={styles.verseReference}>
                  {verseOfTheDay.reference}
                </Text>
              </View>
            ) : (
              <View style={styles.verseCard}>
                <Text style={styles.verseText}>
                  "O Senhor é o meu pastor, nada me faltará."
                </Text>
                <Text style={styles.verseReference}>Salmos 23:1</Text>
              </View>
            )}
          </View>

          {/* Eventos Importantes */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Datas Importantes</Text>
              {isAdmin && (
                <TouchableOpacity
                  style={styles.addButton}
                  onPress={() => openEventModal()}
                >
                  <Plus size={20} color="#fcd030" />
                </TouchableOpacity>
              )}
            </View>

            {events.length > 0 ? (
              events.map((event) => {
                const { day, month } = formatDate(event.event_date);
                return (
                  <View key={event.id} style={styles.eventCard}>
                    <View style={styles.eventDate}>
                      <Text style={styles.eventDay}>{day}</Text>
                      <Text style={styles.eventMonth}>{month}</Text>
                    </View>
                    <View style={styles.eventInfo}>
                      <Text style={styles.eventTitle}>{event.title}</Text>
                      {event.description && (
                        <Text style={styles.eventDescription}>
                          {event.description}
                        </Text>
                      )}
                    </View>
                    {isAdmin && (
                      <View style={styles.eventActions}>
                        <TouchableOpacity
                          style={styles.eventActionButton}
                          onPress={() => openEventModal(event)}
                        >
                          <Edit size={18} color="#000" />
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.eventActionButton}
                          onPress={() => handleDeleteEvent(event.id)}
                        >
                          <Trash2 size={18} color="#e74c3c" />
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                );
              })
            ) : (
              <View style={styles.emptyState}>
                <CalendarIcon size={40} color="#ccc" />
                <Text style={styles.emptyText}>Nenhum evento programado</Text>
              </View>
            )}
          </View>
        </ScrollView>
      </View>

      {/* Modal de Evento */}
      <Modal
        visible={showEventModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowEventModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {editingEvent ? "Editar Evento" : "Novo Evento"}
            </Text>

            <TextInput
              style={styles.input}
              placeholder="Título do Evento"
              value={eventForm.title}
              onChangeText={(text) =>
                setEventForm({ ...eventForm, title: text })
              }
            />

            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Descrição (opcional)"
              value={eventForm.description}
              onChangeText={(text) =>
                setEventForm({ ...eventForm, description: text })
              }
              multiline
              numberOfLines={3}
            />

            <TextInput
              style={styles.input}
              placeholder="Data (DD/MM/AAAA)"
              value={eventForm.event_date}
              onChangeText={handleDateChange}
              keyboardType="numeric"
              maxLength={10}
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowEventModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={handleSaveEvent}
              >
                <Text style={styles.saveButtonText}>Salvar</Text>
              </TouchableOpacity>
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
  container: {
    flex: 1,
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
    marginBottom: 20,
  },
  logoImage: {
    width: 200,
    height: 130,
  },
  scrollContent: {
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: "#000",
  },
  subtitle: {
    fontSize: 15,
    color: "#777",
    marginTop: 4,
  },
  section: {
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#000",
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: "row",
    gap: 12,
  },
  statCard: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    gap: 8,
  },
  statCardTotal: {
    backgroundColor: "#000",
  },
  statCardActive: {
    backgroundColor: "#fcd030",
  },
  statCardInactive: {
    backgroundColor: "#e74c3c",
  },
  statNumber: {
    fontSize: 28,
    fontWeight: "800",
    color: "#fff",
  },
  statLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#fff",
    opacity: 0.9,
  },
  addButton: {
    backgroundColor: "#000",
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  eventCard: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    borderWidth: 1,
    borderColor: "#eee",
  },
  eventDate: {
    backgroundColor: "#fcd030",
    width: 60,
    height: 60,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  eventDay: {
    fontSize: 24,
    fontWeight: "800",
    color: "#000",
  },
  eventMonth: {
    fontSize: 12,
    fontWeight: "600",
    color: "#000",
    textTransform: "uppercase",
  },
  eventInfo: {
    flex: 1,
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#000",
    marginBottom: 4,
  },
  eventDescription: {
    fontSize: 14,
    color: "#666",
  },
  eventActions: {
    flexDirection: "row",
    gap: 8,
  },
  eventActionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#f5f5f5",
    justifyContent: "center",
    alignItems: "center",
  },
  emptyState: {
    alignItems: "center",
    padding: 32,
    gap: 8,
  },
  emptyText: {
    fontSize: 15,
    color: "#999",
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
    padding: 24,
    width: "100%",
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#000",
    marginBottom: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
    marginBottom: 16,
    backgroundColor: "#f9f9f9",
  },
  textArea: {
    height: 80,
    textAlignVertical: "top",
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
  saveButton: {
    backgroundColor: "#000",
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fcd030",
  },

  verseCard: {
    backgroundColor: "#000",
    borderRadius: 16,
    padding: 24,
    borderWidth: 2,
    borderColor: "#fcd030",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  verseText: {
    fontSize: 17,
    lineHeight: 26,
    color: "#fff",
    fontStyle: "italic",
    marginBottom: 16,
    textAlign: "center",
  },
  verseReference: {
    fontSize: 15,
    fontWeight: "bold",
    color: "#fcd030",
    textAlign: "center",
  },
});