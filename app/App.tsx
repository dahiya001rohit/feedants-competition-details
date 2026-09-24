import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Poppins_400Regular } from '@expo-google-fonts/poppins/400Regular';
import { Poppins_500Medium } from '@expo-google-fonts/poppins/500Medium';
import { Poppins_600SemiBold } from '@expo-google-fonts/poppins/600SemiBold';
import { Poppins_700Bold } from '@expo-google-fonts/poppins/700Bold';
import { SessionProvider, useSession } from './src/session';
import { useT } from './src/i18n';
import type { RootStackParamList, TabName, TabParamList } from './src/navigation';
import { colors } from './src/theme';
import { ScreenState } from './src/components/ui';
import { BottomTabBar } from './src/components/BottomTabBar';
import { HomeScreen } from './src/screens/HomeScreen';
import { ExploreScreen } from './src/screens/ExploreScreen';
import { CompetitionListScreen } from './src/screens/CompetitionListScreen';
import { ProfileScreen } from './src/screens/ProfileScreen';
import { CompetitionDetailsScreen } from './src/screens/CompetitionDetailsScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<TabParamList>();

function Tabs() {
  return (
    <Tab.Navigator
      initialRouteName="Home"
      screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: colors.bg } }}
      tabBar={({ state, navigation }) => (
        <BottomTabBar active={state.routeNames[state.index] as TabName} onSelect={(tab) => navigation.navigate(tab)} />
      )}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Explore" component={ExploreScreen} />
      <Tab.Screen name="Competitions" component={CompetitionListScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

function Root() {
  const session = useSession();
  const t = useT();
  if (session.status !== 'ready') {
    return (
      <ScreenState error={session.status === 'error' ? t.serverDown : undefined} onRetry={session.retry} retryLabel={t.retry} />
    );
  }
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg } }}>
        <Stack.Screen name="Tabs" component={Tabs} />
        <Stack.Screen name="CompetitionDetails" component={CompetitionDetailsScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  const [fontsLoaded] = useFonts({ Poppins_400Regular, Poppins_500Medium, Poppins_600SemiBold, Poppins_700Bold });
  if (!fontsLoaded) return null;
  return (
    <SafeAreaProvider>
      <SessionProvider>
        <StatusBar style="dark" />
        <Root />
      </SessionProvider>
    </SafeAreaProvider>
  );
}
