import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useAuth } from "../contexts/AuthContext";
import LoginScreen from "../screens/LoginScreen";
import RequestAccessScreen from "../screens/RequestAccessScreen";

import BottomTabs from "./BottomTabs";
import CreatePostScreen from "../screens/CreatePostScreen";

const Stack = createNativeStackNavigator();

export default function AuthStack() {
  const { user, loading } = useAuth();

  if (loading) return null;

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {user ? (
        <>
          {/* Telas para usuário logado */}
          <Stack.Screen name="Main" component={BottomTabs} />
          <Stack.Screen name="CreatePost" component={CreatePostScreen} />
        </>
      ) : (
        <>
          {/* Telas para usuário NÃO logado */}
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="RequestAccess" component={RequestAccessScreen} />
        </>
      )}
    </Stack.Navigator>
  );
}
