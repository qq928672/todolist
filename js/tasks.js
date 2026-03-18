/**
 * tasks.js
 * 負責商務邏輯：任務的 CRUD、過濾、排序與統計計算
 */
import { Storage } from './storage.js';

class TaskManager {
  constructor() {
    this.tasks = []; // Now loads dynamically via loadTasks()
    // 預設狀態
    this.currentFilter = 'all'; // all, today, active, completed
    this.currentCategory = 'all'; // all, work, personal, study
    this.currentSort = 'created-desc';
  }

  async loadTasks() {
    this.tasks = await Storage.getTasks();
    // 初始化時重置習慣打卡
    this.resetHabits();
  }

  resetHabits() {
    const todayStr = new Date().toDateString();
    let hasChanges = false;
    this.tasks.forEach(task => {
      if (task.isHabit && task.completed) {
        if (!task.lastCompletedDate || task.lastCompletedDate !== todayStr) {
          task.completed = false; // Reset for the new day
          if (task.subtasks) {
            task.subtasks.forEach(st => st.completed = false);
          }
          hasChanges = true;
        }
      }
    });
    if (hasChanges) {
      this.save();
    }
  }

  // --- CRUD 操作 ---

  addTask(title, description, category, priority, dueDate, subtasks = [], isHabit = false) {
    const newTask = {
      id: Date.now().toString(), // 簡單產生 Unique ID
      title,
      description: description || '',
      category,
      priority,
      dueDate: dueDate || null,
      isHabit: isHabit,
      lastCompletedDate: null,
      completed: false,
      subtasks: subtasks,
      createdAt: new Date().toISOString()
    };
    this.tasks.push(newTask);
    this.save();
    return newTask;
  }

  updateTask(id, updates) {
    const index = this.tasks.findIndex(t => t.id === id);
    if (index !== -1) {
      this.tasks[index] = { ...this.tasks[index], ...updates };
      // 如果狀態改變為完成，檢查是否更新 Streak
      if (updates.completed === true) {
        this.checkCompletedToday();
      }
      this.save();
    }
  }

  deleteTask(id) {
    this.tasks = this.tasks.filter(t => t.id !== id);
    this.save();
  }

  toggleTaskStatus(id) {
    const task = this.tasks.find(t => t.id === id);
    if (task) {
      task.completed = !task.completed;
      if (task.completed && task.isHabit) {
        task.lastCompletedDate = new Date().toDateString();
      }
      this.save();
    }
  }

  toggleSubtaskStatus(taskId, subtaskId) {
    const task = this.getTaskById(taskId);
    if (!task) return;
    
    if (!task.subtasks) task.subtasks = [];
    const subtask = task.subtasks.find(s => s.id === subtaskId);
    if (subtask) {
      subtask.completed = !subtask.completed;
      this.save();
    }
  }

  getTaskById(id) {
    return this.tasks.find(t => t.id === id);
  }

  // --- 狀態設置 ---
  
  setFilter(filter) {
    this.currentFilter = filter;
  }

  setCategory(category) {
    this.currentCategory = category;
  }

  setSort(sortType) {
    this.currentSort = sortType;
  }

  // --- 獲取渲染資料 ---

  getFilteredAndSortedTasks() {
    let result = [...this.tasks];

    // 0. 基礎過濾：將一般任務與習慣分離
    if (this.currentFilter === 'habits') {
      result = result.filter(t => t.isHabit === true);
    } else {
      result = result.filter(t => !t.isHabit);
    }

    // 1. 依分類過濾
    if (this.currentCategory !== 'all') {
      result = result.filter(t => t.category === this.currentCategory);
    }

    // 2. 依狀態過濾
    const todayStr = new Date().toISOString().split('T')[0];
    switch(this.currentFilter) {
      case 'active':
        result = result.filter(t => !t.completed);
        break;
      case 'completed':
        result = result.filter(t => t.completed);
        break;
      case 'today':
        result = result.filter(t => t.dueDate === todayStr);
        break;
      case 'habits':
      case 'all':
      default:
        break;
    }

    // 3. 排序
    result.sort((a, b) => {
      switch(this.currentSort) {
        case 'created-asc':
          return new Date(a.createdAt) - new Date(b.createdAt);
        case 'created-desc':
          return new Date(b.createdAt) - new Date(a.createdAt);
        case 'due-asc':
          if(!a.dueDate) return 1;
          if(!b.dueDate) return -1;
          return new Date(a.dueDate) - new Date(b.dueDate);
        case 'due-desc':
          if(!a.dueDate) return 1;
          if(!b.dueDate) return -1;
          return new Date(b.dueDate) - new Date(a.dueDate);
        default:
          return 0;
      }
    });

    return result;
  }

  // --- 統計資訊 ---

  getTodayProgress() {
    const todayStr = new Date().toISOString().split('T')[0];
    const todayTasks = this.tasks.filter(t => t.dueDate === todayStr);
    
    if (todayTasks.length === 0) return 0;
    
    const completedToday = todayTasks.filter(t => t.completed).length;
    return Math.round((completedToday / todayTasks.length) * 100);
  }

  save() {
    Storage.saveTasks(this.tasks);
  }
}

// 建立單例匯出
export const taskManager = new TaskManager();
