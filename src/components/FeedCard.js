import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Heart, Pin, Trash2 } from 'lucide-react-native';
import { supabase } from '../lib/supabase';

export default function FeedCard({ post, onRefresh, onToggleFavorite, isAdmin }) {
  // Proteção contra post undefined
  if (!post) {
    return null;
  }

  const handleDelete = async () => {
    Alert.alert(
      'Excluir Post',
      'Tem certeza que deseja excluir este post?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('posts')
                .delete()
                .eq('id', post.id);

              if (error) throw error;

              if (onRefresh) onRefresh();
            } catch (err) {
              console.error('Erro ao excluir:', err);
              Alert.alert('Erro', 'Não foi possível excluir o post');
            }
          },
        },
      ]
    );
  };

  const handlePin = async () => {
    try {
      const { error } = await supabase
        .from('posts')
        .update({ pinned: !post.pinned })
        .eq('id', post.id);

      if (error) throw error;

      if (onRefresh) onRefresh();
    } catch (err) {
      console.error('Erro ao fixar:', err);
      Alert.alert('Erro', 'Não foi possível fixar o post');
    }
  };

  return (
    <View style={[styles.card, post.pinned && styles.pinnedCard]}>
      {/* Header do Card */}
      <View style={styles.cardHeader}>
        <View style={styles.authorInfo}>
          <View style={styles.authorCircle}>
            <Text style={styles.authorInitial}>
              {post.author.charAt(0).toUpperCase()}
            </Text>
          </View>
          <View>
            <Text style={styles.authorName}>{post.author}</Text>
            <Text style={styles.sectorText}>{post.sector}</Text>
          </View>
        </View>

        <View style={styles.headerRight}>
          {post.pinned && (
            <View style={styles.pinnedBadge}>
              <Pin size={14} color="#fcd030" fill="#fcd030" />
            </View>
          )}
          <Text style={styles.date}>{post.date}</Text>
        </View>
      </View>

      {/* Conteúdo */}
      <Text style={styles.text}>{post.text}</Text>

      {/* Footer com ações */}
      <View style={styles.cardFooter}>
        {/* Botão de Favoritar */}
        <TouchableOpacity
          style={styles.actionButton}
          onPress={onToggleFavorite}
        >
          <Heart
            size={20}
            color={post.isFavorited ? '#e74c3c' : '#999'}
            fill={post.isFavorited ? '#e74c3c' : 'transparent'}
          />
          <Text style={[
            styles.actionText,
            post.isFavorited && styles.favoritedText
          ]}>
            {post.isFavorited ? 'Favoritado' : 'Favoritar'}
          </Text>
        </TouchableOpacity>

        {/* Botões de Admin */}
        {isAdmin && (
          <View style={styles.adminActions}>
            <TouchableOpacity
              style={styles.iconButton}
              onPress={handlePin}
            >
              <Pin
                size={18}
                color={post.pinned ? '#fcd030' : '#666'}
                fill={post.pinned ? '#fcd030' : 'transparent'}
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.iconButton}
              onPress={handleDelete}
            >
              <Trash2 size={18} color="#e74c3c" />
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },

  pinnedCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#fcd030',
    backgroundColor: '#fffef5',
  },

  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },

  authorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },

  authorCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },

  authorInitial: {
    color: '#fcd030',
    fontSize: 16,
    fontWeight: 'bold',
  },

  authorName: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#000',
  },

  sectorText: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },

  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  pinnedBadge: {
    padding: 4,
  },

  date: {
    fontSize: 12,
    color: '#999',
  },

  text: {
    fontSize: 15,
    color: '#333',
    lineHeight: 22,
    marginBottom: 12,
  },

  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },

  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: '#f8f8f8',
  },

  actionText: {
    fontSize: 13,
    color: '#999',
    fontWeight: '600',
  },

  favoritedText: {
    color: '#e74c3c',
  },

  adminActions: {
    flexDirection: 'row',
    gap: 12,
  },

  iconButton: {
    padding: 8,
  },
});