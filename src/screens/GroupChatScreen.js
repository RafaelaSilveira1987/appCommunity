import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ArrowLeft, Send } from "lucide-react-native";
import { supabase } from "../lib/supabase";
import { useAuth } from "../contexts/AuthContext";
import { sectorColors } from "../utils/sectorColors";

export default function GroupChatScreen({ route, navigation }) {
  const { group } = route?.params || {};
  const { user } = useAuth();

  if (!group) {
    return (
      <SafeAreaView
        style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
      >
        <Text>Erro ao carregar chat</Text>
      </SafeAreaView>
    );
  }

  const color = sectorColors[group.name] || "#0047AB";
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [userName, setUserName] = useState("");
  const [userSector, setUserSector] = useState("");
  const flatListRef = useRef(null);

  useEffect(() => {
    loadUserData();
    loadMessages();

    // Subscription para mensagens em tempo real
    const channel = supabase
      .channel(`group_chat:${group.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "group_messages",
          filter: `group_id=eq.${group.id}`,
        },
        async (payload) => {
          console.log("Nova mensagem recebida:", payload);

          // Se for minha mensagem, já adiciona com meus dados
          if (payload.new.user_id === user.id) {
            const messageWithProfile = {
              ...payload.new,
              profiles: {
                name: userName,
                sector: userSector,
              },
            };

            setMessages((prev) => {
              // Evitar duplicatas
              const exists = prev.some(
                (msg) => msg.id === messageWithProfile.id,
              );
              if (exists) return prev;
              return [messageWithProfile, ...prev];
            });
          } else {
            // Buscar dados do perfil do remetente
            const { data: profileData } = await supabase
              .from("users")
              .select("name, sector")
              .eq("id", payload.new.user_id)
              .single();

            const messageWithProfile = {
              ...payload.new,
              profiles: profileData,
            };

            setMessages((prev) => {
              // Evitar duplicatas
              const exists = prev.some(
                (msg) => msg.id === messageWithProfile.id,
              );
              if (exists) return prev;
              return [messageWithProfile, ...prev];
            });
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [group.id, userName, userSector]);

  async function loadUserData() {
    try {
      const { data, error } = await supabase
        .from("users")
        .select("name, sector")
        .eq("id", user.id)
        .single();

      if (!error && data) {
        setUserName(data.name);
        setUserSector(data.sector);
      }
    } catch (err) {
      console.error("Erro ao carregar dados do usuário:", err);
    }
  }

  async function loadMessages() {
    const { data, error } = await supabase
      .from("group_messages")
      .select(
        `
        *,
        profiles:user_id (
          name,
          sector
        )
      `,
      )
      .eq("group_id", group.id)
      .order("created_at", { ascending: false })
      .limit(50);

    if (!error && data) {
      setMessages(data);
    }
  }

  async function onRefresh() {
    setRefreshing(true);
    await loadMessages();
    setRefreshing(false);
  }

  async function sendMessage() {
    if (!newMessage.trim()) return;

    const messageContent = newMessage.trim();
    setNewMessage(""); // Limpa imediatamente para melhor UX
    Keyboard.dismiss();

    const { data, error } = await supabase
      .from("group_messages")
      .insert([
        {
          group_id: group.id,
          user_id: user.id,
          content: messageContent,
        },
      ])
      .select()
      .single();

    if (error) {
      console.error("Erro ao enviar mensagem:", error);
      // Reverter em caso de erro
      setNewMessage(messageContent);
      alert("Erro ao enviar mensagem. Tente novamente.");
    }
    // O realtime vai adicionar a mensagem automaticamente
  }

  const renderMessage = ({ item }) => {
    const isMyMessage = item.user_id === user.id;
    const senderName = item.profiles?.name || "Usuário";
    const senderSector = item.profiles?.sector || "";

    return (
      <View
        style={[
          styles.messageContainer,
          isMyMessage ? styles.myMessage : styles.otherMessage,
        ]}
      >
        {!isMyMessage && (
          <Text style={styles.senderName}>
            {senderName} • {senderSector}
          </Text>
        )}
        <Text style={[styles.messageText, isMyMessage && styles.myMessageText]}>
          {item.content}
        </Text>
        <Text style={[styles.messageTime, isMyMessage && styles.myMessageTime]}>
          {new Date(item.created_at).toLocaleTimeString("pt-BR", {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: color }]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <ArrowLeft color="#fff" size={24} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>{group.name}</Text>
          <Text style={styles.headerSubtitle}>Chat do grupo</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
      >
        {/* Lista de mensagens */}
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={renderMessage}
          inverted
          contentContainerStyle={styles.messagesList}
          onRefresh={onRefresh}
          refreshing={refreshing}
          ListEmptyComponent={() => (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>
                Nenhuma mensagem ainda. Seja o primeiro a escrever!
              </Text>
            </View>
          )}
        />

        {/* Input de mensagem */}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Digite sua mensagem..."
            placeholderTextColor="#999"
            value={newMessage}
            onChangeText={setNewMessage}
            multiline
            maxLength={500}
            returnKeyType="send"
            blurOnSubmit={false}
            onSubmitEditing={sendMessage}
          />
          <TouchableOpacity
            style={[
              styles.sendButton,
              { backgroundColor: newMessage.trim() ? color : "#ccc" },
            ]}
            onPress={sendMessage}
            disabled={!newMessage.trim()}
          >
            <Send size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },

  backButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "flex-start",
  },

  headerCenter: {
    flex: 1,
    alignItems: "center",
  },

  headerTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
  },

  headerSubtitle: {
    color: "#fff",
    fontSize: 12,
    opacity: 0.9,
    marginTop: 2,
  },

  messagesList: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexGrow: 1,
  },

  messageContainer: {
    maxWidth: "75%",
    marginVertical: 4,
    padding: 12,
    borderRadius: 12,
  },

  myMessage: {
    alignSelf: "flex-end",
    backgroundColor: "#494d53",
  },

  otherMessage: {
    alignSelf: "flex-start",
    backgroundColor: "#fff",
    elevation: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },

  senderName: {
    fontSize: 11,
    fontWeight: "700",
    color: "#666",
    marginBottom: 4,
  },

  messageText: {
    fontSize: 15,
    color: "#000",
    lineHeight: 20,
  },

  myMessageText: {
    color: "#fff",
  },

  messageTime: {
    fontSize: 10,
    color: "#999",
    marginTop: 4,
    alignSelf: "flex-end",
  },

  myMessageTime: {
    color: "#ffffff",
    opacity: 0.8,
  },

  inputContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    padding: 12,
    paddingBottom: Platform.OS === "ios" ? 12 : 8,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
  },

  input: {
    flex: 1,
    backgroundColor: "#f5f5f5",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 10,
    marginRight: 8,
    maxHeight: 100,
    fontSize: 15,
    color: "#000",
  },

  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },

  emptyContainer: {
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 40,
  },

  emptyText: {
    color: "#999",
    fontSize: 14,
    textAlign: "center",
  },
});
