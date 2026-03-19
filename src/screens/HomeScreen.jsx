import React, { useEffect, useState, useCallback } from 'react';
import { 
  View, Text, StyleSheet, FlatList, TouchableOpacity, 
  ActivityIndicator, TextInput, Modal, SafeAreaView, RefreshControl
} from 'react-native';
import { getTodos, deleteTodo, createTodo, updateTodo } from '../services/api';
import { handleRecurringTask } from '../utils/todoUtils';
import { getSessionUser } from '../services/auth';
import { colors, priorityColors } from '../theme/colors';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { Platform, Alert } from 'react-native';
import Constants, { ExecutionEnvironment } from 'expo-constants';

const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;
let Notifications;
if (!isExpoGo) {
  Notifications = require('expo-notifications');
}

export default function HomeScreen({ navigation, isDark }) {
  const [todos, setTodos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('all'); // all, completed, pending
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('none'); // none, date, priority
  
  // Add Task Modal State
  const [modalVisible, setModalVisible] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState('low');
  const [newTaskDueDate, setNewTaskDueDate] = useState(null);
  const [newTaskReminder, setNewTaskReminder] = useState(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showReminderPicker, setShowReminderPicker] = useState(false);
  
  const theme = isDark ? colors.dark : colors.light;

  const fetchTodosData = async () => {
    try {
      const user = await getSessionUser();
      if (!user) return;
      
      const response = await getTodos(user.id);
      setTodos(response.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchTodosData();
    }, [])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchTodosData();
  }, []);

  // In-app reminders are now handled by native expo-notifications scheduled on creation/edit
  // This useEffect could be used to sync notifications, but for simplicity we schedule on write.

  const handleCreateTodo = async () => {
    if (!newTaskTitle.trim()) return;

    try {
      const user = await getSessionUser();
      if (!user) return;

      const newTodo = {
        title: newTaskTitle,
        description: '',
        completed: false,
        priority: newTaskPriority,
        dueDate: newTaskDueDate ? newTaskDueDate.toISOString() : null,
        reminder: newTaskReminder ? newTaskReminder.toISOString() : null,
        repeat: 'none',
        userId: user.id
      };

      const response = await createTodo(newTodo);
      
      // Schedule native notification if reminder is set (Skip in Expo Go)
      if (newTodo.reminder && !isExpoGo && Notifications) {
        try {
          const trigger = new Date(newTodo.reminder);
          if (trigger > new Date()) {
            await Notifications.scheduleNotificationAsync({
              content: {
                title: "⏰ Task Reminder",
                body: `It's time for: ${newTodo.title}`,
                data: { todoId: response.data.id },
              },
              trigger,
            });
          }
        } catch (notificationError) {
          console.error("Failed to schedule notification:", notificationError);
          // Don't throw - we want the UI to refresh even if notification fails
        }
      }

      setModalVisible(false);
      setNewTaskTitle('');
      setNewTaskPriority('low');
      setNewTaskDueDate(null);
      setNewTaskReminder(null);
      onRefresh();
    } catch (error) {
      console.error("Error creating todo:", error);
    }
  };
  const filteredTodos = todos
    .filter(todo => {
      if (filter === 'completed') return todo.completed;
      if (filter === 'pending') return !todo.completed;
      return true;
    })
    .filter(todo => todo.title.toLowerCase().includes(searchQuery.toLowerCase()))
    .sort((a, b) => {
      if (sortBy === 'date') {
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return new Date(a.dueDate) - new Date(b.dueDate);
      }
      if (sortBy === 'priority') {
        const weights = { high: 0, medium: 1, low: 2 };
        return weights[a.priority] - weights[b.priority];
      }
      return 0;
    });

  const handleToggleComplete = async (item) => {
    const newCompletedStatus = !item.completed;
    try {
      // 1. Update the task
      await updateTodo(item.id, {
        ...item,
        completed: newCompletedStatus
      });

      // 2. Handle Notifications (Skip in Expo Go)
      if (!isExpoGo && Notifications) {
        try {
          if (newCompletedStatus) {
            // Task completed, cancel any pending notifications
            await Notifications.cancelAllScheduledNotificationsAsync();
          } else if (item.reminder && new Date(item.reminder) > new Date()) {
            // Task uncompleted, reschedule notification if reminder is in the future
            await Notifications.scheduleNotificationAsync({
              content: {
                title: "⏰ Task Reminder",
                body: `It's time for: ${item.title}`,
                data: { todoId: item.id },
              },
              trigger: new Date(item.reminder),
            });
          }
        } catch (notificationError) {
          console.error("Failed to update notification during toggle:", notificationError);
        }
      }

      // 3. Handle Recurring logic
      if (!item.completed && newCompletedStatus && item.repeat && item.repeat !== 'none') {
        const nextOccurrence = await handleRecurringTask(item);
        if (nextOccurrence && !isExpoGo && Notifications && nextOccurrence.data.reminder) {
          const trigger = new Date(nextOccurrence.data.reminder);
          if (trigger > new Date()) {
            await Notifications.scheduleNotificationAsync({
              content: {
                title: "⏰ Task Reminder",
                body: `It's time for: ${nextOccurrence.data.title}`,
                data: { todoId: nextOccurrence.data.id },
              },
              trigger,
            });
          }
        }
      }

      // 4. Update UI
      onRefresh();
    } catch (error) {
      console.error("Failed to toggle task completion:", error);
      Alert.alert('Error', 'Failed to update task status');
    }
  };

  const renderTodoItem = ({ item }) => (
    <TouchableOpacity 
      style={[styles.todoItem, { backgroundColor: theme.surface, borderColor: theme.border }]}
      onPress={() => navigation.navigate('TaskDetail', { task: item })}
    >
      <View style={styles.todoItemLeft}>
        <TouchableOpacity 
          style={styles.checkboxTouch} 
          onPress={() => handleToggleComplete(item)}
        >
          <Ionicons 
            name={item.completed ? "checkmark-circle" : "ellipse-outline"} 
            size={24} 
            color={item.completed ? theme.success : theme.textSecondary} 
          />
        </TouchableOpacity>
        <View style={styles.todoTextContainer}>
          <Text style={[styles.todoTitle, { color: theme.text, textDecorationLine: item.completed ? 'line-through' : 'none' }]} numberOfLines={1}>
            {item.title}
          </Text>
          {item.dueDate && (
            <Text style={[styles.todoDate, { color: theme.textSecondary }]}>
              <Ionicons name="calendar-outline" size={12} color={theme.textSecondary} /> {new Date(item.dueDate).toLocaleDateString()}
            </Text>
          )}
          {item.repeat && item.repeat !== 'none' && (
            <Text style={[styles.todoDate, { color: theme.primary }]}>
               <Ionicons name="repeat-outline" size={12} /> {item.repeat}
            </Text>
          )}
          {item.reminder && (
            <Text style={[styles.todoDate, { color: theme.warning }]}>
               <Ionicons name="notifications-outline" size={12} /> {new Date(item.reminder).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </Text>
          )}
        </View>
      </View>
      <View style={[styles.priorityBadge, { backgroundColor: priorityColors[item.priority] + '20' }]}>
        <Text style={[styles.priorityText, { color: priorityColors[item.priority] }]}>
          {item.priority.charAt(0).toUpperCase() + item.priority.slice(1)}
        </Text>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={[styles.centered, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color={theme.textSecondary} style={styles.searchIcon} />
        <TextInput
          style={[styles.searchInput, { color: theme.text, backgroundColor: theme.surface }]}
          placeholder="Search tasks..."
          placeholderTextColor={theme.textSecondary}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <View style={styles.filterContainer}>
        {['all', 'pending', 'completed'].map(f => (
          <TouchableOpacity
            key={f}
            style={[
              styles.filterChip,
              filter === f ? { backgroundColor: theme.primary } : { backgroundColor: theme.surface, borderColor: theme.border }
            ]}
            onPress={() => setFilter(f)}
          >
            <Text style={[
              styles.filterText,
              filter === f ? { color: 'white' } : { color: theme.textSecondary }
            ]}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
        
        <View style={{ flex: 1 }} />
        
        <TouchableOpacity
          style={[styles.filterChip, { backgroundColor: sortBy !== 'none' ? theme.primary : theme.surface, borderColor: theme.border }]}
          onPress={() => {
            const nextSort = sortBy === 'none' ? 'date' : sortBy === 'date' ? 'priority' : 'none';
            setSortBy(nextSort);
          }}
        >
          <Ionicons 
            name="swap-vertical" 
            size={14} 
            color={sortBy !== 'none' ? 'white' : theme.textSecondary} 
          />
          <Text style={[styles.filterText, { color: sortBy !== 'none' ? 'white' : theme.textSecondary, marginLeft: 4 }]}>
            {sortBy === 'none' ? 'Sort' : sortBy === 'date' ? 'By Date' : 'By Rank'}
          </Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={filteredTodos}
        keyExtractor={item => item.id.toString()}
        renderItem={renderTodoItem}
        contentContainerStyle={styles.listContainer}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyText, { color: theme.textSecondary }]}>No tasks found</Text>
          </View>
        }
      />

      <TouchableOpacity 
        style={[styles.fab, { backgroundColor: theme.primary }]}
        onPress={() => setModalVisible(true)}
      >
        <Ionicons name="add" size={24} color="white" />
      </TouchableOpacity>

      {/* Add Task Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay} 
          activeOpacity={1} 
          onPress={() => setModalVisible(false)}
        >
          <View style={[styles.modalContent, { backgroundColor: theme.surface }]}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>Add New Task</Text>
            
            <TextInput
              style={[styles.modalInput, { color: theme.text, borderColor: theme.border }]}
              placeholder="Task Title"
              placeholderTextColor={theme.textSecondary}
              value={newTaskTitle}
              onChangeText={setNewTaskTitle}
              autoFocus
            />

            <Text style={[styles.modalLabel, { color: theme.textSecondary }]}>Priority</Text>
            <View style={styles.prioritySelector}>
              {['low', 'medium', 'high'].map(p => (
                <TouchableOpacity
                  key={p}
                  style={[
                    styles.priorityOption,
                    { borderColor: priorityColors[p] },
                    newTaskPriority === p ? { backgroundColor: priorityColors[p] + '20' } : null
                  ]}
                  onPress={() => setNewTaskPriority(p)}
                >
                  <Text style={{ color: priorityColors[p] }}>{p.charAt(0).toUpperCase() + p.slice(1)}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.settingRow}>
              <View style={styles.settingLabel}>
                <Ionicons name="calendar-outline" size={20} color={theme.textSecondary} />
                <Text style={[styles.modalLabel, { color: theme.textSecondary, marginBottom: 0 }]}>Due Date</Text>
              </View>
              <TouchableOpacity 
                style={styles.datePickerButton}
                onPress={() => {
                  if (Platform.OS === 'android') {
                    DateTimePickerAndroid.open({
                      value: newTaskDueDate || new Date(),
                      mode: 'date',
                      onChange: (event, date) => {
                        if (event.type === 'set' && date) setNewTaskDueDate(date);
                      }
                    });
                  } else {
                    setShowDatePicker(true);
                  }
                }}
              >
                <Text style={{ color: newTaskDueDate ? theme.primary : theme.textSecondary }}>
                  {newTaskDueDate ? newTaskDueDate.toLocaleDateString() : 'Set Date'}
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.settingRow}>
               <View style={styles.settingLabel}>
                 <Ionicons name="notifications-outline" size={20} color={theme.textSecondary} />
                 <Text style={[styles.modalLabel, { color: theme.textSecondary, marginBottom: 0 }]}>Reminder</Text>
               </View>
               <TouchableOpacity 
                 style={styles.datePickerButton}
                 onPress={() => {
                  if (Platform.OS === 'android') {
                    DateTimePickerAndroid.open({
                      value: newTaskReminder || new Date(),
                      mode: 'time',
                      onChange: (event, date) => {
                        if (event.type === 'set' && date) setNewTaskReminder(date);
                      }
                    });
                  } else {
                    setShowReminderPicker(true);
                  }
                 }}
               >
                 <Text style={{ color: newTaskReminder ? theme.primary : theme.textSecondary }}>
                   {newTaskReminder ? newTaskReminder.toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }) : 'Set Reminder'}
                 </Text>
               </TouchableOpacity>
            </View>

            {Platform.OS === 'ios' && showDatePicker && (
              <DateTimePicker
                value={newTaskDueDate || new Date()}
                mode="date"
                display="default"
                onChange={(event, date) => {
                  setShowDatePicker(false);
                  if (event.type === 'set' && date) setNewTaskDueDate(date);
                }}
              />
            )}
            
            {Platform.OS === 'ios' && showReminderPicker && (
              <DateTimePicker
                value={newTaskReminder || new Date()}
                mode="time"
                display="default"
                onChange={(event, date) => {
                  setShowReminderPicker(false);
                  if (event.type === 'set' && date) setNewTaskReminder(date);
                }}
              />
            )}

            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.modalButton, { backgroundColor: theme.border }]}
                onPress={() => setModalVisible(false)}
              >
                <Text style={{ color: theme.text }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalButton, { backgroundColor: theme.primary }]}
                onPress={handleCreateTodo}
              >
                <Text style={{ color: 'white' }}>Create</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  searchIcon: {
    position: 'absolute',
    left: 28,
    top: 28,
    zIndex: 1,
  },
  searchInput: {
    flex: 1,
    height: 44,
    borderRadius: 22,
    paddingLeft: 40,
    paddingRight: 16,
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  filterText: {
    fontWeight: '600',
    fontSize: 12,
  },
  listContainer: {
    padding: 16,
  },
  todoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
  },
  todoItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  checkboxTouch: {
    padding: 8,
    marginLeft: -8,
  },
  todoTextContainer: {
    marginLeft: 12,
    flex: 1,
  },
  todoTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  todoDate: {
    fontSize: 12,
    marginTop: 4,
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  priorityText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  emptyContainer: {
    padding: 32,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 48,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  modalInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 16,
  },
  modalLabel: {
    fontSize: 14,
    marginBottom: 8,
    fontWeight: '600',
  },
  prioritySelector: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 24,
  },
  priorityOption: {
    flex: 1,
    borderWidth: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    padding: 16,
    alignItems: 'center',
    borderRadius: 8,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  settingLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  datePickerButton: {
    padding: 8,
  },
});
