import React, { useState } from 'react';
import { 
  View, Text, StyleSheet, TextInput, TouchableOpacity, 
  ScrollView, Alert, ActivityIndicator, Modal 
} from 'react-native';
import { updateTodo, deleteTodo, createTodo } from '../services/api';
import { handleRecurringTask } from '../utils/todoUtils';
import { colors, priorityColors } from '../theme/colors';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { Platform } from 'react-native';
import Constants, { ExecutionEnvironment } from 'expo-constants';

const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;
let Notifications;
if (!isExpoGo) {
  Notifications = require('expo-notifications');
}

export default function TaskDetailScreen({ route, navigation, isDark }) {
  const { task } = route.params;
  const theme = isDark ? colors.dark : colors.light;

  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description || '');
  const [priority, setPriority] = useState(task.priority);
  const [completed, setCompleted] = useState(task.completed);
  const [dueDate, setDueDate] = useState(task.dueDate ? new Date(task.dueDate) : null);
  const [recurring, setRecurring] = useState(task.repeat || 'none');
  const [reminder, setReminder] = useState(task.reminder ? new Date(task.reminder) : null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showReminderPicker, setShowReminderPicker] = useState(false);
  const [showRecurringModal, setShowRecurringModal] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleUpdate = async () => {
    setLoading(true);
    try {
      await updateTodo(task.id, {
        title,
        description,
        priority,
        completed,
        dueDate: dueDate ? dueDate.toISOString() : null,
        repeat: recurring,
        reminder: reminder ? reminder.toISOString() : null,
        userId: task.userId
      });

      // Manage notifications on update (Skip in Expo Go)
      if (!isExpoGo && Notifications) {
        try {
          // 1. Cancel any existing notification for this task
          await Notifications.cancelAllScheduledNotificationsAsync(); 
          
          if (!completed && reminder && new Date(reminder) > new Date()) {
            await Notifications.scheduleNotificationAsync({
              content: {
                title: "⏰ Task Reminder",
                body: `It's time for: ${title}`,
                data: { todoId: task.id },
              },
              trigger: new Date(reminder),
            });
          }
        } catch (err) {
          console.error("Notification management failed:", err);
        }
      }

      // Handle Recurring Task recreation if just marked as completed
      if (!task.completed && completed && recurring !== 'none') {
        try {
          await handleRecurringTask({
            ...task,
            title,
            description,
            priority,
            dueDate: dueDate ? dueDate.toISOString() : null,
            repeat: recurring,
            reminder: reminder ? reminder.toISOString() : null,
          });
        } catch (recurringError) {
          console.error("Failed to create next recurring task:", recurringError);
        }
      }

      navigation.goBack();
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Failed to update task');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      "Delete Task",
      "Are you sure you want to delete this task?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete", 
          style: "destructive",
          onPress: async () => {
            try {
              await deleteTodo(task.id);
              navigation.goBack();
            } catch (error) {
              console.error(error);
              Alert.alert('Error', 'Failed to delete task');
            }
          }
        }
      ]
    );
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.section, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        
        <View style={styles.headerRow}>
          <TouchableOpacity 
            style={styles.checkbox}
            onPress={() => setCompleted(!completed)}
          >
            <Ionicons 
              name={completed ? "checkmark-circle" : "ellipse-outline"} 
              size={32} 
              color={completed ? theme.success : theme.textSecondary} 
            />
          </TouchableOpacity>
          <TextInput
            style={[
              styles.titleInput, 
              { color: theme.text, textDecorationLine: completed ? 'line-through' : 'none' }
            ]}
            value={title}
            onChangeText={setTitle}
            multiline
          />
        </View>

      </View>

      <View style={[styles.section, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <View style={styles.settingLabel}>
          <View style={styles.iconContainer}>
            <Ionicons name="document-text-outline" size={20} color={theme.textSecondary} />
          </View>
          <Text style={[styles.settingText, { color: theme.text }]}>Description</Text>
        </View>
        <View style={styles.divider} />
        <TextInput
          style={[styles.descriptionInput, { color: theme.text }]}
          placeholder="Add a description..."
          placeholderTextColor={theme.textSecondary}
          value={description}
          onChangeText={setDescription}
          multiline
        />
      </View>

      <View style={[styles.section, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        
        <View style={styles.settingRow}>
          <View style={styles.settingLabel}>
            <View style={styles.iconContainer}>
              <Ionicons name="flag-outline" size={20} color={theme.textSecondary} />
            </View>
            <Text style={[styles.settingText, { color: theme.text }]}>Priority</Text>
          </View>
          <View style={styles.prioritySelector}>
            {['low', 'medium', 'high'].map(p => (
              <TouchableOpacity
                key={p}
                style={[
                  styles.priorityOption,
                  { borderColor: priorityColors[p] },
                  priority === p ? { backgroundColor: priorityColors[p] + '20' } : null
                ]}
                onPress={() => setPriority(p)}
              >
                <Text style={{ color: priorityColors[p], fontSize: 12 }}>{p.toUpperCase()}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.settingRow}>
          <View style={styles.settingLabel}>
            <View style={styles.iconContainer}>
              <Ionicons name="calendar-outline" size={20} color={theme.textSecondary} />
            </View>
            <Text style={[styles.settingText, { color: theme.text }]}>Due Date</Text>
          </View>
          <TouchableOpacity 
            style={styles.datePickerButton}
            onPress={() => {
              if (Platform.OS === 'android') {
                DateTimePickerAndroid.open({
                  value: dueDate || new Date(),
                  mode: 'date',
                  onChange: (event, date) => {
                    if (event.type === 'set' && date) setDueDate(date);
                  }
                });
              } else {
                setShowDatePicker(true);
              }
            }}
          >
            <Text style={{ color: dueDate ? theme.primary : theme.textSecondary }}>
              {dueDate ? dueDate.toLocaleDateString() : 'Set Date'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.divider} />

        <View style={styles.settingRow}>
          <View style={styles.settingLabel}>
            <View style={styles.iconContainer}>
              <Ionicons name="repeat-outline" size={20} color={theme.textSecondary} />
            </View>
            <Text style={[styles.settingText, { color: theme.text }]}>Recurring</Text>
          </View>
          <TouchableOpacity 
            style={[styles.dropdownButton, { borderColor: theme.border }]}
            onPress={() => setShowRecurringModal(true)}
          >
            <Text style={{ color: theme.text, fontSize: 14 }}>
              {recurring.charAt(0).toUpperCase() + recurring.slice(1)}
            </Text>
            <Ionicons name="chevron-down" size={16} color={theme.textSecondary} />
          </TouchableOpacity>
        </View>

        <View style={styles.divider} />

        <View style={styles.settingRow}>
          <View style={styles.settingLabel}>
            <View style={styles.iconContainer}>
              <Ionicons name="notifications-outline" size={20} color={theme.textSecondary} />
            </View>
            <Text style={[styles.settingText, { color: theme.text }]}>Reminder</Text>
          </View>
          <TouchableOpacity 
            style={styles.datePickerButton}
            onPress={() => {
              if (Platform.OS === 'android') {
                DateTimePickerAndroid.open({
                  value: reminder || new Date(),
                  mode: 'time',
                  onChange: (event, date) => {
                    if (event.type === 'set' && date) setReminder(date);
                  }
                });
              } else {
                setShowReminderPicker(true);
              }
            }}
          >
            <Text style={{ color: reminder ? theme.primary : theme.textSecondary }}>
              {reminder ? reminder.toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }) : 'Set Reminder'}
            </Text>
          </TouchableOpacity>
        </View>

        {Platform.OS === 'ios' && showDatePicker && (
          <DateTimePicker
            value={dueDate || new Date()}
            mode="date"
            display="default"
            onChange={(event, date) => {
              setShowDatePicker(false);
              if (event.type === 'set' && date) setDueDate(date);
            }}
          />
        )}
        
        {Platform.OS === 'ios' && showReminderPicker && (
          <DateTimePicker
            value={reminder || new Date()}
            mode="time"
            display="default"
            onChange={(event, date) => {
              setShowReminderPicker(false);
              if (event.type === 'set' && date) setReminder(date);
            }}
          />
        )}
        
        {/* Recurring Modal Dropdown */}
        <Modal
          visible={showRecurringModal}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowRecurringModal(false)}
        >
          <TouchableOpacity 
            style={styles.modalOverlay} 
            activeOpacity={1} 
            onPress={() => setShowRecurringModal(false)}
          >
            <View style={[styles.dropdownContent, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              {['none', 'daily', 'weekly', 'monthly'].map((r) => (
                <TouchableOpacity
                  key={r}
                  style={[
                    styles.dropdownItem,
                    recurring === r ? { backgroundColor: theme.primary + '15' } : null
                  ]}
                  onPress={() => {
                    setRecurring(r);
                    setShowRecurringModal(false);
                  }}
                >
                  <Text style={[
                    styles.dropdownItemText, 
                    { color: recurring === r ? theme.primary : theme.text }
                  ]}>
                    {r.charAt(0).toUpperCase() + r.slice(1)}
                  </Text>
                  {recurring === r && (
                    <Ionicons name="checkmark" size={20} color={theme.primary} />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </TouchableOpacity>
        </Modal>
      </View>

      <View style={styles.actionButtons}>
        <TouchableOpacity 
          style={[styles.saveButton, { backgroundColor: theme.primary }]}
          onPress={handleUpdate}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.saveButtonText}>Save Changes</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.deleteButton, { borderColor: theme.danger }]}
          onPress={handleDelete}
        >
          <Ionicons name="trash-outline" size={20} color={theme.danger} />
          <Text style={[styles.deleteButtonText, { color: theme.danger }]}>Delete Task</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  section: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    marginRight: 12,
  },
  titleInput: {
    flex: 1,
    fontSize: 20,
    fontWeight: 'bold',
  },
  divider: {
    height: 1,
    backgroundColor: '#00000010',
    marginVertical: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  descriptionInput: {
    fontSize: 16,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  settingLabel: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 32,
    alignItems: 'center',
    marginRight: 4,
  },
  settingText: {
    fontSize: 15,
    fontWeight: '500',
  },
  prioritySelector: {
    flexDirection: 'row',
    gap: 8,
  },
  priorityOption: {
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  datePickerButton: {
    padding: 8,
  },
  dropdownButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    minWidth: 110,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  dropdownContent: {
    width: '80%',
    borderRadius: 12,
    borderWidth: 1,
    padding: 8,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 8,
  },
  dropdownItemText: {
    fontSize: 16,
    fontWeight: '500',
  },
  actionButtons: {
    gap: 12,
    marginBottom: 40,
  },
  saveButton: {
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  deleteButton: {
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  deleteButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
});
