document.addEventListener('DOMContentLoaded', function() {
    // Элементы DOM
    const taskInput = document.getElementById('taskInput');
    const addBtn = document.getElementById('addBtn');
    const taskList = document.getElementById('taskList');
    const searchInput = document.getElementById('search');
    const themeToggle = document.getElementById('themeToggle');
    const filterBtns = document.querySelectorAll('.filter-btn');
    const taskCount = document.getElementById('taskCount');
    const clearCompletedBtn = document.getElementById('clearCompleted');
    const editModal = document.getElementById('editModal');
    const editInput = document.getElementById('editInput');
    const saveEditBtn = document.getElementById('saveEdit');
    const cancelEditBtn = document.getElementById('cancelEdit');

    // Состояние приложения
    let tasks = JSON.parse(localStorage.getItem('tasks')) || [];
    let currentFilter = 'all';
    let editingTaskId = null;

    // Инициализация
    init();

    // ===== ФУНКЦИИ =====
    function init() {
        renderTasks();
        setupEventListeners();
        loadTheme();
    }

    function setupEventListeners() {
        // Добавление задачи
        addBtn.addEventListener('click', addTask);
        taskInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') addTask();
        });

        // Поиск
        searchInput.addEventListener('input', function() {
            renderTasks();
        });

        // Переключение темы
        themeToggle.addEventListener('click', toggleTheme);

        // Фильтры
        filterBtns.forEach(btn => {
            btn.addEventListener('click', function() {
                filterBtns.forEach(b => b.classList.remove('active'));
                this.classList.add('active');
                currentFilter = this.dataset.filter;
                renderTasks();
            });
        });

        // Очистка выполненных
        clearCompletedBtn.addEventListener('click', clearCompleted);

        // Модалка редактирования
        saveEditBtn.addEventListener('click', saveEdit);
        cancelEditBtn.addEventListener('click', closeEditModal);
        editModal.addEventListener('click', function(e) {
            if (e.target === editModal) closeEditModal();
        });
    }

    function addTask() {
        const text = taskInput.value.trim();
        if (!text) return;

        const task = {
            id: Date.now().toString(),
            text: text,
            completed: false,
            createdAt: new Date().toISOString()
        };

        tasks.unshift(task);
        saveTasks();
        renderTasks();
        taskInput.value = '';
        taskInput.focus();
    }

    function toggleTaskStatus(taskId) {
        const task = tasks.find(t => t.id === taskId);
        if (task) {
            task.completed = !task.completed;
            saveTasks();
            renderTasks();
        }
    }

    function editTask(taskId) {
        const task = tasks.find(t => t.id === taskId);
        if (task) {
            editingTaskId = taskId;
            editInput.value = task.text;
            editModal.style.display = 'flex';
            editInput.focus();
        }
    }

    function saveEdit() {
        if (!editingTaskId) return;

        const task = tasks.find(t => t.id === editingTaskId);
        if (task) {
            task.text = editInput.value.trim();
            saveTasks();
            renderTasks();
            closeEditModal();
        }
    }

    function closeEditModal() {
        editModal.style.display = 'none';
        editingTaskId = null;
        editInput.value = '';
    }

    function deleteTask(taskId) {
        if (confirm('Удалить задачу?')) {
            tasks = tasks.filter(t => t.id !== taskId);
            saveTasks();
            renderTasks();
        }
    }

    function clearCompleted() {
        tasks = tasks.filter(t => !t.completed);
        saveTasks();
        renderTasks();
    }

    function toggleTheme() {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        
        const icon = themeToggle.querySelector('i');
        icon.className = newTheme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
    }

    function loadTheme() {
        const savedTheme = localStorage.getItem('theme') || 'light';
        document.documentElement.setAttribute('data-theme', savedTheme);
        
        const icon = themeToggle.querySelector('i');
        icon.className = savedTheme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
    }

    function filterTasks() {
        const searchTerm = searchInput.value.toLowerCase();
        
        return tasks.filter(task => {
            // Поиск
            if (searchTerm && !task.text.toLowerCase().includes(searchTerm)) {
                return false;
            }
            
            // Фильтр по статусу
            switch (currentFilter) {
                case 'active': return !task.completed;
                case 'completed': return task.completed;
                default: return true;
            }
        });
    }

    function renderTasks() {
        const filteredTasks = filterTasks();
        
        taskList.innerHTML = '';
        
        if (filteredTasks.length === 0) {
            const emptyMsg = document.createElement('li');
            emptyMsg.className = 'empty-message';
            emptyMsg.textContent = searchInput.value ? 'Задачи не найдены' : 'Нет задач';
            taskList.appendChild(emptyMsg);
        } else {
            filteredTasks.forEach(task => {
                const taskElement = createTaskElement(task);
                taskList.appendChild(taskElement);
            });
        }
        
        updateStats();
    }

    function createTaskElement(task) {
        const li = document.createElement('li');
        li.className = `task ${task.completed ? 'completed' : ''}`;
        li.dataset.id = task.id;
        
        li.innerHTML = `
            <label class="task-check">
                <input type="checkbox" ${task.completed ? 'checked' : ''}>
                <span class="checkmark"></span>
            </label>
            <span class="task-text">${escapeHtml(task.text)}</span>
            <div class="task-actions">
                <button class="edit-btn"><i class="fas fa-edit"></i></button>
                <button class="delete-btn"><i class="fas fa-trash"></i></button>
            </div>
        `;
        
        // Обработчики событий
        const checkbox = li.querySelector('input[type="checkbox"]');
        const editBtn = li.querySelector('.edit-btn');
        const deleteBtn = li.querySelector('.delete-btn');
        
        checkbox.addEventListener('change', () => toggleTaskStatus(task.id));
        editBtn.addEventListener('click', () => editTask(task.id));
        deleteBtn.addEventListener('click', () => deleteTask(task.id));
        
        return li;
    }

    function updateStats() {
        const total = tasks.length;
        const completed = tasks.filter(t => t.completed).length;
        const active = total - completed;
        
        let text = `${active} активных`;
        if (completed > 0) text += `, ${completed} выполненных`;
        if (total === 0) text = 'Нет задач';
        
        taskCount.textContent = text;
    }

    function saveTasks() {
        localStorage.setItem('tasks', JSON.stringify(tasks));
    }

    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
});