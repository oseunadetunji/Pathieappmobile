import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, TextInput, Alert, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { geocodeSearch, reverseLookup, getDeviceCoords } from '../utils/geocode';
import { showAlert } from '../utils/crossAlert';
import HeaderBack from '../components/HeaderBack';
import { saveLocation, getLocation, clearLocation } from '../utils/locationStore';

export default function LocationSettingsScreen({ navigation }) {
  const [location, setLocation] = useState(null);
  const [customLocation, setCustomLocation] = useState('');
  const [loading, setLoading] = useState(false);
  const [savedLocation, setSavedLocation] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searchingLocations, setSearchingLocations] = useState(false);

  useEffect(() => {
    loadSavedLocation();
  }, []);

  const loadSavedLocation = async () => {
    try {
      const locationData = await getLocation();
      if (locationData) {
        setSavedLocation(locationData);
        setCustomLocation(locationData.address || '');
      }
    } catch (error) {
      console.error('Error loading location:', error);
    }
  };

  // Debounce timer
  const [debounceTimer, setDebounceTimer] = useState(null);

  /**
   * Search for location suggestions as user types
   */
  const searchLocationSuggestions = async (searchText) => {
    if (!searchText || searchText.trim().length < 3) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    setSearchingLocations(true);
    try {
      const results = await geocodeSearch(searchText, 5);
      setSuggestions(results);
      setShowSuggestions(results.length > 0);
    } catch (error) {
      console.error('Error searching locations:', error);
      setSuggestions([]);
      setShowSuggestions(false);
    } finally {
      setSearchingLocations(false);
    }
  };

  /**
   * Handle text input change with debouncing
   */
  const handleLocationInput = (text) => {
    setCustomLocation(text);
    
    // Clear existing timer
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }
    
    // Set new timer to search after 500ms of no typing
    const timer = setTimeout(() => {
      searchLocationSuggestions(text);
    }, 800);
    
    setDebounceTimer(timer);
  };

  /**
   * Select a suggestion from the dropdown
   */
  const selectSuggestion = async (suggestion) => {
    setCustomLocation(suggestion.displayName);
    setShowSuggestions(false);
    setSuggestions([]);
    
    // Auto-save the selected location
    setLoading(true);
    try {
      const locationData = {
        latitude: suggestion.latitude,
        longitude: suggestion.longitude,
        address: suggestion.displayName,
        city: suggestion.city,
        region: suggestion.region,
        country: suggestion.country,
        postalCode: suggestion.postalCode,
        timestamp: new Date().toISOString(),
        isCustom: true
      };

      await saveLocation(locationData);
      setLocation(locationData);
      setSavedLocation(locationData);
      
      showAlert(
        'Location Saved! ✓',
        `Your location has been set to: ${suggestion.displayName}`,
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('Error saving location:', error);
      showAlert('Error', 'Failed to save location');
    } finally {
      setLoading(false);
    }
  };

  const getCurrentLocation = async () => {
    setLoading(true);
    try {
      const coords = await getDeviceCoords();
      const place = await reverseLookup(coords.latitude, coords.longitude);

      const locationData = {
        latitude: coords.latitude,
        longitude: coords.longitude,
        address: place?.displayName || `${coords.latitude.toFixed(3)}, ${coords.longitude.toFixed(3)}`,
        city: place?.city || '',
        region: place?.region || '',
        country: place?.country || '',
        postalCode: place?.postalCode || '',
        timestamp: new Date().toISOString()
      };

      await saveLocation(locationData);
      setLocation(locationData);
      setSavedLocation(locationData);
      setCustomLocation(locationData.address);

      showAlert(
        'Location Saved! \u2713',
        `Your location has been set to: ${locationData.address}`,
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('Error getting location:', error);
      if (error.code === 'denied') {
        showAlert(
          'Permission Required',
          Platform.OS === 'web'
            ? 'Location access is blocked for this site. Allow it from the lock/location icon in your browser address bar, then try again, or type your city below.'
            : 'Location permission is needed to find nearby activities. Please enable it in your device settings.',
          [{ text: 'OK' }]
        );
      } else {
        showAlert(
          'Error',
          'Failed to get your current location. Please try again or enter it manually.',
          [{ text: 'OK' }]
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const saveCustomLocation = async () => {
    if (!customLocation.trim()) {
      showAlert('Error', 'Please enter a location');
      return;
    }

    setLoading(true);
    try {
      const results = await geocodeSearch(customLocation, 1);

      if (results && results.length > 0) {
        const result = results[0];
        const locationData = {
          latitude: result.latitude,
          longitude: result.longitude,
          address: customLocation.trim(),
          city: result.city,
          region: result.region,
          country: result.country,
          postalCode: result.postalCode,
          timestamp: new Date().toISOString(),
          isCustom: true
        };

        await saveLocation(locationData);
        setLocation(locationData);
        setSavedLocation(locationData);

        showAlert(
          'Location Saved! \u2713',
          `Your location has been set to: ${customLocation}`,
          [{ text: 'OK' }]
        );
      } else {
        showAlert(
          'Location Not Found',
          'Could not find this location. Please check the spelling and try again.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Error saving custom location:', error);
      showAlert(
        'Error',
        'Failed to save location. Please check your internet connection and try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setLoading(false);
    }
  };

  const clearLocation = async () => {
    showAlert(
      'Clear Location',
      'Are you sure you want to clear your saved location?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            try {
              await clearLocation();
              setLocation(null);
              setSavedLocation(null);
              setCustomLocation('');
              showAlert('Cleared', 'Location has been cleared');
            } catch (error) {
              showAlert('Error', 'Failed to clear location');
            }
          }
        }
      ]
    );
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
      keyboardVerticalOffset={100}
    >
      <View style={styles.header}>
        <HeaderBack />
        <Text style={styles.title}>Location Settings</Text>
        <Text style={styles.subtitle}>Set your location to find nearby activities</Text>
      </View>

      <ScrollView 
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Current Location Display */}
        {savedLocation && (
          <View style={styles.currentLocationCard}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardIcon}>📍</Text>
              <Text style={styles.cardTitle}>Current Location</Text>
            </View>
            <Text style={styles.locationText}>{savedLocation.address}</Text>
          </View>
        )}

        {/* GPS Location Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Use GPS Location</Text>
          <Text style={styles.sectionSubtitle}>
            Automatically detect your current location using GPS
          </Text>
          <TouchableOpacity
            style={[styles.button, styles.gpsButton]}
            onPress={getCurrentLocation}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <>
                <Text style={styles.buttonIcon}>📡</Text>
                <Text style={styles.buttonText}>Use Current Location</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Custom Location Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Enter Location Manually</Text>
          <Text style={styles.sectionSubtitle}>
            Enter your city, address, or postal code
          </Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., Lagos, Kitchener, or M5H 2N2"
            value={customLocation}
            onChangeText={handleLocationInput}
            editable={!loading}
          />
          
          {/* Suggestions Dropdown */}
          {showSuggestions && suggestions.length > 0 && (
            <View style={styles.suggestionsContainer}>
              {searchingLocations && (
                <View style={styles.suggestionItem}>
                  <ActivityIndicator size="small" color="#9333EA" />
                  <Text style={styles.suggestionText}>Searching...</Text>
                </View>
              )}
              {!searchingLocations && suggestions.map((suggestion, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.suggestionItem}
                  onPress={() => selectSuggestion(suggestion)}
                >
                  <Text style={styles.suggestionIcon}>📍</Text>
                  <View style={styles.suggestionTextContainer}>
                    <Text style={styles.suggestionText}>{suggestion.displayName}</Text>
                    {!!suggestion.postalCode && (
                      <Text style={styles.suggestionSubtext}>{suggestion.postalCode}</Text>
                    )}
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}
          
          <TouchableOpacity
            style={[styles.button, styles.saveButton]}
            onPress={saveCustomLocation}
            disabled={loading || !customLocation.trim()}
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <>
                <Text style={styles.buttonIcon}>💾</Text>
                <Text style={styles.buttonText}>Save Location</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Search Radius Info */}
        <View style={styles.infoCard}>
          <Text style={styles.infoIcon}>ℹ️</Text>
          <View style={styles.infoContent}>
            <Text style={styles.infoTitle}>Search Radius</Text>
            <Text style={styles.infoText}>
              We'll search for activities within 30km (18.6 miles) of your location.
              The closest providers will be shown first.
            </Text>
          </View>
        </View>

        {/* Clear Location Button */}
        {savedLocation && (
          <TouchableOpacity
            style={styles.clearButton}
            onPress={clearLocation}
          >
            <Text style={styles.clearButtonText}>🗑️ Clear Location</Text>
          </TouchableOpacity>
        )}

        {/* Privacy Notice */}
        <View style={styles.privacyCard}>
          <Text style={styles.privacyIcon}>🔒</Text>
          <Text style={styles.privacyText}>
            Your location is stored locally on your device and used only to find nearby activities.
            We never share your location with third parties.
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  header: {
    backgroundColor: '#9333EA',
    padding: 24,
    paddingTop: 60,
    paddingBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
  },
  subtitle: {
    fontSize: 14,
    color: '#E9D5FF',
    marginTop: 4,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 120,
  },
  currentLocationCard: {
    backgroundColor: '#FDF4FF',
    borderWidth: 2,
    borderColor: '#E9D5FF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardIcon: {
    fontSize: 24,
    marginRight: 8,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#9333EA',
  },
  locationText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 12,
  },
  input: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    marginBottom: 12,
  },
  suggestionsContainer: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    marginBottom: 12,
    maxHeight: 250,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  suggestionIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  suggestionTextContainer: {
    flex: 1,
  },
  suggestionText: {
    fontSize: 15,
    color: '#1F2937',
    fontWeight: '500',
  },
  suggestionSubtext: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 2,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  gpsButton: {
    backgroundColor: '#10B981',
  },
  saveButton: {
    backgroundColor: '#9333EA',
  },
  buttonIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  infoCard: {
    backgroundColor: '#DBEAFE',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    marginBottom: 16,
  },
  infoIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  infoContent: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1E40AF',
    marginBottom: 4,
  },
  infoText: {
    fontSize: 13,
    color: '#1E3A8A',
    lineHeight: 18,
  },
  clearButton: {
    backgroundColor: '#FEE2E2',
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#FCA5A5',
  },
  clearButtonText: {
    color: '#DC2626',
    fontSize: 14,
    fontWeight: '600',
  },
  privacyCard: {
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  privacyIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  privacyText: {
    flex: 1,
    fontSize: 12,
    color: '#6B7280',
    lineHeight: 18,
  },
});