import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import HomeScreen from '../screens/HomeScreen';
import PeopleScreen from '../screens/PeopleScreen';

const Tab = createBottomTabNavigator();


export default function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#666',
        tabBarInactiveTintColor: '#999',
      tabBarStyle: {
        borderTopWidth: 0,
        backgroundColor: '#FAFAFA',
        paddingBottom: 8,
        paddingTop: 8,
        height: 70,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 8,
      },
      tabBarLabelStyle: {
        fontSize: 12,
        fontWeight: '500',
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
          tabBarLabel: 'Add',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'add' : 'add-outline'} size={24} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="PeopleTab"
        component={PeopleScreen}
        options={{
          tabBarLabel: 'Roster',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'people' : 'people-outline'} size={24} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

