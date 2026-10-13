import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

// Compact speech bubble (about half a business card) that floats above the tab bar.
// Place it inside a screen's root View. One short line plus one button.
export default function TipBubble({ step, total, title, button, onPress, onDismiss }) {
  return (
    <View style={styles.wrap} pointerEvents="box-none">
      <View style={styles.bubble}>
        <View style={styles.topRow}>
          <Text style={styles.step}>{step}/{total}</Text>
          <TouchableOpacity
            onPress={onDismiss}
            accessibilityRole="button"
            accessibilityLabel="Dismiss tip"
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Text style={styles.closeText}>{'✕'}</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.title} numberOfLines={2}>{title}</Text>
        <TouchableOpacity style={styles.button} onPress={onPress} accessibilityRole="button">
          <Text style={styles.buttonText}>{button}</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.tail} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', left: 0, right: 0, bottom: 8, alignItems: 'center' },
  bubble: {
    width: 210,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#9333EA',
    paddingTop: 6,
    paddingBottom: 10,
    paddingHorizontal: 12,
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 8,
  },
  tail: {
    width: 12, height: 12, backgroundColor: '#FFFFFF',
    borderRightWidth: 2, borderBottomWidth: 2, borderColor: '#9333EA',
    transform: [{ rotate: '45deg' }], marginTop: -7,
  },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  step: { fontSize: 11, color: '#9333EA', fontWeight: '700' },
  closeText: { fontSize: 12, color: '#9CA3AF', fontWeight: '700' },
  title: { fontSize: 14, fontWeight: 'bold', color: '#1F2937', marginTop: 1, marginBottom: 8 },
  button: { backgroundColor: '#9333EA', paddingVertical: 7, borderRadius: 10, alignItems: 'center' },
  buttonText: { color: '#FFFFFF', fontSize: 13, fontWeight: '600' },
});
