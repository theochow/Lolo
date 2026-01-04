import type { NativeStackScreenProps } from '@react-navigation/native-stack';

export type RootStackParamList = {
  Auth: undefined;
  Home: undefined;
  LogDate: undefined;
};

export type AuthScreenProps = NativeStackScreenProps<RootStackParamList, 'Auth'>;
export type HomeScreenProps = NativeStackScreenProps<RootStackParamList, 'Home'>;
export type LogDateScreenProps = NativeStackScreenProps<RootStackParamList, 'LogDate'>;
