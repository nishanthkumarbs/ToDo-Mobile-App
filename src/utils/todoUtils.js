import { createTodo } from '../services/api';

/**
 * Handles the logic for creating the next occurrence of a recurring task.
 * @param {Object} task - The current task being completed.
 * @returns {Promise<Object|null>} - The newly created todo response or null.
 */
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
