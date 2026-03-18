/**
 * main.js
 * 應用程式的進入點 (Entry Point)
 * 負責綁定事件與初始化應用程式
 */
import { taskManager } from './tasks.js';
import { UI } from './ui.js';

document.addEventListener('DOMContentLoaded', async () => {
  // 顯示載入畫面
  UI.showLoadingOverlay();
  
  try {
    // 等待雲端載入完成
    await taskManager.loadTasks();
    
    // 1. 初始化 UI
    UI.init(taskManager);
  } catch (error) {
    console.error("載入失敗:", error);
    alert("程式出現錯誤：\n" + error.toString() + "\n\n如果有看懂請告訴我，不然就把這段截圖發給我！");
  } finally {
    // 關閉載入畫面
    UI.hideLoadingOverlay();
  }

  // 1.5 處理 RWD Sidebar 邏輯
  const btnToggleSidebar = document.getElementById('btn-toggle-sidebar');
  if (btnToggleSidebar) {
    btnToggleSidebar.addEventListener('click', () => {
      document.body.classList.toggle('sidebar-open');
    });
  }

  // 點擊 Overlay (body::before) 時關閉 Sidebar
  document.addEventListener('click', (e) => {
    if (document.body.classList.contains('sidebar-open')) {
      // 點擊區域如果介於畫面邊緣且不包含在 sidebar 內，就視為點擊到 overlay 關閉
      const sidebar = document.querySelector('.sidebar');
      const toggleBtn = document.getElementById('btn-toggle-sidebar');
      if (e.target !== sidebar && !sidebar.contains(e.target) && e.target !== toggleBtn && !toggleBtn.contains(e.target)) {
         document.body.classList.remove('sidebar-open');
      }
    }
  });

  // 1.8 處理側邊欄摺疊 (Collapsible)
  const collapsibleHeaders = document.querySelectorAll('.collapsible-header');
  collapsibleHeaders.forEach(header => {
    header.addEventListener('click', () => {
      header.classList.toggle('collapsed');
    });
  });

  // 2. 綁定全域事件

  // 新增任務按鈕
  UI.elements.btnAdd.addEventListener('click', () => {
    UI.openModal();
  });

  // 關閉 Modal 按鈕
  UI.elements.btnCloseModal.addEventListener('click', () => {
    UI.closeModal();
  });

  UI.elements.btnCancel.addEventListener('click', () => {
    UI.closeModal();
  });

  // 點擊 Modal 背景關閉
  UI.elements.modal.addEventListener('click', (e) => {
    if (e.target === UI.elements.modal) {
      UI.closeModal();
    }
  });

  // 按下 Esc 關閉 Modal
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && UI.elements.modal.classList.contains('active')) {
      UI.closeModal();
    }
  });

  // 新增小任務 (點擊按鈕或按下 Enter)
  const addSubtask = () => {
    const title = UI.elements.newSubtaskInput.value.trim();
    if (title) {
      UI.modalSubtasks.push({ id: Date.now().toString(), title, completed: false });
      UI.elements.newSubtaskInput.value = '';
      UI.renderModalSubtasks();
    }
  };

  UI.elements.btnAddSubtask.addEventListener('click', addSubtask);
  UI.elements.newSubtaskInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addSubtask();
    }
  });

  // 刪除 Modal 中的小任務
  UI.elements.modalSubtaskList.addEventListener('click', (e) => {
    const delBtn = e.target.closest('.modal-subtask-del');
    if (delBtn) {
      const id = delBtn.dataset.id;
      UI.modalSubtasks = UI.modalSubtasks.filter(st => st.id !== id);
      UI.renderModalSubtasks();
    }
  });

  // 處理表單提交 (新增/編輯)
  UI.elements.form.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const id = UI.elements.taskIdInput.value;
    const title = UI.elements.titleInput.value.trim();
    const description = UI.elements.descriptionInput.value.trim();
    const category = UI.elements.categoryInput.value;
    const priority = UI.elements.priorityInput.value;
    const dueDate = UI.elements.dueDateInput.value;
    const isHabit = UI.elements.isHabitInput.checked;
    const subtasks = UI.modalSubtasks;

    if (!title) return;

    if (id) {
      // 編輯
      taskManager.updateTask(id, { title, description, category, priority, dueDate, subtasks, isHabit });
    } else {
      // 新增
      taskManager.addTask(title, description, category, priority, dueDate, subtasks, isHabit);
    }

    UI.closeModal();
    UI.renderTasks();
    UI.updateStats();
  });

  // 排序變更
  UI.elements.sortSelect.addEventListener('change', (e) => {
    taskManager.setSort(e.target.value);
    UI.renderTasks();
  });

  // 側邊欄過濾點擊委派 (Filters)
  UI.elements.filterList.addEventListener('click', (e) => {
    const li = e.target.closest('li');
    if (!li) return;

    const filter = li.dataset.filter;
    taskManager.setFilter(filter);
    
    // 更新 UI 狀態
    UI.updateActiveSidebarItem('filter-list', 'filter', filter);
    UI.updateViewTitle(li.textContent.trim());
    
    // 如果切換 Filter，則重置 Category 為 all，避免條件互斥找不到任務
    taskManager.setCategory('all');
    UI.updateActiveSidebarItem('category-list', 'category', 'all');

    UI.renderTasks();
  });

  // 側邊欄分類點擊委派 (Categories)
  UI.elements.categoryList.addEventListener('click', (e) => {
    const li = e.target.closest('li');
    if (!li) return;

    const category = li.dataset.category;
    taskManager.setCategory(category);
    
    // 更新 UI 狀態
    UI.updateActiveSidebarItem('category-list', 'category', category);
    
    UI.renderTasks();
  });

  // 任務卡片內操作委派 (完成、編輯、刪除)
  UI.elements.tasksContainer.addEventListener('click', (e) => {
    const card = e.target.closest('.task-card');
    if (!card) return;
    
    const taskId = card.dataset.id;
    
    // 點擊小任務 checkbox
    if (e.target.classList.contains('subtask-inline-checkbox')) {
      const subtaskId = e.target.dataset.subid;
      taskManager.toggleSubtaskStatus(taskId, subtaskId);
      UI.renderTasks();
      UI.updateStats();
      return;
    }

    // 點擊主任務 checkbox
    if (e.target.classList.contains('task-checkbox')) {
      taskManager.toggleTaskStatus(taskId);
      UI.renderTasks();
      UI.updateStats();
      return;
    }

    // 點擊刪除按鈕
    const deleteBtn = e.target.closest('.delete-btn');
    if (deleteBtn) {
      // 簡單的確認視窗
      if (confirm('確定要刪除這個任務嗎？')) {
        taskManager.deleteTask(taskId);
        UI.renderTasks();
        UI.updateStats();
      }
      return;
    }

    // 點擊編輯按鈕
    const editBtn = e.target.closest('.edit-btn');
    if (editBtn) {
      UI.openModal(taskId);
      return;
    }
  });
});
