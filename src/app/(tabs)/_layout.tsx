import { Tabs } from 'expo-router';

import { FloatingTabBar } from '@/components/shell/floating-tab-bar';

export default function TabsLayout() {
  return (
    <Tabs
      tabBar={(props) => <FloatingTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: '#FBEEE0' },
        // No navigator-level transition — the directional slide is owned
        // entirely by AppScreen's own Reanimated transform (see its
        // `tabIndex` prop). Leaving this navigator animation enabled would
        // keep react-native-screens' native attach/detach state
        // (`activityState`) driven by React Navigation's own internal
        // Animated value, which is the thing that was getting stuck and
        // leaving screens blank in the first place.
        animation: 'none',
        // Floating custom bar — height 0 so the navigator doesn't reserve a
        // bottom strip (that empty band was shrinking the Android viewport).
        tabBarStyle: {
          position: 'absolute',
          height: 0,
          backgroundColor: 'transparent',
          borderTopWidth: 0,
          elevation: 0,
        },
      }}>
      <Tabs.Screen name="index" options={{ title: 'Home' }} />
      <Tabs.Screen name="templates" options={{ title: 'Templates' }} />
      <Tabs.Screen name="brand-kit" options={{ title: 'Brand Kit' }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile' }} />
      {/* Hidden — opened from the FAB “Generate Image” action */}
      <Tabs.Screen
        name="assistant"
        options={{ href: null, title: 'Playground' }}
      />
    </Tabs>
  );
}
