import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, Modal, TextInput, Linking } from 'react-native';
import { collection, addDoc, query, where, onSnapshot } from 'firebase/firestore';
import { auth, db } from '../../firebase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { showAlert } from '../utils/crossAlert';
import { useSubscription } from '../context/SubscriptionContext';

// Google Places API Key
import { GOOGLE_PLACES_API_KEY as LOCAL_KEY } from '../config.local';
import HeaderBack from '../components/HeaderBack';
const GOOGLE_PLACES_API_KEY = LOCAL_KEY || process.env.EXPO_PUBLIC_GOOGLE_PLACES_API_KEY;

export default function FindProvidersScreen({ route, navigation }) {
  const { child: routeChild, goal: routeGoal, activity: routeActivity } = route.params || {};
  const { checkCanSchedule, checkAndRecordSearch } = useSubscription();
  
  const [child, setChild] = useState(routeChild || null);
  const [goal, setGoal] = useState(routeGoal || '');
  const [activity, setActivity] = useState(routeActivity || '');
  const [showSetup, setShowSetup] = useState(!routeChild || !routeActivity);
  const [children, setChildren] = useState([]);
  
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [userLocation, setUserLocation] = useState(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [recurrence, setRecurrence] = useState('once');
  const [recurringUntil, setRecurringUntil] = useState('');

  // Load children if we need to show setup
  useEffect(() => {
    if (showSetup) {
      const userId = auth.currentUser?.uid;
      if (!userId) return;
      
      const q = query(collection(db, 'children'), where('userId', '==', userId));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const childrenData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setChildren(childrenData);
      });
      
      return unsubscribe;
    }
  }, [showSetup]);

  const handleStartSearch = () => {
    if (!child || !activity.trim()) {
      showAlert('Missing Information', 'Please select a child and enter an activity to search for.');
      return;
    }
    setShowSetup(false);
    setLoading(true);
    // the showSetup effect below runs the search
  };

  useEffect(() => {
    // Only load if we have the required params and not showing setup
    if (child && activity && !showSetup) {
      loadUserLocationAndSearch();
    }
  }, [showSetup]);

  const loadUserLocationAndSearch = async () => {
    // Extra safety check
    if (!activity) {
      setLoading(false);
      return;
    }
    
    try {
      const savedLocation = await AsyncStorage.getItem('userLocation');
      
      if (savedLocation) {
        const locationData = JSON.parse(savedLocation);
        setUserLocation(locationData);
        await searchNearbyProviders(locationData);
      } else {
        setLoading(false);
        showAlert(
          'Location Not Set',
          'Please set your location in Settings to find nearby activities.',
          [
            { text: 'Cancel', style: 'cancel' },
           { text: 'Go to Settings', onPress: () => navigation.navigate('Home', { screen: 'Settings' }) }
          ]
        );
      }
    } catch (error) {
      console.error('\u274C Error loading location:', error);
      setLoading(false);
      showAlert('Error', 'Failed to load your location. Please try again.');
    }
  };

  const searchNearbyProviders = async (location) => {
    setLoading(true);

    // Free plan: 5 searches a month (counted server-side)
    if (!(await checkAndRecordSearch(navigation))) {
      setProviders([]);
      setLoading(false);
      return;
    }

    try {
      const { latitude, longitude } = location;

      // Build precise, literal search query
      const searchQuery = buildRelevantQuery(activity, goal);
      const topic = extractTopic(goal);


      // Places API (New): works from browsers (CORS) and native.
      const response = await fetch('https://places.googleapis.com/v1/places:searchText', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': GOOGLE_PLACES_API_KEY,
          'X-Goog-FieldMask': [
            'places.id',
            'places.displayName',
            'places.formattedAddress',
            'places.rating',
            'places.userRatingCount',
            'places.location',
            'places.currentOpeningHours.openNow',
            'places.websiteUri',
            'places.primaryType',
            'places.types'
          ].join(',')
        },
        body: JSON.stringify({
          textQuery: searchQuery,
          maxResultCount: 20,
          locationBias: {
            circle: { center: { latitude, longitude }, radius: 30000 }
          }
        })
      });

      const data = await response.json();

      if (!response.ok) {
        const msg = data?.error?.message || `HTTP ${response.status}`;
        console.error('Places API error:', response.status, msg);
        setProviders([]);
        showAlert('Search Error', `Google Places returned an error: ${msg}`);
        return;
      }

      const places = data.places || [];

      if (places.length > 0) {
        const formattedProviders = places
          .filter((place) => place.location)
          .map((place) => {
            const distance = calculateDistance(
              latitude,
              longitude,
              place.location.latitude,
              place.location.longitude
            );

            return {
              id: place.id,
              name: place.displayName?.text || 'Unnamed place',
              address: place.formattedAddress || 'Address not available',
              rating: place.rating || 0,
              totalRatings: place.userRatingCount || 0,
              distance: distance.text,
              distanceValue: distance.value,
              latitude: place.location.latitude,
              longitude: place.location.longitude,
              isOpen: place.currentOpeningHours?.openNow,
              website: place.websiteUri || null,
              _types: [place.primaryType, ...(place.types || [])].filter(Boolean)
            };
          });

        // Drop clearly off-topic place types (physio, clinics, golf, etc.)
        // unless the activity or goal is itself health-related.
        const healthy = /(health|physio|therap|medic|injur|rehab|doctor|dent|clinic|wellness|spa|massage)/i
          .test(`${activity} ${goal}`);
        const BAD = ['physiotherapist','doctor','hospital','dentist','health','medical_lab','spa','pharmacy','drugstore','golf_course','lodging','real_estate_agency','insurance_agency','lawyer','finance','bank','car_repair','store','restaurant','bar','cafe'];
        let relevant = formattedProviders.filter((p) =>
          healthy || !p._types.some((t) => BAD.includes(t) && t !== 'store' && t !== 'restaurant' && t !== 'cafe' && t !== 'bar')
        );
        if (topic && !/(golf)/.test(topic)) {
          relevant = relevant.filter((p) => !/golf/i.test(p.name));
        }
        if (relevant.length === 0) relevant = formattedProviders;

        // Topic matches first, then nearest.
        const topicWords = topic ? topic.split(' ').filter((w) => w.length >= 4) : [];
        const score = (p) => topicWords.some((w) => p.name.toLowerCase().includes(w)) ? 0 : 1;
        relevant.sort((a, b) => score(a) - score(b) || a.distanceValue - b.distanceValue);
        setProviders(relevant.slice(0, 15).map(({ _types, ...rest }) => rest));
      } else {
        setProviders([]);
        showAlert(
          'No Results Found',
          `We couldn't find any "${activity}" providers within 30km of your location.\n\nTry a more general search term or check a different location.`
        );
      }
    } catch (error) {
      console.error('Search error:', error);
      setProviders([]);
      showAlert('Network Error', 'Could not reach the search service. Please check your internet connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  // Pull the core subject out of a goal ("Play Basketball" -> "basketball")
  const extractTopic = (g) => (g || '').toLowerCase()
    .replace(/[^a-z0-9 ]/g, ' ')
    .replace(/^\s*(i want to |to )?(learn how to|learn to|learn|play|become an?|become|be an?|be|get good at|master|improve at|improve my|improve|start|try|do)\s+/, '')
    .replace(/\s+/g, ' ').trim();

  // Combine goal + activity so generic activities ("Team Practice") stay on-topic
  const buildRelevantQuery = (activityName, goalText) => {
    const a = (activityName || '').toLowerCase().trim();
    const topic = extractTopic(goalText);
    if (!topic || a.includes(topic)) return buildPreciseSearchQuery(activityName);
    if (/camp/.test(a)) return `${topic} camp for kids`;
    if (/(lesson|class|course|workshop|coach|train|skill|drill|clinic|tutor|instruct)/.test(a)) return `${topic} lessons for kids`;
    if (/(team|practice|club|league|game|join|scrimmage|tryout|match|program)/.test(a)) return `${topic} club for kids`;
    return `${topic} ${a} for kids`;
  };

  const buildPreciseSearchQuery = (activityName) => {
    const activity = activityName.toLowerCase().trim();

    // PRINCIPLE: Search for EXACTLY what the activity says
    // Use literal, precise terms that match the actual place type
    
    // === PLACES TO VISIT (museums, attractions, venues) ===
    if (activity.includes('museum') || activity.includes('visit')) {
      if (activity.includes('science')) {
        return 'science museum';  // Literal: actual science museums
      }
      if (activity.includes('art')) {
        return 'art museum gallery';
      }
      if (activity.includes('history')) {
        return 'history museum';
      }
      if (activity.includes('nature')) {
        return 'natural history museum nature center';
      }
      if (activity.includes('children') || activity.includes('kids')) {
        return "children's museum";
      }
      // Generic museum visit
      if (activity.includes('museum')) {
        return 'museum';
      }
    }

    // === VOLUNTEERING (specific contexts, not general opportunities) ===
    if (activity.includes('volunteer')) {
      if (activity.includes('animal') || activity.includes('shelter') || activity.includes('pet')) {
        return 'animal shelter humane society';  // Literal: actual shelters, not programs
      }
      if (activity.includes('hospital')) {
        return 'hospital volunteer services';
      }
      if (activity.includes('library')) {
        return 'public library';
      }
      if (activity.includes('food bank') || activity.includes('soup kitchen')) {
        return 'food bank soup kitchen';
      }
      if (activity.includes('senior') || activity.includes('elderly')) {
        return 'senior center nursing home';
      }
      if (activity.includes('environment') || activity.includes('park')) {
        return 'nature center conservation';
      }
      // Generic volunteering - community centers
      return 'volunteer center community service';
    }

    // === CLASSES & LESSONS (structured learning) ===
    if (activity.includes('class') || activity.includes('lesson')) {
      // Music
      if (activity.includes('guitar')) return 'guitar lessons school';
      if (activity.includes('piano')) return 'piano lessons school';
      if (activity.includes('violin')) return 'violin lessons school';
      if (activity.includes('drum')) return 'drum lessons school';
      if (activity.includes('singing') || activity.includes('voice')) return 'voice lessons vocal coach';
      if (activity.includes('music')) return 'music school lessons';
      
      // Arts
      if (activity.includes('art')) return 'art classes studio';
      if (activity.includes('paint')) return 'painting classes studio';
      if (activity.includes('draw')) return 'drawing classes art studio';
      if (activity.includes('pottery') || activity.includes('ceramic')) return 'pottery classes studio';
      
      // Dance
      if (activity.includes('ballet')) return 'ballet classes studio';
      if (activity.includes('hip hop')) return 'hip hop dance studio';
      if (activity.includes('dance')) return 'dance studio classes';
      
      // Sports/Fitness
      if (activity.includes('swim')) return 'swimming lessons pool';
      if (activity.includes('gymnastic')) return 'gymnastics classes';
      if (activity.includes('yoga')) return 'yoga studio kids';
      
      // Academic
      if (activity.includes('coding') || activity.includes('programming')) return 'coding classes kids';
      if (activity.includes('math')) return 'math tutoring center';
      if (activity.includes('reading')) return 'reading tutoring literacy';
      if (activity.includes('science')) return 'science classes kids';
      if (activity.includes('language') || activity.includes('spanish') || activity.includes('french')) {
        const lang = activity.match(/(spanish|french|chinese|german|italian)/i);
        return lang ? `${lang[0]} language classes` : 'language school';
      }
      
      // Life skills
      if (activity.includes('cooking') || activity.includes('baking')) return 'cooking classes kids';
      if (activity.includes('first aid')) return 'first aid training';
    }

    // === CLUBS & TEAMS (membership organizations) ===
    if (activity.includes('club') || activity.includes('team') || activity.includes('join')) {
      // Sports teams/clubs
      if (activity.includes('soccer') || activity.includes('football')) return 'soccer club youth';
      if (activity.includes('basketball')) return 'basketball club youth';
      if (activity.includes('baseball')) return 'baseball league youth';
      if (activity.includes('volleyball')) return 'volleyball club';
      if (activity.includes('tennis')) return 'tennis club';
      if (activity.includes('hockey')) return 'hockey club';
      if (activity.includes('swim')) return 'swim team club';
      
      // Academic clubs
      if (activity.includes('science')) return 'science club STEM program';
      if (activity.includes('biology')) return 'biology club science program';
      if (activity.includes('robotics')) return 'robotics club team';
      if (activity.includes('math')) return 'math club enrichment';
      if (activity.includes('chess')) return 'chess club';
      if (activity.includes('debate')) return 'debate club team';
      
      // Other clubs
      if (activity.includes('book')) return 'book club library';
      if (activity.includes('drama') || activity.includes('theater')) return 'drama club theater';
      if (activity.includes('music') || activity.includes('band') || activity.includes('orchestra')) return 'youth orchestra band';
    }

    // === MARTIAL ARTS (dojos, specific styles) ===
    if (activity.includes('karate')) return 'karate dojo school';
    if (activity.includes('taekwondo')) return 'taekwondo school';
    if (activity.includes('judo')) return 'judo dojo school';
    if (activity.includes('kung fu')) return 'kung fu school';
    if (activity.includes('jiu jitsu')) return 'brazilian jiu jitsu academy';
    if (activity.includes('boxing')) return 'boxing gym youth';
    if (activity.includes('martial art')) return 'martial arts dojo';

    // === SPORTS TRAINING (without "class" or "team") ===
    if (activity.includes('soccer') && !activity.includes('class')) return 'soccer training academy';
    if (activity.includes('basketball') && !activity.includes('class')) return 'basketball training';
    if (activity.includes('tennis') && !activity.includes('class')) return 'tennis lessons academy';
    if (activity.includes('swim') && !activity.includes('class')) return 'swimming pool lessons';
    if (activity.includes('gymnastic')) return 'gymnastics center';

    // === CAMPS & PROGRAMS ===
    if (activity.includes('camp')) {
      if (activity.includes('summer')) return 'summer camp kids';
      if (activity.includes('science')) return 'science camp kids';
      if (activity.includes('sports')) return 'sports camp';
      if (activity.includes('art')) return 'art camp kids';
      return 'day camp youth';
    }

    // === PERFORMING ARTS ===
    if (activity.includes('theater') || activity.includes('drama') || activity.includes('acting')) {
      if (activity.includes('class')) return 'acting classes kids theater';
      return 'community theater youth program';
    }

    // === RELIGIOUS/SPIRITUAL ===
    if (activity.includes('bible study') || activity.includes('sunday school')) {
      return 'church youth ministry';
    }
    if (activity.includes('youth group')) {
      return 'church youth group';
    }

    // === WORKSHOPS & EVENTS ===
    if (activity.includes('workshop')) {
      return activity.replace('workshop', '').trim() + ' workshop';
    }

    // === TUTORING ===
    if (activity.includes('tutor')) {
      if (activity.includes('math')) return 'math tutoring center';
      if (activity.includes('reading')) return 'reading tutoring';
      if (activity.includes('english')) return 'english tutoring';
      return 'tutoring center learning';
    }

    // === NATURE & OUTDOORS ===
    if (activity.includes('hik')) return 'hiking club trails';
    if (activity.includes('camp') && activity.includes('outdoor')) return 'outdoor education camp';
    if (activity.includes('nature walk')) return 'nature center trails';
    if (activity.includes('garden')) return 'community garden';

    // === BUSINESS & ENTREPRENEURSHIP ===
    if (activity.includes('business') || activity.includes('entrepreneur')) {
      return 'junior achievement youth business';
    }
    if (activity.includes('financial literacy') || activity.includes('money')) {
      return 'financial literacy program youth';
    }

    // === FALLBACK: Clean and literal ===
    // Remove action words, keep the noun (the actual place/thing)
    let cleanActivity = activity
      .replace(/^(learn|take|join|attend|go to|practice|try|start|begin)\s+/i, '')
      .replace(/\s+(class|classes|lesson|lessons|training|program)$/i, '')
      .trim();

    // If it's a specific instrument or skill, search for lessons
    const instruments = ['guitar', 'piano', 'violin', 'drums', 'flute', 'trumpet', 'clarinet', 'saxophone'];
    const hasInstrument = instruments.some(inst => cleanActivity.includes(inst));
    if (hasInstrument) {
      return `${cleanActivity} lessons school`;
    }

    // Default: add appropriate suffix based on context
    if (activity.length < 20) {  // Short activity name, likely a specific thing
      return `${cleanActivity}`;  // Search literally for what they said
    } else {  // Longer description
      return `${cleanActivity} kids`;
    }
  };

  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distanceKm = R * c;

    return {
      value: distanceKm,
      text: distanceKm < 1 ? `${Math.round(distanceKm * 1000)}m` : `${distanceKm.toFixed(1)}km`
    };
  };

  // Opens the provider's own website; falls back to their Google Maps listing if they have none.
  const openWebsite = (provider) => {
    const url = provider.website
      || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(provider.name + ', ' + provider.address)}`;
    Linking.openURL(url);
  };

  const addToCalendar = (provider) => {
    setSelectedProvider(provider);
    setShowDatePicker(true);
  };

  const confirmAddToCalendar = async () => {
    if (!selectedProvider || !selectedDate) {
      showAlert('Error', 'Please select a date');
      return;
    }
    
    if (!child || !child.id) {
      showAlert('Error', 'Child information is missing');
      return;
    }

    const userId = auth.currentUser?.uid;
    if (!userId) return;

    try {
      const startDate = new Date(selectedDate + 'T12:00:00');
      const dates = [];

      if (recurrence === 'once') {
        dates.push(startDate);
      } else {
        const endDate = recurringUntil
          ? new Date(recurringUntil + 'T12:00:00')
          : new Date(startDate.getTime() + 90 * 24 * 60 * 60 * 1000);

        let currentDate = new Date(startDate);
        while (currentDate <= endDate && dates.length < 50) {
          dates.push(new Date(currentDate));
          if (recurrence === 'weekly') currentDate.setDate(currentDate.getDate() + 7);
          else if (recurrence === 'biweekly') currentDate.setDate(currentDate.getDate() + 14);
          else if (recurrence === 'monthly') currentDate.setMonth(currentDate.getMonth() + 1);
        }
      }

      if (!(await checkCanSchedule(dates.length, recurrence, navigation))) {
        setShowDatePicker(false);
        return;
      }

      await Promise.all(
        dates.map((date) =>
          addDoc(collection(db, 'activities'), {
            userId,
            childId: child.id,
            childName: child.name,
            goal: goal || 'General Activity',
            activityName: activity,
            providerName: selectedProvider.name,
            providerAddress: selectedProvider.address,
            providerDistance: selectedProvider.distance,
            providerRating: selectedProvider.rating,
            completed: false,
            notes: '',
            createdAt: new Date(),
            scheduledDate: date,
            recurrence
          })
        )
      );

      setShowDatePicker(false);
      setSelectedProvider(null);
      setRecurrence('once');
      setRecurringUntil('');

      showAlert('Success! \uD83C\uDF89', `${dates.length} session(s) scheduled!`);
    } catch (error) {
      showAlert('Error', error.message);
    }
  };

  const retrySearch = () => {
    if (userLocation) {
      searchNearbyProviders(userLocation);
    } else {
      loadUserLocationAndSearch();
    }
  };

  // Show setup screen if params are missing
  if (showSetup) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
        <HeaderBack />
          <Text style={styles.headerTitle}>Find Activities</Text>
          <Text style={styles.headerSubtitle}>Select child and activity to search</Text>
        </View>
        
        <ScrollView style={styles.setupContent}>
          <View style={styles.setupSection}>
            <Text style={styles.setupLabel}>Select Child *</Text>
            {children.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyText}>No children added yet</Text>
                <TouchableOpacity 
                  style={styles.addChildButton}
                  onPress={() => navigation.navigate('Kids')}
                >
                  <Text style={styles.addChildButtonText}>+ Add Child</Text>
                </TouchableOpacity>
              </View>
            ) : (
              children.map((c) => (
                <TouchableOpacity
                  key={c.id}
                  style={[
                    styles.childOption,
                    child?.id === c.id && styles.childOptionSelected
                  ]}
                  onPress={() => setChild(c)}
                >
                  <Text style={styles.childOptionAvatar}>{c.avatar}</Text>
                  <Text style={styles.childOptionName}>{c.name}</Text>
                  {child?.id === c.id && <Text style={styles.checkmark}>{"\u2713"}</Text>}
                </TouchableOpacity>
              ))
            )}
          </View>

          <View style={styles.setupSection}>
            <Text style={styles.setupLabel}>Activity to Search For *</Text>
            <TextInput
              style={styles.activityInput}
              placeholder="e.g., swimming lessons, piano class, soccer"
              value={activity}
              onChangeText={setActivity}
            />
            <Text style={styles.helpText}>
              {"\uD83D\uDCA1"} Be specific for better results (e.g., "swimming lessons" not just "swimming")
            </Text>
          </View>

          <View style={styles.setupSection}>
            <Text style={styles.setupLabel}>Goal (Optional)</Text>
            <TextInput
              style={styles.activityInput}
              placeholder="e.g., Stay Active, Learn Music"
              value={goal}
              onChangeText={setGoal}
            />
          </View>

          <TouchableOpacity
            style={[
              styles.startSearchButton,
              (!child || !activity.trim()) && styles.startSearchButtonDisabled
            ]}
            onPress={handleStartSearch}
            disabled={!child || !activity.trim()}
          >
            <Text style={styles.startSearchButtonText}>
              {"\uD83D\uDD0D"} Search for Providers
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#9333EA" />
        <Text style={styles.loadingText}>Searching for {activity}...</Text>
        {userLocation && (
          <Text style={styles.loadingSubtext}>Near {userLocation.city || userLocation.address}</Text>
        )}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <HeaderBack />
        <Text style={styles.headerTitle}>Find Activities</Text>
        <Text style={styles.headerSubtitle}>{activity}</Text>
        <Text style={styles.headerGoal}>Goal: {goal}</Text>
        {userLocation && (
          <Text style={styles.headerLocation}>{"\uD83D\uDCCD"} {userLocation.city || userLocation.address}</Text>
        )}
      </View>

      <View style={styles.infoBanner}>
        <Text style={styles.infoText}>
          {providers.length > 0 ? `\uD83D\uDCCD ${providers.length} providers within 30km` : '\uD83D\uDD0D Searching...'}
        </Text>
        <TouchableOpacity onPress={retrySearch}>
          <Text style={styles.refreshText}>{"\uD83D\uDD0D"}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {providers.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>{"\uD83D\uDCCD"}</Text>
            <Text style={styles.emptyTitle}>No Providers Found</Text>
            <Text style={styles.emptyText}>
              We couldn't find any "{activity}" providers within 30km of your location.
            </Text>
            <Text style={styles.emptySubtext}>Try:</Text>
            <Text style={styles.emptyBullet}>{"\u2022"} A more general search term</Text>
            <Text style={styles.emptyBullet}>{"\u2022"} Checking a different location</Text>
            <Text style={styles.emptyBullet}>{"\u2022"} Verifying your internet connection</Text>
            
            <TouchableOpacity style={styles.actionButton} onPress={() => navigation.navigate('Home', { screen: 'Settings' })}>
              <Text style={styles.actionButtonText}>{"\u2699\uFE0F"} Update Location</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={[styles.actionButton, styles.retryButton]} onPress={retrySearch}>
              <Text style={styles.actionButtonText}>{"\uD83D\uDD04"} Try Again</Text>
            </TouchableOpacity>
          </View>
        ) : (
          providers.map((provider, index) => (
            <View key={provider.id} style={styles.providerCard}>
              <View style={styles.providerHeader}>
                <View style={styles.rankBadge}>
                  <Text style={styles.rankText}>#{index + 1}</Text>
                </View>
                <View style={styles.providerInfo}>
                  <Text style={styles.providerName}>{provider.name}</Text>
                  {provider.isOpen !== undefined && (
                    <Text style={styles.openStatus}>{provider.isOpen ? '\uD83D\uDFE2 Open' : '\uD83D\uDD34 Closed'}</Text>
                  )}
                </View>
              </View>

              {provider.rating > 0 && (
                <Text style={styles.rating}>
                  {"\u2B50"} {provider.rating.toFixed(1)} ({provider.totalRatings} reviews)
                </Text>
              )}
              
              <Text style={styles.distance}>{"\uD83D\uDCCD"} {provider.distance}</Text>
              <Text style={styles.address}>{provider.address}</Text>

              <View style={styles.actions}>
                <TouchableOpacity style={[styles.actionBtn, styles.mapsBtn]} onPress={() => openWebsite(provider)}>
                  <Text style={styles.mapsBtnText}>{provider.website ? "\uD83C\uDF10 Website" : "\uD83D\uDDFA\uFE0F Map"}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.actionBtn, styles.scheduleBtn]} onPress={() => addToCalendar(provider)}>
                  <Text style={styles.scheduleBtnText}>{"\uD83D\uDCC5"} Schedule</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      {showDatePicker && (
        <Modal visible transparent animationType="slide" onRequestClose={() => setShowDatePicker(false)}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Schedule Activity</Text>
              <Text style={styles.modalSubtitle}>{selectedProvider?.name}</Text>

              <Text style={styles.label}>Start Date</Text>
              <TextInput style={styles.input} value={selectedDate} onChangeText={setSelectedDate} placeholder="YYYY-MM-DD" />

              <Text style={styles.label}>Recurrence</Text>
              <View style={styles.recurrenceRow}>
                {['once', 'weekly', 'biweekly', 'monthly'].map((type) => (
                  <TouchableOpacity
                    key={type}
                    style={[styles.recurrenceBtn, recurrence === type && styles.recurrenceBtnActive]}
                    onPress={() => setRecurrence(type)}
                  >
                    <Text style={[styles.recurrenceText, recurrence === type && styles.recurrenceTextActive]}>
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {recurrence !== 'once' && (
                <>
                  <Text style={styles.label}>Until (Optional)</Text>
                  <TextInput style={styles.input} value={recurringUntil} onChangeText={setRecurringUntil} placeholder="YYYY-MM-DD" />
                </>
              )}

              <View style={styles.modalButtons}>
                <TouchableOpacity style={[styles.modalBtn, styles.cancelBtn]} onPress={() => setShowDatePicker(false)}>
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.modalBtn, styles.confirmBtn]} onPress={confirmAddToCalendar}>
                  <Text style={styles.confirmBtnText}>Schedule</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F3F4F6', padding: 24 },
  loadingText: { marginTop: 16, color: '#6B7280', fontSize: 16, fontWeight: '600' },
  loadingSubtext: { marginTop: 8, color: '#9CA3AF', fontSize: 14 },
  header: { backgroundColor: '#9333EA', padding: 24, paddingTop: 60, paddingBottom: 16 },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: 'white' },
  headerSubtitle: { fontSize: 16, color: '#F3E8FF', marginTop: 4, fontWeight: '600' },
  headerGoal: { fontSize: 12, color: '#E9D5FF', marginTop: 2 },
  headerLocation: { fontSize: 12, color: '#F3E8FF', marginTop: 8 },
  infoBanner: { backgroundColor: '#F3E8FF', padding: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  infoText: { fontSize: 12, color: '#6B21A8', flex: 1 },
  refreshText: { fontSize: 16, color: '#9333EA' },
  content: { flex: 1 },
  providerCard: { backgroundColor: 'white', margin: 16, marginBottom: 0, borderRadius: 12, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 },
  providerHeader: { flexDirection: 'row', marginBottom: 12 },
  rankBadge: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#F3E8FF', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  rankText: { fontSize: 14, fontWeight: 'bold', color: '#9333EA' },
  providerInfo: { flex: 1 },
  providerName: { fontSize: 18, fontWeight: 'bold', color: '#1F2937', marginBottom: 4 },
  openStatus: { fontSize: 11, fontWeight: '600' },
  rating: { fontSize: 13, color: '#F59E0B', marginBottom: 8 },
  distance: { fontSize: 13, color: '#6B7280', marginBottom: 4 },
  address: { fontSize: 13, color: '#6B7280', marginBottom: 12 },
  actions: { flexDirection: 'row', gap: 8 },
  actionBtn: { flex: 1, paddingVertical: 10, borderRadius: 8, alignItems: 'center' },
  mapsBtn: { backgroundColor: '#DBEAFE' },
  mapsBtnText: { fontSize: 12, fontWeight: '600', color: '#1E40AF' },
  scheduleBtn: { backgroundColor: '#9333EA' },
  scheduleBtnText: { fontSize: 12, fontWeight: '600', color: 'white' },
  emptyState: { alignItems: 'center', padding: 48, marginTop: 32 },
  emptyIcon: { fontSize: 64, marginBottom: 16 },
  emptyTitle: { fontSize: 20, fontWeight: 'bold', color: '#1F2937', marginBottom: 8 },
  emptyText: { fontSize: 14, color: '#6B7280', marginBottom: 16, textAlign: 'center' },
  emptySubtext: { fontSize: 14, fontWeight: '600', color: '#1F2937', marginBottom: 8, alignSelf: 'flex-start' },
  emptyBullet: { fontSize: 13, color: '#6B7280', marginBottom: 4, alignSelf: 'flex-start' },
  actionButton: { backgroundColor: '#9333EA', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 8, marginTop: 16, width: '100%' },
  actionButtonText: { color: 'white', fontSize: 14, fontWeight: '600', textAlign: 'center' },
  retryButton: { backgroundColor: '#10B981' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 24 },
  modalContent: { backgroundColor: 'white', borderRadius: 16, padding: 24 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#1F2937', marginBottom: 4 },
  modalSubtitle: { fontSize: 14, color: '#6B7280', marginBottom: 20 },
  label: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 8, marginTop: 8 },
  input: { borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 12, padding: 14, fontSize: 16, marginBottom: 8 },
  recurrenceRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap', marginBottom: 16 },
  recurrenceBtn: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, backgroundColor: '#F3F4F6', borderWidth: 2, borderColor: '#E5E7EB' },
  recurrenceBtnActive: { backgroundColor: '#9333EA', borderColor: '#9333EA' },
  recurrenceText: { fontSize: 13, color: '#6B7280', fontWeight: '600' },
  recurrenceTextActive: { color: 'white' },
  modalButtons: { flexDirection: 'row', gap: 12, marginTop: 16 },
  modalBtn: { flex: 1, padding: 14, borderRadius: 12, alignItems: 'center' },
  cancelBtn: { backgroundColor: '#F3F4F6' },
  cancelBtnText: { color: '#6B7280', fontSize: 16, fontWeight: '600' },
  confirmBtn: { backgroundColor: '#9333EA' },
  confirmBtnText: { color: 'white', fontSize: 16, fontWeight: 'bold' },
  setupContent: { flex: 1, padding: 16 },
  setupSection: { marginBottom: 24 },
  setupLabel: { fontSize: 16, fontWeight: '600', color: '#1F2937', marginBottom: 12 },
  childOption: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'white', borderRadius: 12, padding: 16, marginBottom: 8, borderWidth: 2, borderColor: '#E5E7EB' },
  childOptionSelected: { borderColor: '#9333EA', backgroundColor: '#F5F3FF' },
  childOptionAvatar: { fontSize: 32, marginRight: 12 },
  childOptionName: { flex: 1, fontSize: 16, fontWeight: '600', color: '#1F2937' },
  checkmark: { fontSize: 20, color: '#9333EA' },
  activityInput: { backgroundColor: 'white', borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 12, padding: 14, fontSize: 16 },
  helpText: { fontSize: 12, color: '#6B7280', marginTop: 8 },
  startSearchButton: { backgroundColor: '#9333EA', borderRadius: 12, padding: 16, alignItems: 'center', marginTop: 16 },
  startSearchButtonDisabled: { backgroundColor: '#D1D5DB' },
  startSearchButtonText: { color: 'white', fontSize: 16, fontWeight: 'bold' },
  emptyState: { alignItems: 'center', padding: 24, backgroundColor: 'white', borderRadius: 12 },
  emptyText: { fontSize: 14, color: '#6B7280', marginBottom: 12 },
  addChildButton: { backgroundColor: '#9333EA', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8 },
  addChildButtonText: { color: 'white', fontSize: 14, fontWeight: '600' },
})