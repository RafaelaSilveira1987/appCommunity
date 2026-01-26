import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// Configurar comportamento das notificações
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export const NotificationService = {
  // Pedir permissão
  async requestPermission() {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    
    return finalStatus === 'granted';
  },

  // Agendar notificação local de teste
  async scheduleTestNotification() {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: "Teste de Notificação! 📬",
        body: 'As notificações estão funcionando!',
        data: { test: true },
      },
      trigger: { seconds: 2 },
    });
  },

  // Notificação imediata
  async sendImmediateNotification(title, body) {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: title,
        body: body,
      },
      trigger: null, // imediato
    });
  },
};