import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import HomeScreen from '../screens/HomeScreen';
import PeopleScreen from '../screens/PeopleScreen';
import { Text, TouchableOpacity, StyleSheet } from 'react-native';
import { RootStackParamList } from '../types/navigation';

const Tab = createBottomTabNavigator();

// Custom Log Date button component for tab bar
function LogDateTabButton() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  return (
    <TouchableOpacity
      style={styles.logDateButton}
      onPress={() => navigation.navigate('LogDate')}
    >
      <Text style={styles.logDateButtonText}>+ Log Date</Text>
    </TouchableOpacity>
  );
}

export default function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#007AFF',
        tabBarInactiveTintColor: '#999',
        tabBarStyle: {
          borderTopWidth: 1,
          borderTopColor: '#e0e0e0',
          paddingBottom: 5,
          paddingTop: 5,
          height: 60,
        },
      }}
    >
      <Tab.Screen
        name="HomeTab"
        component={HomeScreen}
        options={{
          tabBarLabel: 'Home',
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 20 }}>🏠</Text>,
        }}
      />
      <Tab.Screen
        name="LogDateTab"
        component={HomeScreen}
        listeners={({ navigation }) => ({
          tabPress: (e) => {
            e.preventDefault();
            (navigation as any).navigate('LogDate');
          },
        })}
        options={{
          tabBarLabel: '',
          tabBarIcon: () => <LogDateTabButton />,
        }}
      />
      <Tab.Screen
        name="PeopleTab"
        component={PeopleScreen}
        options={{
          tabBarLabel: 'People',
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 20 }}>👥</Text>,
        }}
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  logDateButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginTop: -8,
  },
  logDateButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});
