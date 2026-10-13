import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

// Guide card at the top of the Activity Plan screen. This page does three jobs
// (build a plan, find providers, schedule on the calendar), so it shows which one is next
// and disappears once something from this plan has been scheduled.
export default function ActivityPlanGuide({ planCount, scheduledCount, childName }) {
  if (scheduledCount > 0) return null;

  const planned = planCount > 0;
  const rows = [
    {
      done: planned,
      title: 'Build the plan',
      text: `Tap "+ Add to Plan" on the suggestions below that fit ${childName}'s goal, or add your own.`,
    },
    {
      done: false,
      title: 'Find a provider',
      text: 'On an activity in your plan, tap "Find Providers" to see classes and clubs nearby.',
    },
    {
      done: false,
      title: 'Put it on the calendar',
      text: 'Tap "Schedule" to pick a date. One-off sessions are free; weekly repeats are on Family.',
    },
  ];
  const current = planned ? 1 : 0;

  return (
    <View style={styles.card}>
      <Text style={styles.heading}>How this page works</Text>
      {rows.map((r, i) => (
        <View key={r.title} style={[styles.row, i === current && styles.rowCurrent]}>
          <View style={[styles.badge, r.done && styles.badgeDone, i === current && styles.badgeCurrent]}>
            <Text style={[styles.badgeText, (r.done || i === current) && styles.badgeTextOn]}>
              {r.done ? '✓' : i + 1}
            </Text>
          </View>
          <View style={styles.rowBody}>
            <Text style={styles.rowTitle}>{r.title}</Text>
            <Text style={styles.rowText}>{r.text}</Text>
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    margin: 16,
    marginBottom: 0,
    padding: 16,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#9333EA',
  },
  heading: { fontSize: 16, fontWeight: 'bold', color: '#1F2937', marginBottom: 10 },
  row: { flexDirection: 'row', alignItems: 'flex-start', paddingVertical: 8, paddingHorizontal: 8, borderRadius: 10 },
  rowCurrent: { backgroundColor: '#F5F0FF' },
  badge: {
    width: 26, height: 26, borderRadius: 13, backgroundColor: '#F3F4F6',
    alignItems: 'center', justifyContent: 'center', marginRight: 10, marginTop: 1,
  },
  badgeDone: { backgroundColor: '#10B981' },
  badgeCurrent: { backgroundColor: '#9333EA' },
  badgeText: { fontSize: 13, fontWeight: 'bold', color: '#6B7280' },
  badgeTextOn: { color: '#FFFFFF' },
  rowBody: { flex: 1 },
  rowTitle: { fontSize: 14, fontWeight: '600', color: '#1F2937' },
  rowText: { fontSize: 13, color: '#4B5563', lineHeight: 18, marginTop: 1 },
});
