import React, { useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { ArrowLeft } from "lucide-react-native";
import { useAuth } from "../contexts/AuthContext";

const sectors = [
  "ACT",
  "Intercessão",
  "Mobilização",
  "Comunicação",
  "Envio",
  "Saúde Integral",
  "Jurídico",
  "TI",
  "Financeiro",
  "Gestão de Voluntários",
  "Projetos Especiais",
];

export default function RequestAccessScreen({ navigation }) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [selectedSector, setSelectedSector] = useState("");
  const [loading, setLoading] = useState(false);
  const { requestAccess } = useAuth();

  const handleSubmit = async () => {
    if (!name || !phone || !email || !selectedSector) {
      Alert.alert("Erro", "Por favor, preencha todos os campos.");
      return;
    }

    if (!password || !confirmPassword) {
      Alert.alert("Erro", "Preencha a senha e a confirmação.");
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert("Erro", "As senhas não conferem.");
      return;
    }

    if (password.length < 6) {
      Alert.alert("Erro", "A senha deve ter pelo menos 6 caracteres.");
      return;
    }

    setLoading(true);
    const result = await requestAccess({
      name,
      phone,
      email,
      group: selectedSector,
      password,
    });
    setLoading(false);

    if (result.success) {
      Alert.alert("Sucesso", result.message, [
        { text: "OK", onPress: () => navigation.goBack() },
      ]);
    } else {
      Alert.alert("Erro", result.message);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <ArrowLeft size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.title}>Solicitar Acesso</Text>
        <View style={{ width: 24 }} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.description}>
            Preencha o formulário abaixo para solicitar acesso à plataforma.
          </Text>

          <View style={styles.form}>
            <View style={styles.formGroup}>
              <Text style={styles.label}>Nome Completo</Text>
              <TextInput
                placeholder="Seu nome"
                placeholderTextColor="#999"
                value={name}
                onChangeText={setName}
                style={styles.input}
                editable={!loading}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Telefone</Text>
              <TextInput
                placeholder="(00) 99999-9999"
                placeholderTextColor="#999"
                keyboardType="phone-pad"
                value={phone}
                onChangeText={setPhone}
                style={styles.input}
                editable={!loading}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                placeholder="seu.email@exemplo.com"
                placeholderTextColor="#999"
                keyboardType="email-address"
                value={email}
                onChangeText={setEmail}
                style={styles.input}
                editable={!loading}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Senha</Text>
              <TextInput
                placeholder="Senha"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                style={styles.input}
                editable={!loading}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Confirme sua Senha</Text>
              <TextInput
                placeholder="Confirmar senha"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
                style={styles.input}
                editable={!loading}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Setor</Text>
              <View style={styles.sectorContainer}>
                {sectors.map((sector) => (
                  <TouchableOpacity
                    key={sector}
                    style={[
                      styles.sectorButton,
                      selectedSector === sector && styles.sectorButtonActive,
                    ]}
                    onPress={() => setSelectedSector(sector)}
                    disabled={loading}
                  >
                    <Text
                      style={[
                        styles.sectorButtonText,
                        selectedSector === sector &&
                          styles.sectorButtonTextActive,
                      ]}
                    >
                      {sector}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <TouchableOpacity
              style={[
                styles.submitButton,
                loading && styles.submitButtonDisabled,
              ]}
              onPress={handleSubmit}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#000" />
              ) : (
                <Text style={styles.submitButtonText}>Enviar Solicitação</Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#f9f9f9",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#ffffff",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#000",
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40, // Espaço extra no final
  },
  description: {
    fontSize: 14,
    color: "#666",
    marginBottom: 20,
    lineHeight: 20,
  },
  form: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 20, // Espaço extra
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#000",
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 14,
    color: "#000",
    backgroundColor: "#f5f5f5",
  },
  sectorContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  sectorButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    backgroundColor: "#f5f5f5",
  },
  sectorButtonActive: {
    backgroundColor: "#0047AB",
    borderColor: "#0047AB",
  },
  sectorButtonText: {
    fontSize: 12,
    color: "#666",
    fontWeight: "500",
  },
  sectorButtonTextActive: {
    color: "#ffffff",
  },
  submitButton: {
    backgroundColor: "#fcd030",
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 8,
    borderWidth: 1,
    borderColor: "#000",
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: "#000",
    fontSize: 16,
    fontWeight: "bold",
  },
});
