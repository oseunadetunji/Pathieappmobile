import React, { useEffect, useState } from 'react';
import { Alert, Platform, Modal, View, Text, TouchableOpacity, StyleSheet } from 'react-native';

// Alert.alert is a no-op on web. On web we render an in-app dialog (AlertHost,
// mounted once in App.js); on native we use the real Alert.
let listener = null;

export function showAlert(title, message, buttons) {
  if (Platform.OS !== 'web') {
    Alert.alert(title, message, buttons);
    return;
  }
  const btns = buttons && buttons.length ? buttons : [{ text: 'OK' }];
  if (listener) {
    listener({ title, message, buttons: btns });
  } else {
    // Host not mounted yet: fall back to the browser dialogs.
    const text = [title, message].filter(Boolean).join('\n\n');
    if (btns.length <= 1) { window.alert(text); btns[0]?.onPress?.(); return; }
    const cancel = btns.find((b) => b.style === 'cancel');
    const action = btns.find((b) => b !== cancel);
    if (window.confirm(text)) action?.onPress?.(); else cancel?.onPress?.();
  }
}

export function AlertHost() {
  const [dialog, setDialog] = useState(null);

  useEffect(() => {
    listener = setDialog;
    return () => { listener = null; };
  }, []);

  if (!dialog) return null;

  const close = (btn) => {
    setDialog(null);
    btn.onPress?.();
  };

  return (
    <Modal transparent visible animationType="fade" onRequestClose={() => setDialog(null)}>
      <View style={styles.overlay}>
        <View style={styles.box}>
          {!!dialog.title && <Text style={styles.title}>{dialog.title}</Text>}
          {!!dialog.message && <Text style={styles.message}>{dialog.message}</Text>}
          <View style={styles.buttons}>
            {dialog.buttons.map((b, i) => (
              <TouchableOpacity
                key={i}
                style={[
                  styles.btn,
                  b.style === 'cancel' && styles.btnCancel,
                  b.style === 'destructive' && styles.btnDestructive,
                ]}
                onPress={() => close(b)}
              >
                <Text
                  style={[
                    styles.btnText,
                    b.style === 'cancel' && styles.btnCancelText,
                  ]}
                >
                  {b.text || 'OK'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 24 },
  box: { backgroundColor: 'white', borderRadius: 16, padding: 24, width: '100%', maxWidth: 420 },
  title: { fontSize: 18, fontWeight: 'bold', color: '#1F2937', marginBottom: 8 },
  message: { fontSize: 14, color: '#4B5563', lineHeight: 20, marginBottom: 20 },
  buttons: { gap: 8 },
  btn: { backgroundColor: '#9333EA', borderRadius: 10, padding: 12, alignItems: 'center' },
  btnCancel: { backgroundColor: '#F3F4F6' },
  btnDestructive: { backgroundColor: '#DC2626' },
  btnText: { color: 'white', fontSize: 15, fontWeight: '600' },
  btnCancelText: { color: '#374151' },
});
