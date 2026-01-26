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
import { ArrowLeft } from 'lucide-react-native';
import { supabase } from '../lib/supabase';

export default function ForgotPasswordScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const generateTemporaryPassword = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let password = '';
    for (let i = 0; i < 8; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  };

  const handleResetPassword = async () => {
    if (!email) {
      Alert.alert('Erro', 'Por favor, informe seu e-mail.');
      return;
    }

    // Validação básica de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert('Erro', 'Por favor, informe um e-mail válido.');
      return;
    }

    setLoading(true);

    try {
      // Verificar se o email existe no banco
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id, name, email')
        .eq('email', email.toLowerCase().trim())
        .single();

      if (userError || !userData) {
        Alert.alert(
          'E-mail não encontrado',
          'Não encontramos nenhum usuário cadastrado com este e-mail.'
        );
        setLoading(false);
        return;
      }

      // Gerar senha temporária
      const tempPassword = generateTemporaryPassword();

      // Atualizar senha no Supabase Auth
      const { error: resetError } = await supabase.auth.admin.updateUserById(
        userData.id,
        { password: tempPassword }
      );

      if (resetError) {
        console.error('Erro ao resetar senha:', resetError);
        
        // Tentar método alternativo usando o password reset nativo do Supabase
        const { error: emailError } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: 'frontiers://reset-password',
        });

        if (emailError) {
          throw emailError;
        }

        Alert.alert(
          'E-mail Enviado',
          'Um link para redefinir sua senha foi enviado para seu e-mail. Verifique sua caixa de entrada.',
          [
            {
              text: 'OK',
              onPress: () => navigation.goBack(),
            },
          ]
        );
        setLoading(false);
        return;
      }

      // Enviar email com a senha temporária (simulado - você precisará configurar um serviço real)
      // Por enquanto, vamos apenas mostrar em um alerta
      Alert.alert(
        'Senha Temporária Gerada',
        `Olá ${userData.name}!\n\nSua senha temporária é:\n\n${tempPassword}\n\nPor motivos de segurança, você será solicitado a alterar esta senha no primeiro login.\n\nIMPORTANTE: Anote esta senha antes de fechar esta mensagem!`,
        [
          {
            text: 'Copiar e Voltar',
            onPress: () => {
              // Aqui você poderia usar Clipboard.setString(tempPassword)
              // import * as Clipboard from 'expo-clipboard';
              // Clipboard.setString(tempPassword);
              navigation.goBack();
            },
          },
        ]
      );

      // Marcar que o usuário precisa trocar a senha
      await supabase
        .from('users')
        .update({ must_change_password: true })
        .eq('id', userData.id);

    } catch (error) {
      console.error('Erro ao recuperar senha:', error);
      Alert.alert(
        'Erro',
        'Não foi possível processar sua solicitação. Tente novamente mais tarde.'
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
            {/* Botão Voltar */}
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}
              disabled={loading}
            >
              <ArrowLeft size={24} color="#000" />
            </TouchableOpacity>

            <View style={styles.header}>
              <Text style={styles.title}>Recuperar Senha</Text>
              <View style={styles.subtitleContainer}>
                <Text style={styles.subtitle}>
                  Informe seu e-mail cadastrado
                </Text>
              </View>
            </View>

            <View style={styles.infoBox}>
              <Text style={styles.infoText}>
                Digite o e-mail que você usou no cadastro. Você receberá uma senha temporária que deverá ser alterada no primeiro acesso.
              </Text>
            </View>

            <View style={styles.form}>
              <TextInput
                placeholder="seu@email.com"
                placeholderTextColor="#999"
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
                style={styles.input}
                editable={!loading}
              />

              <TouchableOpacity
                style={[styles.button, loading && styles.buttonDisabled]}
                onPress={handleResetPassword}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#fcd030" />
                ) : (
                  <Text style={styles.buttonText}>Recuperar Senha</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => navigation.goBack()}
                disabled={loading}
              >
                <Text style={styles.cancelButtonText}>Voltar para Login</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.footer}>
              Em caso de problemas, entre em contato com o administrador
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

  backButton: {
    position: 'absolute',
    top: 48,
    left: 24,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },

  header: {
    alignItems: 'center',
    marginBottom: 24,
    marginTop: 60,
  },

  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#000000',
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

  infoBox: {
    backgroundColor: 'rgba(255,255,255,0.9)',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    borderLeftWidth: 4,
    borderLeftColor: '#fcd030',
  },

  infoText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },

  form: {
    width: '100%',
  },

  input: {
    backgroundColor: '#f5f5f5',
    padding: 18,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    fontSize: 16,
    color: '#000000',
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

  cancelButton: {
    backgroundColor: 'transparent',
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },

  cancelButtonText: {
    color: '#000000',
    fontSize: 14,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },

  footer: {
    position: 'absolute',
    bottom: 24,
    left: 24,
    right: 24,
    textAlign: 'center',
    color: '#666',
    fontSize: 12,
  },
});