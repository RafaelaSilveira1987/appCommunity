import { Platform } from "react-native";
import * as NavigationBar from "expo-navigation-bar";
import { StatusBar } from "expo-status-bar";

export const setupImmersiveMode = async () => {
  if (Platform.OS === "android") {
    try {
      // Torna a barra de navegação translúcida
      await NavigationBar.setBackgroundColorAsync("#00000001");

      // Define comportamento da barra
      await NavigationBar.setBehaviorAsync("overlay-swipe");

      // Botões aparecem em branco
      await NavigationBar.setButtonStyleAsync("light");

      // Posição da barra (default ou inset-bottom)
      await NavigationBar.setPositionAsync("absolute");
    } catch (error) {
      console.log("Erro ao configurar modo imersivo:", error);
    }
  }
};

export const resetImmersiveMode = async () => {
  if (Platform.OS === "android") {
    try {
      await NavigationBar.setBackgroundColorAsync("#ffffff");
      await NavigationBar.setBehaviorAsync("inset-touch");
      await NavigationBar.setButtonStyleAsync("dark");
    } catch (error) {
      console.log("Erro ao resetar modo imersivo:", error);
    }
  }
};
