import React from 'react';
import { Text, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';

// Back button that sits inside a screen's existing purple header (no extra bar).
// Renders nothing when there is nowhere to go back to.
export default function HeaderBack() {
  const navigation = useNavigation();
  if (!navigation.canGoBack()) return null;
  return (
    <TouchableOpacity
      onPress={() => navigation.goBack()}
      accessibilityRole="button"
      accessibilityLabel="Go back"
      style={{
        position: 'absolute',
        top: 14,
        left: 6,
        zIndex: 10,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingVertical: 6,
      }}
    >
      <Text style={{ color: '#fff', fontSize: 28, lineHeight: 30, marginRight: 4 }}>{'‹'}</Text>
      <Text style={{ color: '#fff', fontSize: 16, fontWeight: '600' }}>Back</Text>
    </TouchableOpacity>
  );
}
