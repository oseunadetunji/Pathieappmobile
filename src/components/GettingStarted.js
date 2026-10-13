import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { getLocation } from '../utils/locationStore';

// First-run guide on the Home screen. Shows the next step for a new account and
// disappears once the account has a child, a goal, and a scheduled activity.
export default function GettingStarted({ kids, activities, navigation }) {
  // Searching needs a location, so the last step asks for it first (re-checked on return to Home).
  const [hasLocation, setHasLocation] = useState(true);
  useEffect(() => {
    const check = async () => setHasLocation(Boolean(await getLocation()));
    check();
    return navigation.addListener('focus', check);
  }, [navigation]);

  const firstChild = kids[0];
  const hasChild = kids.length > 0;
  const hasGoal = kids.some((c) => Array.isArray(c.goals) && c.goals.length > 0);
  const hasActivity = activities.length > 0;

  if (hasChild && hasGoal && hasActivity) return null;

  let step, title, body, button, onPress;
  if (!hasChild) {
    step = 1;
    title = 'Welcome to Pathie 👋';
    body = 'Start by adding your child. It takes a minute.';
    button = 'Add your child';
    onPress = () => navigation.navigate('Kids');
  } else if (!hasGoal) {
    step = 2;
    title = `What's ${firstChild.name}'s big dream?`;
    body = 'Add a goal, like basketball, art or science, and Pathie builds the path toward it.';
    button = 'Add a goal';
    onPress = () => navigation.navigate('ChildProfile', { child: firstChild });
  } else if (!hasLocation) {
    step = 3;
    title = 'Where should we look?';
    body = 'Set your location once, and Pathie finds classes and clubs near you.';
    button = 'Set my location';
    onPress = () => navigation.navigate('Settings', { screen: 'LocationSettings' });
  } else {
    step = 3;
    title = 'Find the first activity';
    body = 'Search for classes and clubs nearby that match the goal, then schedule one.';
    button = 'Find activities';
    onPress = () => navigation.navigate('Discover');
  }

  return (
    <View style={styles.card}>
      <View style={styles.dots}>
        {[1, 2, 3].map((n) => (
          <View key={n} style={[styles.dot, n <= step && styles.dotOn]} />
        ))}
        <Text style={styles.stepText}>Step {step} of 3</Text>
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.body}>{body}</Text>
      <TouchableOpacity style={styles.button} onPress={onPress} accessibilityRole="button">
        <Text style={styles.buttonText}>{button}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    margin: 16,
    marginBottom: 0,
    padding: 18,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#9333EA',
  },
  dots: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  dot: { width: 22, height: 6, borderRadius: 3, backgroundColor: '#E9D5FF', marginRight: 6 },
  dotOn: { backgroundColor: '#9333EA' },
  stepText: { marginLeft: 6, fontSize: 12, color: '#6B7280', fontWeight: '600' },
  title: { fontSize: 20, fontWeight: 'bold', color: '#1F2937', marginBottom: 4 },
  body: { fontSize: 14, color: '#4B5563', lineHeight: 20, marginBottom: 14 },
  button: { backgroundColor: '#9333EA', paddingVertical: 12, borderRadius: 12, alignItems: 'center' },
  buttonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
});
