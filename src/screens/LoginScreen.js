import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ImageBackground,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useAuth } from "../contexts/AuthContext";

export default function LoginScreen({ navigation }) {
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleLogin = async () => {
    if (!phone || !password) {
      Alert.alert("Erro", "Por favor, preencha telefone e senha.");
      return;
    }

    // LOG TEMPORÁRIO - REMOVER DEPOIS
    console.log("📱 Tentando login com:", {
      phone: phone,
      phoneLength: phone.length,
      hasPassword: !!password,
    });

    setLoading(true);
    const result = await login(phone, password);
    setLoading(false);

    // LOG DO RESULTADO
    console.log("📋 Resultado do login:", result);

    if (!result.success) {
      Alert.alert("Erro de Acesso", result.message);
    }
  };

  return (
    <ImageBackground
      source={require("../../assets/fundo1.png")}
      style={styles.container}
      resizeMode="cover"
    >
      <View style={styles.overlay}>
        <View style={styles.header}>
          <Text style={styles.title}>Comunidade Frontiers</Text>
          <View style={styles.subtitleContainer}>
            <Text style={styles.subtitle}>Juntos para alcançar os primos</Text>
          </View>
        </View>

        <View style={styles.form}>
          <TextInput
            placeholder="Telefone (Celular)"
            placeholderTextColor="#999"
            keyboardType="phone-pad"
            value={phone}
            onChangeText={setPhone}
            style={styles.input}
            editable={!loading}
          />

          <TextInput
            placeholder="Senha"
            placeholderTextColor="#999"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
            style={styles.input}
            editable={!loading}
          />

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fcd030" />
            ) : (
              <Text style={styles.buttonText}>Entrar</Text>
            )}
          </TouchableOpacity>

          <View style={styles.divider}>
            <View style={styles.line} />
            <Text style={styles.dividerText}>OU</Text>
            <View style={styles.line} />
          </View>

          <TouchableOpacity
            style={styles.requestButton}
            onPress={() => navigation.navigate("RequestAccess")}
            disabled={loading}
          >
            <Text style={styles.requestButtonText}>Solicitar Acesso</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.footer}>v1.0.0 • 2026</Text>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  overlay: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.25)",
    padding: 24,
    justifyContent: "center",
  },

  header: {
    alignItems: "center",
    marginBottom: 48,
  },

  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#000000",
  },

  subtitleContainer: {
    backgroundColor: "rgba(0,0,0,0.4)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginTop: 8,
  },

  subtitle: {
    fontSize: 16,
    color: "#eafa0b",
    textAlign: "center",
  },

  form: {
    width: "100%",
  },

  input: {
    backgroundColor: "#f5f5f5",
    padding: 18,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    fontSize: 16,
    color: "#000000",
  },

  button: {
    backgroundColor: "#000000",
    padding: 18,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 8,
  },

  buttonDisabled: {
    opacity: 0.6,
  },

  buttonText: {
    color: "#fcd030",
    fontSize: 16,
    fontWeight: "bold",
  },

  divider: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 24,
  },

  line: {
    flex: 1,
    height: 1,
    backgroundColor: "#e0e0e0",
  },

  dividerText: {
    marginHorizontal: 16,
    color: "#999",
    fontWeight: "600",
  },

  requestButton: {
    backgroundColor: "#fcd030",
    padding: 18,
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#000000",
  },

  requestButtonText: {
    color: "#000000",
    fontSize: 16,
    fontWeight: "bold",
  },

  footer: {
    position: "absolute",
    bottom: 24,
    left: 0,
    right: 0,
    textAlign: "center",
    color: "#ccc",
    fontSize: 12,
  },
});
