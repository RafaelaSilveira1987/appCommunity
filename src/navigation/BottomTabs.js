import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Alert } from "react-native";
import { Home, Users, User, Shield, PieChart } from "lucide-react-native";
import { useAuth } from "../contexts/AuthContext";
import HomeScreen from "../screens/HomeScreen";
import GroupsScreen from "../screens/GroupsScreen";
import GroupDetailScreen from "../screens/GroupDetailScreen";
import ProfileScreen from "../screens/ProfileScreen";
import GroupChatScreen from "../screens/GroupChatScreen";
import CreateGroupPostScreen from "../screens/CreateGroupPostScreen";
import PainelScreen from "../screens/PainelScreen";
import AdminApprovalScreen from "../screens/AdminApprovalScreen";

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function HomeStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="HomeScreen" component={HomeScreen} />
    </Stack.Navigator>
  );
}

function GroupsStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="GroupsScreen" component={GroupsScreen} />
      <Stack.Screen name="GroupDetail" component={GroupDetailScreen} />
      <Stack.Screen name="GroupChat" component={GroupChatScreen} />
      <Stack.Screen name="CreateGroupPost" component={CreateGroupPostScreen} />
    </Stack.Navigator>
  );
}

function ProfileStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="ProfileScreen" component={ProfileScreen} />
    </Stack.Navigator>
  );
}

function AdminStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="AdminApprovalScreen" component={AdminApprovalScreen} />
    </Stack.Navigator>
  );
}

export default function BottomTabs() {
  const { isAdmin } = useAuth();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#0047AB",
        tabBarInactiveTintColor: "#999",
        tabBarStyle: {
          backgroundColor: "#ffffff",
          borderTopWidth: 1,
          borderTopColor: "#eee",
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          marginTop: 4,
        },
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeStack}
        options={{
          tabBarLabel: "Feed",
          tabBarIcon: ({ color, size }) => <Home size={size} color={color} />,
        }}
      />

      <Tab.Screen
        name="Groups"
        component={GroupsStack}
        options={{
          tabBarLabel: "Grupos",
          tabBarIcon: ({ color, size }) => <Users size={size} color={color} />,
        }}
      />

      <Tab.Screen
        name="Painel"
        component={PainelScreen}
        options={{
          tabBarLabel: "Painel",
          tabBarIcon: ({ color, size }) => (
            <PieChart size={size} color={color} />
          ),
        }}
      />

      {/* Aba Admin - Sempre visível, mas com listener customizado */}
      <Tab.Screen
        name="Admin"
        component={AdminStack}
        options={{
          tabBarLabel: "Admin",
          tabBarIcon: ({ color, size }) => (
            <Shield size={size} color={isAdmin ? color : '#ccc'} />
          ),
        }}
        listeners={({ navigation }) => ({
          tabPress: (e) => {
            if (!isAdmin) {
              e.preventDefault();
              Alert.alert(
                'Acesso Restrito',
                'Apenas administradores podem acessar esta área.'
              );
            }
          },
        })}
      />

      <Tab.Screen
        name="Profile"
        component={ProfileStack}
        options={{
          tabBarLabel: "Perfil",
          tabBarIcon: ({ color, size }) => <User size={size} color={color} />,
        }}
      />
    </Tab.Navigator>
  );
}