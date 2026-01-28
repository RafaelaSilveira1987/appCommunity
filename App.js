import React, { useEffect } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { StatusBar } from "expo-status-bar";
import { setupImmersiveMode } from "./src/utils/immersiveMode";
import AuthStack from "./src/navigation/AuthStack";
import { AuthProvider } from "./src/contexts/AuthContext";

export default function App() {
  useEffect(() => {
    setupImmersiveMode();
  }, []);

  return (
    <AuthProvider>
      <NavigationContainer>
        <StatusBar style="light" hidden={true} />
        <AuthStack />
      </NavigationContainer>
    </AuthProvider>
  );
}