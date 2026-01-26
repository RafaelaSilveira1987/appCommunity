import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { supabase } from '../lib/supabase';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../contexts/AuthContext';

export default function CreatePostScreen({ navigation }) {
  const [content, setContent] = useState('');
  const { user } = useAuth();

  const handlePost = async () => {
    if (!content.trim()) {
      Alert.alert('Erro', 'Digite algo antes de publicar.');
      return;
    }

    const { error } = await supabase
      .from('posts')
      .insert([
        {
          content: content.trim(),
          author_id: user.id,
          pinned: false,
        }
      ]);

    if (error) {
      Alert.alert('Erro', 'Não foi possível publicar.');
      console.error(error);
      return;
    }

    Alert.alert('Sucesso', 'Post publicado!');
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <Text style={styles.title}>Novo Post</Text>

        <TextInput
          placeholder="Digite sua mensagem..."
          value={content}
          onChangeText={setContent}
          style={styles.input}
          multiline
        />

        <TouchableOpacity style={styles.button} onPress={handlePost}>
          <Text style={styles.buttonText}>Publicar</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#fff',
  },
  container: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    padding: 16,
    minHeight: 120,
    textAlignVertical: 'top',
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#000',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fcd030',
    fontWeight: 'bold',
    fontSize: 16,
  },
});