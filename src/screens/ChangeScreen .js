import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ImageBackground,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { Lock, Eye, EyeOff } from 'lucide-react-native';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export default function ChangePasswordScreen({ navigation }) {
  const { user, logout } = useAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const validatePassword = (password) => {
    if (password.length < 6) {
      return 'A senha deve ter no mínimo 6 caracteres';
    }
    return null;
  };

  const handleChangePassword = async () => {
    // Validações
    if (!currentPassword || !newPassword || !confirmPassword) {
      Alert.alert('Erro', 'Por favor, preencha todos os campos.');
      return;
    }

    const passwordError = validatePassword(newPassword);
    if (passwordError) {
      Alert.alert('Erro', passwordError);
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert('Erro', 'As senhas não coincidem.');
      return;
    }

    if (newPassword === currentPassword) {
      Alert.alert('Erro', 'A nova senha deve ser diferente da senha atual.');
      return;
    }

    setLoading(true);

    try {
      // Atualizar senha no Supabase Auth
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (updateError) {
        throw updateError;
      }

      // Remover flag de mudança obrigatória de senha
      if (user?.id) {
        await supabase
          .from('users')
          .update({ must_change_password: false })
          .eq('id', user.id);
      }

      Alert.alert(
        'Sucesso!',
        'Sua senha foi alterada com sucesso. Faça login novamente com a nova senha.',
        [
          {
            text: 'OK',
            onPress: async () => {
              await logout();
              navigation.reset({
                index: 0,
                routes: [{ name: 'Login' }],
              });
            },
          },
        ]
      );
    } catch (error) {
      console.error('Erro ao alterar senha:', error);
      Alert.alert(
        'Erro',
        error.message || 'Não foi possível alterar a senha. Tente novamente.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <ImageBackground
      source={require('../../assets/background.png')}
      style={styles.container}
      resizeMode="cover"
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.overlay}>
            <View style={styles.header}>
              <Lock size={64} color="#000" />
              <Text style={styles.title}>Alterar Senha</Text>
              <View style={styles.subtitleContainer}>
                <Text style={styles.subtitle}>
                  Por segurança, altere sua senha
                </Text>
              </View>
            </View>

            <View style={styles.alertBox}>
              <Text style={styles.alertText}>
                ⚠️ Você está usando uma senha temporária. Por motivos de segurança, é necessário criar uma nova senha.
              </Text>
            </View>

            <View style={styles.form}>
              {/* Senha Atual */}
              <View style={styles.inputContainer}>
                <TextInput
                  placeholder="Senha Atual (Temporária)"
                  placeholderTextColor="#999"
                  secureTextEntry={!showCurrentPassword}
                  value={currentPassword}
                  onChangeText={setCurrentPassword}
                  style={styles.input}
                  editable={!loading}
                />
                <TouchableOpacity
                  style={styles.eyeButton}
                  onPress={() => setShowCurrentPassword(!showCurrentPassword)}
                >
                  {showCurrentPassword ? (
                    <EyeOff size={20} color="#666" />
                  ) : (
                    <Eye size={20} color="#666" />
                  )}
                </TouchableOpacity>
              </View>

              {/* Nova Senha */}
              <View style={styles.inputContainer}>
                <TextInput
                  placeholder="Nova Senha (mínimo 6 caracteres)"
                  placeholderTextColor="#999"
                  secureTextEntry={!showNewPassword}
                  value={newPassword}
                  onChangeText={setNewPassword}
                  style={styles.input}
                  editable={!loading}
                />
                <TouchableOpacity
                  style={styles.eyeButton}
                  onPress={() => setShowNewPassword(!showNewPassword)}
                >
                  {showNewPassword ? (
                    <EyeOff size={20} color="#666" />
                  ) : (
                    <Eye size={20} color="#666" />
                  )}
                </TouchableOpacity>
              </View>

              {/* Confirmar Nova Senha */}
              <View style={styles.inputContainer}>
                <TextInput
                  placeholder="Confirmar Nova Senha"
                  placeholderTextColor="#999"
                  secureTextEntry={!showConfirmPassword}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  style={styles.input}
                  editable={!loading}
                />
                <TouchableOpacity
                  style={styles.eyeButton}
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? (
                    <EyeOff size={20} color="#666" />
                  ) : (
                    <Eye size={20} color="#666" />
                  )}
                </TouchableOpacity>
              </View>

              <View style={styles.passwordRequirements}>
                <Text style={styles.requirementTitle}>Requisitos da senha:</Text>
                <Text style={styles.requirementText}>• Mínimo de 6 caracteres</Text>
                <Text style={styles.requirementText}>• Diferente da senha atual</Text>
              </View>

              <TouchableOpacity
                style={[styles.button, loading && styles.buttonDisabled]}
                onPress={handleChangePassword}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#fcd030" />
                ) : (
                  <Text style={styles.buttonText}>Alterar Senha</Text>
                )}
              </TouchableOpacity>
            </View>

            <Text style={styles.footer}>
              Escolha uma senha forte e única
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  scrollContent: {
    flexGrow: 1,
  },

  overlay: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.25)',
    padding: 24,
    justifyContent: 'center',
  },

  header: {
    alignItems: 'center',
    marginBottom: 24,
  },

  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#000000',
    marginTop: 16,
  },

  subtitleContainer: {
    backgroundColor: 'rgba(0,0,0,0.4)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginTop: 8,
  },

  subtitle: {
    fontSize: 16,
    color: '#eafa0b',
    textAlign: 'center',
  },

  alertBox: {
    backgroundColor: 'rgba(255,193,7,0.2)',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    borderLeftWidth: 4,
    borderLeftColor: '#ffc107',
  },

  alertText: {
    fontSize: 14,
    color: '#000',
    lineHeight: 20,
  },

  form: {
    width: '100%',
  },

  inputContainer: {
    position: 'relative',
    marginBottom: 16,
  },

  input: {
    backgroundColor: '#f5f5f5',
    padding: 18,
    paddingRight: 50,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    fontSize: 16,
    color: '#000000',
  },

  eyeButton: {
    position: 'absolute',
    right: 16,
    top: 18,
  },

  passwordRequirements: {
    backgroundColor: 'rgba(255,255,255,0.9)',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },

  requirementTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
  },

  requirementText: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },

  button: {
    backgroundColor: '#000000',
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },

  buttonDisabled: {
    opacity: 0.6,
  },

  buttonText: {
    color: '#fcd030',
    fontSize: 16,
    fontWeight: 'bold',
  },

  footer: {
    marginTop: 24,
    textAlign: 'center',
    color: '#666',
    fontSize: 12,
  },
});