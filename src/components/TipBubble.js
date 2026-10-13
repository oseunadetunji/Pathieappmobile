import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

// Small dismissible speech bubble that floats above the tab bar (position it inside a screen's root View).
export default function TipBubble({ step, total, title, body, button, onPress, onDismiss }) {
  return (
    <View style={styles.wrap} pointerEvents="box-none">
      <View style={styles.bubble}>
        <TouchableOpacity
          style={styles.close}
          onPress={onDismiss}
          accessibilityRole="button"
          accessibilityLabel="Dismiss tip"
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Text style={styles.closeText}>{'✕'}</Text>
        </TouchableOpacity>
        <Text style={styles.step}>Step {step} of {total}</Text>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.body}>{body}</Text>
        <TouchableOpacity style={styles.button} onPress={onPress} accessibilityRole="button">
          <Text style={styles.buttonText}>{button}</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.tail} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', left: 16, right: 16, bottom: 10, alignItems: 'center' },
  bubble: {
    alignSelf: 'stretch',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 2,
    borderColor: '#9333EA',
    paddingVertical: 14,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
  tail: {
    width: 14, height: 14, backgroundColor: '#FFFFFF',
    borderRightWidth: 2, borderBottomWidth: 2, borderColor: '#9333EA',
    transform: [{ rotate: '45deg' }], marginTop: -8,
  },
  close: { position: 'absolute', top: 8, right: 10, zIndex: 2, padding: 4 },
  closeText: { fontSize: 14, color: '#9CA3AF', fontWeight: '700' },
  step: { fontSize: 11, color: '#9333EA', fontWeight: '700', letterSpacing: 0.4, textTransform: 'uppercase', marginBottom: 2 },
  title: { fontSize: 17, fontWeight: 'bold', color: '#1F2937', paddingRight: 22 },
  body: { fontSize: 13, color: '#4B5563', lineHeight: 18, marginTop: 2, marginBottom: 10 },
  button: { backgroundColor: '#9333EA', paddingVertical: 10, borderRadius: 12, alignItems: 'center' },
  buttonText: { color: '#FFFFFF', fontSize: 15, fontWeight: '600' },
});
