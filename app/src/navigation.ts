import { useNavigation, type CompositeNavigationProp, type NavigatorScreenParams } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

export type TabParamList = {
  Home: undefined;
  Explore: undefined;
  Competitions: undefined;
  Profile: undefined;
};

export type TabName = keyof TabParamList;

export type RootStackParamList = {
  Tabs: NavigatorScreenParams<TabParamList>;
  CompetitionDetails: { id: string };
};

// For tab screens: switch tabs, or open a competition on the root stack.
export const useAppNavigation = () =>
  useNavigation<CompositeNavigationProp<BottomTabNavigationProp<TabParamList>, NativeStackNavigationProp<RootStackParamList>>>();
