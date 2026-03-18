/**
 * storage.js
 * 透過 Google Apps Script 將資料與 Notion 同步。
 */

const GAS_URL = 'https://script.google.com/macros/s/AKfycbxaPV8Bzidde0kLm74q00s7XPtDnWoXVOpdtnT0IE05r0VNEmEbxCJQfsPaDCIESLzQQg/exec';

export const Storage = {
  /**
   * 取得所有任務資料
   * @returns {Promise<Array>} 任務陣列
   */
  getTasks: async () => {
    try {
      const response = await fetch(GAS_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8',
        },
        body: JSON.stringify({ action: 'read' })
      });
      const data = await response.json();
      // data 應該是由 GAS 回傳的任務陣列
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.error("Failed to fetch from Notion:", error);
      return []; // 若失敗則回傳空陣列以避免壞掉
    }
  },

  /**
   * 儲存所有任務資料
   * 這裡採用「射後不理」 (Optimistic Update) 模式，不在此等待 Promise 結果，讓畫面順暢
   * @param {Array} tasks - 任務陣列
   */
  saveTasks: async (tasks) => {
    try {
      await fetch(GAS_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8',
        },
        body: JSON.stringify({ action: 'saveAll', tasks: tasks })
      });
    } catch (error) {
      console.error("Failed to sync to Notion:", error);
    }
  }
};
