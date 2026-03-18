/**
 * storage.js
 * 負責處理與 localStorage 的所有互動。
 * 將資料持久化邏輯獨立，方便未來如果要替換成 API (例如 fetch 或 axios) 時只需要改這裡。
 */

const STORAGE_KEY = 'minimal_task_tracker_data';
const STREAK_KEY = 'minimal_task_tracker_streak';

// 初始化預設資料結構
const defaultData = {
  tasks: [],
  lastLoginDate: new Date().toDateString(),
  streak: 0
};

export const Storage = {
  /**
   * 取得所有任務資料
   * @returns {Array} 任務陣列
   */
  getTasks: () => {
    const data = JSON.parse(localStorage.getItem(STORAGE_KEY)) || defaultData;
    return data.tasks || [];
  },

  /**
   * 儲存所有任務資料
   * @param {Array} tasks - 任務陣列
   */
  saveTasks: (tasks) => {
    const data = JSON.parse(localStorage.getItem(STORAGE_KEY)) || defaultData;
    data.tasks = tasks;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  },

  /**
   * 取得進度與連續天數資訊
   */
  getStreakInfo: () => {
    return JSON.parse(localStorage.getItem(STREAK_KEY)) || {
      lastCompletedDate: null,
      streak: 0
    };
  },

  /**
   * 更新 Streak 資訊
   */
  updateStreak: (dateString, newStreak) => {
    localStorage.setItem(STREAK_KEY, JSON.stringify({
      lastCompletedDate: dateString,
      streak: newStreak
    }));
  }
};
