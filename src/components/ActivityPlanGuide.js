import React, { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import TipBubble from './TipBubble';

// Tip bubble on the Activity Plan screen. Each step is one tap that does the next thing:
// add the first suggestion, then search providers for it. Disappears once a session is scheduled.
export default function ActivityPlanGuide({ planCount, scheduledCount, hasSuggestion, planActivityName, onAddFirst, onFindProviders }) {
  const [dismissed, setDismissed] = useState({});

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem('activityPlanTipDismissed');
        if (raw) setDismissed(JSON.parse(raw));
      } catch (e) { /* ignore */ }
    })();
  }, []);

  if (scheduledCount > 0) return null;

  let key, step, title, button, onPress;
  if (planCount === 0) {
    key = 'plan'; step = 1;
    title = 'Start your plan';
    if (hasSuggestion) {
      button = 'Add first activity';
      onPress = onAddFirst;
    } else {
      title = 'Pick an area above, then add an activity';
      button = 'Got it';
      onPress = null;
    }
  } else {
    key = 'find'; step = 2;
    title = 'Find a class near you';
    button = 'Find providers';
    onPress = onFindProviders;
  }

  if (dismissed[key]) return null;

  const dismiss = async () => {
    const next = { ...dismissed, [key]: true };
    setDismissed(next);
    try { await AsyncStorage.setItem('activityPlanTipDismissed', JSON.stringify(next)); } catch (e) { /* ignore */ }
  };

  return (
    <TipBubble
      step={step}
      total={2}
      title={title}
      button={button}
      onPress={onPress || dismiss}
      onDismiss={dismiss}
    />
  );
}
