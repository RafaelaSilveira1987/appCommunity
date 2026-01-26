import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export default function CreateGroupPostScreen({ route, navigation }) {
  const { group } = route.params;
  const { user } = useAuth();
  const [content, setContent] = useState('');

  const handlePublish = async () => {
    if (!content.trim()) {
      Alert.alert('Erro', 'Digite uma mensagem.');
      return;
    }

    // Inserir com todas as informações do autor
    const { error } = await supabase.from('group_posts').insert([
      {
        content,
        group_id: group.id,
        user_id: user.id,
        author_name: user.name || 'Usuário',
        sector: user.sector || '',
      },
    ]);

    if (error) {
      console.error(error);
      Alert.alert('Erro', 'Não foi possível publicar');
      return;
    }

    Alert.alert('Sucesso', 'Publicado no mural!');
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.back}>← Voltar</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Novo aviso</Text>
        <View style={{ width: 60 }} />
      </View>

      {/* Form */}
      <View style={styles.body}>
        <TextInput
          placeholder="Escreva a informação para o grupo..."
          value={content}
          onChangeText={setContent}
          style={styles.input}
          multiline
        />

        <TouchableOpacity style={styles.button} onPress={handlePublish}>
          <Text style={styles.buttonText}>Publicar no mural</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },

  topBar: {
    backgroundColor: '#000',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },

  back: { color: '#fcd030', fontWeight: 'bold' },
  title: { color: '#fff', fontWeight: 'bold' },

  body: { padding: 16 },

  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    padding: 16,
    minHeight: 140,
    textAlignVertical: 'top',
  },

  button: {
    backgroundColor: '#000',
    padding: 16,
    borderRadius: 12,
    marginTop: 16,
    alignItems: 'center',
  },

  buttonText: { color: '#fcd030', fontWeight: 'bold' },
});