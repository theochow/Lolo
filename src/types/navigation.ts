import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';

export type RootStackParamList = {
  Auth: undefined;
  Signup: undefined;
  DisplayName: undefined;
  RelationshipStatus: { displayName: string | null };
  PrimaryIntents: { displayName: string | null; relationshipStatus: string | null };
  MainTabs: undefined;
  LogDate: { personId?: string; dateId?: string } | undefined;
  PersonProfile: { personId: string };
  AddPerson: undefined;
  EditProfile: undefined;
};

export type MainTabParamList = {
  home: undefined;
  PeopleTab: undefined;
  LogDateTab: undefined;
};

export type AuthScreenProps = NativeStackScreenProps<RootStackParamList, 'Auth'>;
export type HomeScreenProps = BottomTabScreenProps<MainTabParamList, 'home'> & {
  navigation: NativeStackScreenProps<RootStackParamList>['navigation'];
};
export type LogDateScreenProps = NativeStackScreenProps<RootStackParamList, 'LogDate'>;
export type PeopleScreenProps = BottomTabScreenProps<MainTabParamList, 'PeopleTab'> & {
  navigation: NativeStackScreenProps<RootStackParamList>['navigation'];
};
export type PersonProfileScreenProps = NativeStackScreenProps<RootStackParamList, 'PersonProfile'>;
export type AddPersonScreenProps = NativeStackScreenProps<RootStackParamList, 'AddPerson'>;
export type SignupScreenProps = NativeStackScreenProps<RootStackParamList, 'Signup'>;
export type DisplayNameScreenProps = NativeStackScreenProps<RootStackParamList, 'DisplayName'>;
export type RelationshipStatusScreenProps = NativeStackScreenProps<RootStackParamList, 'RelationshipStatus'>;
export type PrimaryIntentsScreenProps = NativeStackScreenProps<RootStackParamList, 'PrimaryIntents'>;
