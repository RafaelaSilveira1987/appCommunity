import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function ChatBubble({ message, isOwn }) {
  return (
    <View style={[styles.container, isOwn && styles.ownContainer]}>
      <View style={[styles.bubble, isOwn && styles.ownBubble]}>
        <Text style={[styles.text, isOwn && styles.ownText]}>{message.text}</Text>
        <Text style={[styles.timestamp, isOwn && styles.ownTimestamp]}>
          {message.timestamp}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    marginVertical: 4,
    paddingHorizontal: 12,
  },

  ownContainer: {
    justifyContent: 'flex-end',
  },

  bubble: {
    maxWidth: '80%',
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },

  ownBubble: {
    backgroundColor: '#0047AB',
  },

  text: {
    fontSize: 14,
    color: '#333333',
    lineHeight: 20,
  },

  ownText: {
    color: '#ffffff',
  },

  timestamp: {
    fontSize: 11,
    color: '#999999',
    marginTop: 4,
  },

  ownTimestamp: {
    color: '#e0e0e0',
  },
});
