# Minimal Task Tracker

這是一個基於 Vanilla JavaScript + HTML + CSS 打造的極簡風格（日系 / Notion 風格）任務追蹤工具，符合作品集標準的輕量級全端 (純前端實作) 架構。

## 特色
- 🚫 **無框架依賴**：100% 使用原生 HTML, CSS, JavaScript (ES6 Modules)
- 🎨 **設計系統**：使用 CSS Variables 控制色系、間距、圓角與陰影，營造極簡舒適體驗
- 💾 **本地持久化**：所有資料保存在瀏覽器 `localStorage`，重新整理不遺失
- 🧩 **模組化架構**：將邏輯拆分為 Storage、Tasks、UI、Main，完全仿照實務開發架構
- ✨ **微動畫互動**：平滑的位移與淡入特效、卡片懸浮效果

## 快速開始 (How to Run)
因為應用程式使用了 ES6 Modules (`<script type="module">`)，你需要透過一個本地伺服器來執行以避免 CORS 問題。

1. 打開 Visual Studio Code
2. 安裝擴充套件：**Live Server** (Ritwick Dey)
3. 在 `index.html` 點擊右鍵 -> 選擇 `Open with Live Server` 
4. 網頁會自動在瀏覽器開啟 (預設為 http://127.0.0.1:5500)

## 目錄結構說明
- `index.html`: 負責骨架與排版，採用高語意化標籤。
- `css/style.css`: 採用 CSS 變數維護設計 Token，無外部 CSS 依賴。
- `js/main.js`: 應用程式進入點，只做事件綁定與初始化。
- `js/tasks.js`: 任務管理核心！負責 CRUD、過濾器、排序與今日進度統計。
- `js/ui.js`: 專注於 DOM 操作、元素渲染、Modal 彈窗控制。
- `js/storage.js`: 負責所有的 localStorage 操作隔離層。

## 未來擴充建議 (給作品集的亮點)
如果你未來想繼續擴充這個專案，或是將他改寫，可以參考以下方向：

1. **拖曳排序 (Drag & Drop)**：整合 HTML5 native Drag and Drop API 來讓清單可以隨意拖曳更改優先級。
2. **遷移至 React / Vue**：目前狀態管理（`taskManager`）與視圖渲染（`UI`）分離得很好，如果未來換框架，只需用 React 的 `useState` 替換 `UI.js`，而 `tasks.js` 的邏輯近乎可以無痛沿用，證明這份 code 的架構良好。
3. **後端串接**：將 `storage.js` 中的 `localStorage.getItem` 等方法替換成 `fetch()` 呼叫 API，即可做到雲端同步。
