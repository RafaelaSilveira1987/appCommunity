import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Lock } from 'lucide-react-native';

export default function RestrictedOverlay() {
  return (
    <View style={styles.container}>
      <Lock size={48} color="#999999" />
      <Text style={styles.title}>Acesso Restrito</Text>
      <Text style={styles.message}>
        Você não tem permissão para acessar este recurso.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
  },

  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000000',
    marginTop: 16,
  },

  message: {
    fontSize: 14,
    color: '#777777',
    marginTop: 8,
    textAlign: 'center',
    paddingHorizontal: 32,
  },
});
