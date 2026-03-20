import { createTodo } from '../services/api';
import { Platform } from 'react-native';
import Constants, { ExecutionEnvironment } from 'expo-constants';

const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

/**
 * Plays a satisfying sound when a task is completed.
 */
export const playCompletionSound = async () => {
  try {
    // Dynamic require to prevent crash if native module is missing
    const { Audio } = require('expo-av');
    
    if (!Audio) return;

    const { sound } = await Audio.Sound.createAsync(
      { uri: 'https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3' },
      { shouldPlay: true, volume: 0.5 }
    );
    
    // Automatically unload sound from memory when done
    sound.setOnPlaybackStatusUpdate((status) => {
      if (status.didJustFinish) {
        sound.unloadAsync();
      }
    });
  } catch (error) {
    console.log("Error playing completion sound:", error);
  }
};

/**
 * Handles the logic for creating the next occurrence of a recurring task.
... (existing handleRecurringTask logic)
**/
export const handleRecurringTask = async (task) => {
  if (!task.repeat || task.repeat === 'none') return null;

  let newDueDate = null;
  let newReminder = null;

  if (task.dueDate) {
    const d = new Date(task.dueDate);
    if (task.repeat === 'daily') d.setDate(d.getDate() + 1);
    else if (task.repeat === 'weekly') d.setDate(d.getDate() + 7);
    else if (task.repeat === 'monthly') d.setMonth(d.getMonth() + 1);
    newDueDate = d.toISOString();
  }

  if (task.reminder) {
    const r = new Date(task.reminder);
    if (task.repeat === 'daily') r.setDate(r.getDate() + 1);
    else if (task.repeat === 'weekly') r.setDate(r.getDate() + 7);
    else if (task.repeat === 'monthly') r.setMonth(r.getMonth() + 1);
    newReminder = r.toISOString();
  }

  try {
    const response = await createTodo({
      title: task.title,
      description: task.description,
      priority: task.priority,
      completed: false, // next occurrence is pending
      dueDate: newDueDate,
      repeat: task.repeat,
      reminder: newReminder,
      userId: task.userId
    });
    return response;
  } catch (error) {
    console.error("Failed to create next recurring task:", error);
    return null;
  }
};
