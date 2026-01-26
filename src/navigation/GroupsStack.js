import { createNativeStackNavigator } from '@react-navigation/native-stack';

import GroupsScreen from '../screens/GroupsScreen';
import GroupDetailScreen from '../screens/GroupDetailScreen';
import GroupChatScreen from '../screens/GroupChatScreen';
import CreateGroupPostScreen from '../screens/CreateGroupPostScreen';

const Stack = createNativeStackNavigator();

export default function GroupsStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="GroupsScreen" component={GroupsScreen} />
      <Stack.Screen name="GroupDetail" component={GroupDetailScreen} />
      <Stack.Screen name="GroupChat" component={GroupChatScreen} />
      <Stack.Screen name="CreateGroupPost" component={CreateGroupPostScreen} />
    </Stack.Navigator>
  );
}
