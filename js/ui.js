/**
 * ui.js
 * 負責 DOM 渲染、UI 狀態切換與事件委派
 */
import { taskManager } from './tasks.js';

export const UI = {
  modalSubtasks: [],
  // DOM 元素快取
  elements: {
    tasksContainer: document.getElementById('tasks-container'),
    viewTitle: document.getElementById('current-view-title'),
    currentDate: document.getElementById('current-date'),
    filterList: document.getElementById('filter-list'),
    categoryList: document.getElementById('category-list'),
    sortSelect: document.getElementById('sort-select'),
    
    // Stats
    progressBar: document.getElementById('progress-bar'),
    progressText: document.getElementById('progress-text'),
    
    // Modal
    modal: document.getElementById('task-modal'),
    modalTitle: document.getElementById('modal-title'),
    form: document.getElementById('task-form'),
    taskIdInput: document.getElementById('task-id'),
    titleInput: document.getElementById('task-title'),
    descriptionInput: document.getElementById('task-description'),
    categoryInput: document.getElementById('task-category'),
    priorityInput: document.getElementById('task-priority'),
    dueDateInput: document.getElementById('task-due-date'),
    isHabitInput: document.getElementById('task-is-habit'),
    
    newSubtaskInput: document.getElementById('new-subtask-input'),
    btnAddSubtask: document.getElementById('btn-add-subtask'),
    modalSubtaskList: document.getElementById('modal-subtask-list'),
    
    // Buttons
    btnAdd: document.getElementById('btn-add-task'),
    btnCloseModal: document.getElementById('btn-close-modal'),
    btnCancel: document.getElementById('btn-cancel'),
  },

  showLoadingOverlay: () => {
    const overlay = document.createElement('div');
    overlay.id = 'global-loading';
    overlay.innerHTML = `
      <div class="spinner"></div>
      <p style="margin-top: 16px; font-weight: bold; font-family: 'M PLUS Rounded 1c', sans-serif; color: var(--text-primary)">連線至雲端資料庫...</p>
    `;
    document.body.appendChild(overlay);
  },

  hideLoadingOverlay: () => {
    const overlay = document.getElementById('global-loading');
    if (overlay) overlay.remove();
  },

  init() {
    this.updateDateDisplay();
    this.renderTasks();
    this.updateStats();
  },

  updateDateDisplay() {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    this.elements.currentDate.textContent = new Date().toLocaleDateString('zh-TW', options);
  },

  updateStats() {
    const progress = taskManager.getTodayProgress();
    this.elements.progressBar.style.width = `${progress}%`;
    this.elements.progressText.textContent = `${progress}%`;
  },

  renderTasks() {
    const tasks = taskManager.getFilteredAndSortedTasks();
    this.elements.tasksContainer.innerHTML = '';

    if (tasks.length === 0) {
      this.elements.tasksContainer.innerHTML = `
        <div class="empty-state">
          <span style="font-size: 48px;">☕</span>
          <p>太棒了！目前沒有任務，去喝杯咖啡吧。</p>
        </div>
      `;
      return;
    }

    const fragment = document.createDocumentFragment();

    tasks.forEach(task => {
      const card = document.createElement('div');
      card.className = `task-card ${task.completed ? 'completed' : ''}`;
      card.dataset.id = task.id;

      let dateHtml = '';
      if (task.dueDate) {
        const isOverdue = !task.completed && new Date(task.dueDate) < new Date(new Date().toDateString());
        dateHtml = `
          <div class="task-date ${isOverdue ? 'overdue' : ''}">
            <span style="font-size: 14px;">🗓️</span>
            ${task.dueDate}
          </div>
        `;
      }

      const priorityMap = {
        low: { text: '低', class: 'priority-low' },
        medium: { text: '中', class: 'priority-medium' },
        high: { text: '高', class: 'priority-high' }
      };

      const categoryMap = {
        work: { text: '工作', class: 'badge-work' },
        personal: { text: '個人', class: 'badge-personal' },
        study: { text: '學習', class: 'badge-study' },
        all: { text: '未分類', class: 'badge-personal' } // Fallback for empty Notion rows
      };

      const cObj = categoryMap[task.category] || categoryMap.all;
      const pObj = priorityMap[task.priority] || priorityMap.low;

      let descHtml = task.description ? `<div class="task-description">${this.escapeHTML(task.description)}</div>` : '';
      let habitHtml = task.isHabit ? `<span class="badge badge-habit">打卡</span>` : '';
      
      let subtasksHtml = '';
      if (task.subtasks && task.subtasks.length > 0) {
        const completedCount = task.subtasks.filter(s => s.completed).length;
        const totalCount = task.subtasks.length;
        const progressHtml = `<div class="subtask-progress"><span>🔄</span> ${completedCount} / ${totalCount} 已完成</div>`;
        
        let subtaskListHtml = task.subtasks.map(st => `
          <label class="subtask-item ${st.completed ? 'completed' : ''}">
            <input type="checkbox" class="subtask-inline-checkbox" data-subid="${st.id}" ${st.completed ? 'checked' : ''}>
            <span>${this.escapeHTML(st.title)}</span>
          </label>
        `).join('');
        
        subtasksHtml = `
          ${progressHtml}
          <div class="subtask-list">
            ${subtaskListHtml}
          </div>
        `;
      }

      card.innerHTML = `
        <input type="checkbox" class="task-checkbox" ${task.completed ? 'checked' : ''}>
        <div class="task-content">
          <div class="task-title">${this.escapeHTML(task.title)}</div>
          ${descHtml}
          <div class="task-meta">
            ${habitHtml}
            <span class="badge ${cObj.class}">${cObj.text}</span>
            <span class="badge ${pObj.class}">${pObj.text}</span>
            ${dateHtml}
          </div>
          ${subtasksHtml}
        </div>
        <div class="task-actions">
          <button class="btn-icon edit-btn" title="編輯任務"><span>✏️</span></button>
          <button class="btn-icon danger delete-btn" title="刪除任務"><span>🗑️</span></button>
        </div>
      `;

      fragment.appendChild(card);
    });

    this.elements.tasksContainer.appendChild(fragment);
  },

  // Modal 控制
  openModal(taskId = null) {
    this.elements.form.reset();
    this.modalSubtasks = [];
    this.renderModalSubtasks();
    
    if (taskId) {
      // 編輯模式
      const task = taskManager.getTaskById(taskId);
      if (task) {
        this.elements.modalTitle.textContent = '編輯任務';
        this.elements.taskIdInput.value = task.id;
        this.elements.titleInput.value = task.title;
        this.elements.descriptionInput.value = task.description || '';
        this.elements.categoryInput.value = task.category;
        this.elements.priorityInput.value = task.priority;
        this.elements.dueDateInput.value = task.dueDate || '';
        this.elements.isHabitInput.checked = task.isHabit || false;
        
        // Deep copy subtasks for modal editing
        this.modalSubtasks = JSON.parse(JSON.stringify(task.subtasks || []));
        this.renderModalSubtasks();
      }
    } else {
      // 新增模式
      this.elements.modalTitle.textContent = '新增任務';
      this.elements.taskIdInput.value = '';
      this.elements.isHabitInput.checked = false;
      // 預設選擇今天的日期作為截止日
      this.elements.dueDateInput.value = new Date().toISOString().split('T')[0];
    }
    
    this.elements.modal.classList.add('active');
    setTimeout(() => this.elements.titleInput.focus(), 100);
  },

  closeModal() {
    this.elements.modal.classList.remove('active');
  },

  renderModalSubtasks() {
    this.elements.modalSubtaskList.innerHTML = '';
    this.modalSubtasks.forEach(st => {
      const li = document.createElement('li');
      li.className = 'modal-subtask-item';
      li.innerHTML = `
        <span>${this.escapeHTML(st.title)}</span>
        <button type="button" class="btn-icon danger modal-subtask-del" data-id="${st.id}"><span>❌</span></button>
      `;
      this.elements.modalSubtaskList.appendChild(li);
    });
  },

  // UI 輔助方法
  updateActiveSidebarItem(listId, dataAttr, value) {
    const list = document.getElementById(listId);
    list.querySelectorAll('li').forEach(li => li.classList.remove('active'));
    
    const target = list.querySelector(`li[data-${dataAttr}="${value}"]`);
    if (target) target.classList.add('active');
  },

  updateViewTitle(title) {
    this.elements.viewTitle.textContent = title;
  },

  escapeHTML(str) {
    const div = document.createElement('div');
    div.appendChild(document.createTextNode(str));
    return div.innerHTML;
  }
};
