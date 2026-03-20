import { Platform } from 'react-native';
import Constants, { ExecutionEnvironment } from 'expo-constants';

const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

// Helper to get the notifications module safely
const getNotifications = () => {
  if (isExpoGo) return null;
  try {
    return require('expo-notifications');
  } catch (error) {
    console.warn('Notifications module not available:', error);
    return null;
  }
};

/**
 * Initializes notification settings and channels.
 * Should be called on app startup.
 */
export async function initNotifications() {
  const Notifications = getNotifications();
  if (!Notifications) return false;

  // Set the notification handler for foreground notifications
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    return false;
  }

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('task-reminders', {
      name: 'Task Reminders',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
      sound: 'default',
    });
  }

  return true;
}

/**
 * Schedules a single notification for a task.
 * Using task.id as identifier ensures we don't have duplicate notifications for the same task.
 */
export async function scheduleTaskNotification(task) {
  const Notifications = getNotifications();
  if (!Notifications || !task.reminder || task.completed) return null;

  const triggerDate = new Date(task.reminder);
  const now = new Date();

  // Don't schedule if date is invalid or in the past
  if (isNaN(triggerDate.getTime()) || triggerDate <= now) {
    return null;
  }

  try {
    // Overwrite any existing notification for this task ID
    const identifier = await Notifications.scheduleNotificationAsync({
      identifier: String(task.id),
      content: {
        title: "Task Reminder",
        body: `It's time for: ${task.title}`,
        data: { todoId: task.id },
        sound: true,
        priority: Notifications.AndroidNotificationPriority.MAX,
      },
      trigger: {
        date: triggerDate,
        channelId: Platform.OS === 'android' ? 'task-reminders' : undefined,
        precision: 'exact',
      },
    });
    return identifier;
  } catch (error) {
    console.error("Error scheduling notification:", error);
    return null;
  }
}

/**
 * Cancels a specific task notification.
 */
export async function cancelTaskNotification(taskId) {
  const Notifications = getNotifications();
  if (!Notifications || !taskId) return;
  await Notifications.cancelScheduledNotificationAsync(String(taskId));
}

/**
 * Cancels all scheduled notifications.
 */
export async function cancelAllNotifications() {
  const Notifications = getNotifications();
  if (!Notifications) return;
  await Notifications.cancelAllScheduledNotificationsAsync();
}
