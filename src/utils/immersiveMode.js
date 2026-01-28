import { Platform } from "react-native";
import * as NavigationBar from "expo-navigation-bar";
import { StatusBar } from "expo-status-bar";

export const setupImmersiveMode = async () => {
  if (Platform.OS === "android") {
    try {
      // Oculta completamente a barra de navegação e a barra de status
      await NavigationBar.setVisibilityAsync("hidden");

      // Define o comportamento 'sticky-swipe': as barras aparecem ao deslizar e somem sozinhas depois
      await NavigationBar.setBehaviorAsync("sticky-swipe");

      // Garante que o conteúdo se estenda por toda a tela
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
