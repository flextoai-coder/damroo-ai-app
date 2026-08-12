import { Tabs } from 'expo-router';

import { FloatingTabBar } from '@/components/shell/floating-tab-bar';
import { tabSlideInterpolator, tabSlideTransitionSpec } from '@/constants/tab-transition';

export default function TabsLayout() {
  return (
    <Tabs
      tabBar={(props) => <FloatingTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: '#FBEEE0' },
        // Directional slide between tabs — feels swipeable, based on tab order.
        sceneStyleInterpolator: tabSlideInterpolator,
        transitionSpec: tabSlideTransitionSpec,
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
