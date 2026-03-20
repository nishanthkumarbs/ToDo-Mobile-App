import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, SafeAreaView, FlatList, TouchableOpacity } from 'react-native';
import { Calendar } from 'react-native-calendars';
import { getTodos } from '../services/api';
import { getSessionUser } from '../services/auth';
import { colors, priorityColors } from '../theme/colors';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';

export default function CalendarScreen({ navigation, isDark }) {
  const [todos, setTodos] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [markedDates, setMarkedDates] = useState({});
  const theme = isDark ? colors.dark : colors.light;

  const fetchTodos = async () => {
    try {
      const user = await getSessionUser();
      if (!user) return;
      
      const response = await getTodos(user.id);
      const data = response.data;
      setTodos(data);

      // Mark dates with tasks
      const marks = {};
      data.forEach(todo => {
        if (todo.dueDate) {
          const dateStr = todo.dueDate.split('T')[0];
          marks[dateStr] = { 
            marked: true, 
            dotColor: theme.primary,
            activeOpacity: 0
          };
        }
      });
      
      // Highlight selected date
      if (marks[selectedDate]) {
        marks[selectedDate] = { 
          ...marks[selectedDate], 
          selected: true, 
          selectedColor: theme.primary 
        };
      } else {
        marks[selectedDate] = { 
          selected: true, 
          selectedColor: theme.primary 
        };
      }
      
      setMarkedDates(marks);
    } catch (error) {
      console.error("Error fetching todos for calendar:", error);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchTodos();
    }, [selectedDate])
  );

  const onDayPress = (day) => {
    setSelectedDate(day.dateString);
  };

  const filteredTodos = todos.filter(todo => {
    if (!todo.dueDate) return false;
    return todo.dueDate.split('T')[0] === selectedDate;
  });

  const renderTodoItem = ({ item }) => (
    <TouchableOpacity 
      style={[styles.todoItem, { backgroundColor: theme.surface, borderColor: theme.border }]}
      onPress={() => navigation.navigate('TaskDetail', { task: item })}
    >
      <View style={styles.todoItemLeft}>
        <Ionicons 
          name={item.completed ? "checkmark-circle" : "ellipse-outline"} 
          size={24} 
          color={item.completed ? theme.success : theme.textSecondary} 
        />
        <View style={styles.todoTextContainer}>
          <Text style={[styles.todoTitle, { color: theme.text, textDecorationLine: item.completed ? 'line-through' : 'none' }]} numberOfLines={1}>
            {item.title}
          </Text>
          {item.reminder && (
            <Text style={[styles.todoDate, { color: theme.warning }]}>
               {new Date(item.reminder).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
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

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <Calendar
        key={isDark ? 'dark' : 'light'}
        theme={{
          backgroundColor: theme.background,
          calendarBackground: theme.surface,
          textSectionTitleColor: theme.textSecondary,
          selectedDayBackgroundColor: theme.primary,
          selectedDayTextColor: '#ffffff',
          todayTextColor: theme.primary,
          dayTextColor: theme.text,
          textDisabledColor: isDark ? '#444' : theme.border,
          dotColor: theme.primary,
          selectedDotColor: '#ffffff',
          arrowColor: theme.primary,
          monthTextColor: theme.text,
          indicatorColor: theme.primary,
          textDayFontWeight: '500',
          textMonthFontWeight: 'bold',
          textDayHeaderFontWeight: '600',
        }}
        markedDates={markedDates}
        onDayPress={onDayPress}
      />
      
      <View style={styles.listHeader}>
        <Text style={[styles.listTitle, { color: theme.text }]}>
          Tasks for {new Date(selectedDate).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}
        </Text>
      </View>

      <FlatList
        data={filteredTodos}
        keyExtractor={item => item.id.toString()}
        renderItem={renderTodoItem}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyText, { color: theme.textSecondary }]}>No tasks for this date</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listHeader: {
    padding: 16,
    paddingBottom: 8,
  },
  listTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  listContent: {
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
    fontSize: 14,
  },
});
