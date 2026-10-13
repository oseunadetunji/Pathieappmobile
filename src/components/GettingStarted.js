import React, { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getLocation } from '../utils/locationStore';
import TipBubble from './TipBubble';

// First-run helper on the Home screen: a small bubble that floats above the tab bar and
// points to the next step. It can be dismissed, and it goes away once the account has a
// child, a goal and a scheduled activity.
export default function GettingStarted({ kids, activities, navigation }) {
  const [hasLocation, setHasLocation] = useState(true);
  const [dismissed, setDismissed] = useState({});

  useEffect(() => {
    const check = async () => setHasLocation(Boolean(await getLocation()));
    check();
    return navigation.addListener('focus', check);
  }, [navigation]);

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem('gettingStartedDismissed');
        if (raw) setDismissed(JSON.parse(raw));
      } catch (e) { /* ignore */ }
    })();
  }, []);

  const firstChild = kids[0];
  const hasChild = kids.length > 0;
  const hasGoal = kids.some((c) => Array.isArray(c.goals) && c.goals.length > 0);
  const hasActivity = activities.length > 0;

  if (hasChild && hasGoal && hasActivity) return null;

  let key, step, title, body, button, onPress;
  if (!hasChild) {
    key = 'child'; step = 1;
    title = 'Welcome to Pathie 👋';
    body = 'Start by adding your child. It takes a minute.';
    button = 'Add your child';
    onPress = () => navigation.navigate('Kids');
  } else if (!hasGoal) {
    key = 'goal'; step = 2;
    title = `What's ${firstChild.name}'s big dream?`;
    body = 'Add a goal, like basketball, art or science.';
    button = 'Add a goal';
    onPress = () => navigation.navigate('ChildProfile', { child: firstChild });
  } else if (!hasLocation) {
    key = 'location'; step = 3;
    title = 'Where should we look?';
    body = 'Set your location once to find classes near you.';
    button = 'Set my location';
    onPress = () => navigation.navigate('Settings', { screen: 'LocationSettings' });
  } else {
    key = 'find'; step = 3;
    const withGoal = kids.find((c) => Array.isArray(c.goals) && c.goals.length > 0);
    const goal = withGoal.goals[0];
    title = 'Find the first activity';
    body = `See classes and clubs near you for "${goal}".`;
    button = 'Find activities';
    onPress = () => navigation.navigate('FindProviders', { child: withGoal, goal, activity: `${goal} classes` });
  }

  if (dismissed[key]) return null;

  const dismiss = async () => {
    const next = { ...dismissed, [key]: true };
    setDismissed(next);
    try { await AsyncStorage.setItem('gettingStartedDismissed', JSON.stringify(next)); } catch (e) { /* ignore */ }
  };

  return (
    <TipBubble step={step} total={3} title={title} body={body} button={button} onPress={onPress} onDismiss={dismiss} />
  );
}
