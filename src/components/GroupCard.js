import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Users } from 'lucide-react-native';
import { sectorColors } from '../utils/sectorColors';

export default function GroupCard({ group, index }) {
  // Alternar entre preto (#000000) e amarelo (#fcd030)
  const isEven = index % 2 === 0;
  const bgColor = isEven ? '#000000' : '#fcd030';
  const textColor = isEven ? '#fcd030' : '#000000';
  const iconColor = isEven ? '#fcd030' : '#000000';

  return (
    <View style={[styles.card, { borderLeftColor: isEven ? '#000000' : '#fcd030' }]}>
      <View style={styles.header}>
        <View style={[styles.iconContainer, { backgroundColor: isEven ? '#000000' : '#fcd030' }]}>
          <Users size={24} color={isEven ? '#fcd030' : '#000000'} />
        </View>

        <Text style={styles.title}>{group.name}</Text>
      </View>

      <View style={styles.footer}>
        <View style={styles.memberBadge}>
          <Text style={styles.memberText}>
            {group.members} membros
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 6, // 👈 ESSENCIAL para aparecer a cor do grupo
    borderColor: '#eeeeee',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },

  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },

  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000000',
  },

  footer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },

  memberBadge: {
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },

  memberText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666666',
  },
});