import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
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
      <Ionicons name="add" size={24} color="#fff" />
    </TouchableOpacity>
  );
}

export default function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#5B8DEF',
        tabBarInactiveTintColor: '#999',
      tabBarStyle: {
        borderTopWidth: 0,
        backgroundColor: '#fff',
        paddingBottom: 8,
        paddingTop: 8,
        height: 70,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 8,
      },
      }}
    >
      <Tab.Screen
        name="home"
        component={HomeScreen}
        options={{
          tabBarLabel: 'Feed',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'home' : 'home-outline'} size={24} color={color} />
          ),
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
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'people' : 'people-outline'} size={24} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  logDateButton: {
    backgroundColor: '#5B8DEF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 24,
    marginTop: -6,
    shadowColor: '#5B8DEF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  logDateButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
});
