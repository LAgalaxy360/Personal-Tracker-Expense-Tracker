// DOM Elements
const expenseForm = document.getElementById('expense-form');
const descriptionInput = document.getElementById('description');
const amountInput = document.getElementById('amount');
const categoryInput = document.getElementById('category');
const dateInput = document.getElementById('date');
const expenseIdInput = document.getElementById('expense-id');
const submitBtn = document.getElementById('submit-btn');
const cancelEditBtn = document.getElementById('cancel-edit-btn');
const expenseList = document.getElementById('expense-list');
const totalBalanceEl = document.getElementById('total-balance');
const emptyStateEl = document.getElementById('empty-state');

// Reminder DOM Elements
const reminderForm = document.getElementById('reminder-form');
const reminderDescInput = document.getElementById('reminder-desc');
const reminderDateInput = document.getElementById('reminder-date');
const reminderList = document.getElementById('reminder-list');
const reminderEmptyStateEl = document.getElementById('reminder-empty-state');

// State
let expenses = [];
let isEditing = false;
let reminders = [];

// Initialize App
function init() {
    // Set default date to today
    dateInput.value = new Date().toISOString().split('T')[0];

    // Load from Local Storage
    const storedExpenses = localStorage.getItem('expenses');
    if (storedExpenses) {
        expenses = JSON.parse(storedExpenses);
    }

    const storedReminders = localStorage.getItem('reminders');
    if (storedReminders) {
        reminders = JSON.parse(storedReminders);
    }

    renderExpenses();
    renderReminders();
}

// Render Expenses to DOM
function renderExpenses() {
    // Clear list
    expenseList.innerHTML = '';

    if (expenses.length === 0) {
        emptyStateEl.classList.remove('hidden');
        expenseList.classList.add('hidden');
    } else {
        emptyStateEl.classList.add('hidden');
        expenseList.classList.remove('hidden');

        // Sort expenses by date (newest first)
        const sortedExpenses = [...expenses].sort((a, b) => new Date(b.date) - new Date(a.date));

        sortedExpenses.forEach(expense => {
            const expenseItem = document.createElement('div');
            expenseItem.classList.add('expense-item');
            
            // Format date safely
            const dateObj = new Date(expense.date);
            // Adding time to ensure it displays the local date correctly if timezones shift it
            const formattedDate = dateObj.toLocaleDateString(undefined, {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                timeZone: 'UTC'
            });

            expenseItem.innerHTML = `
                <div class="expense-info">
                    <span class="expense-desc">${escapeHTML(expense.description)}</span>
                    <div class="expense-meta">
                        <span class="expense-category">${escapeHTML(expense.category)}</span>
                        <span>•</span>
                        <span class="expense-date">${formattedDate}</span>
                    </div>
                </div>
                <div class="expense-amount-actions">
                    <span class="expense-amount">$${parseFloat(expense.amount).toFixed(2)}</span>
                    <div class="action-btns">
                        <button class="icon-btn edit-btn" onclick="editExpense('${expense.id}')" aria-label="Edit">✏️</button>
                        <button class="icon-btn delete-btn" onclick="deleteExpense('${expense.id}')" aria-label="Delete">🗑️</button>
                    </div>
                </div>
            `;
            expenseList.appendChild(expenseItem);
        });
    }

    updateTotal();
}

// Add or Update Expense
function handleFormSubmit(e) {
    e.preventDefault();

    const desc = descriptionInput.value.trim();
    const amount = amountInput.value.trim();
    const category = categoryInput.value;
    const date = dateInput.value;
    const id = expenseIdInput.value;

    if (!desc || !amount || !category || !date) {
        alert('Please fill in all fields');
        return;
    }

    if (isEditing) {
        // Update existing expense
        const index = expenses.findIndex(exp => exp.id === id);
        if (index !== -1) {
            expenses[index] = {
                id,
                description: desc,
                amount: parseFloat(amount),
                category,
                date
            };
        }
        
        // Reset edit mode
        cancelEditMode();
    } else {
        // Create new expense
        const newExpense = {
            id: generateID(),
            description: desc,
            amount: parseFloat(amount),
            category,
            date
        };
        expenses.push(newExpense);
    }

    saveToLocalStorage();
    renderExpenses();
    
    if (!isEditing) {
        // Reset form but keep the date
        const currentDate = dateInput.value;
        expenseForm.reset();
        dateInput.value = currentDate;
    }
}

// Edit Expense
window.editExpense = function(id) {
    const expense = expenses.find(exp => exp.id === id);
    if (!expense) return;

    // Populate form
    descriptionInput.value = expense.description;
    amountInput.value = expense.amount;
    categoryInput.value = expense.category;
    dateInput.value = expense.date;
    expenseIdInput.value = expense.id;

    // UI changes for edit mode
    isEditing = true;
    submitBtn.textContent = 'Update Expense';
    cancelEditBtn.classList.remove('hidden');
    
    // Scroll to form
    window.scrollTo({ top: 0, behavior: 'smooth' });
};

// Delete Expense
window.deleteExpense = function(id) {
    if (confirm('Are you sure you want to delete this expense?')) {
        expenses = expenses.filter(exp => exp.id !== id);
        saveToLocalStorage();
        renderExpenses();
        
        // If we are currently editing the deleted item, cancel edit mode
        if (isEditing && expenseIdInput.value === id) {
            cancelEditMode();
        }
    }
};

// Cancel Edit Mode
function cancelEditMode() {
    isEditing = false;
    expenseForm.reset();
    expenseIdInput.value = '';
    submitBtn.textContent = 'Add Expense';
    cancelEditBtn.classList.add('hidden');
    dateInput.value = new Date().toISOString().split('T')[0];
}

function updateTotal() {
    const total = expenses.reduce((acc, expense) => acc + parseFloat(expense.amount), 0);
    totalBalanceEl.textContent = `$${total.toFixed(2)}`;
}
// Save to Local Storage
function saveToLocalStorage() {
    localStorage.setItem('expenses', JSON.stringify(expenses));
}

// Utility: Generate Random ID
function generateID() {
    return Math.random().toString(36).substring(2, 9);
}

// Utility: Prevent XSS
function escapeHTML(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

// --- Reminder Logic ---

function renderReminders() {
    reminderList.innerHTML = '';

    if (reminders.length === 0) {
        reminderEmptyStateEl.classList.remove('hidden');
        reminderList.classList.add('hidden');
    } else {
        reminderEmptyStateEl.classList.add('hidden');
        reminderList.classList.remove('hidden');

        // Sort by date ascending (closest first)
        const sortedReminders = [...reminders].sort((a, b) => new Date(a.date) - new Date(b.date));

        sortedReminders.forEach(reminder => {
            const reminderItem = document.createElement('div');
            reminderItem.classList.add('expense-item');
            if (reminder.completed) {
                reminderItem.classList.add('completed');
            }
            
            const dateObj = new Date(reminder.date);
            const formattedDate = dateObj.toLocaleDateString(undefined, {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                timeZone: 'UTC'
            });

            reminderItem.innerHTML = `
                <div class="expense-info" style="flex-direction: row; align-items: center; gap: 1rem;">
                    <input type="checkbox" ${reminder.completed ? 'checked' : ''} onchange="toggleReminder('${reminder.id}')" class="reminder-checkbox">
                    <div style="display: flex; flex-direction: column;">
                        <span class="expense-desc ${reminder.completed ? 'completed-text' : ''}">${escapeHTML(reminder.description)}</span>
                        <div class="expense-meta">
                            <span class="expense-date">Due: ${formattedDate}</span>
                        </div>
                    </div>
                </div>
                <div class="action-btns">
                    <button class="icon-btn delete-btn" onclick="deleteReminder('${reminder.id}')" aria-label="Delete">🗑️</button>
                </div>
            `;
            reminderList.appendChild(reminderItem);
        });
    }
}

function handleReminderSubmit(e) {
    e.preventDefault();

    const desc = reminderDescInput.value.trim();
    const date = reminderDateInput.value;

    if (!desc || !date) {
        alert('Please fill in all reminder fields');
        return;
    }

    const newReminder = {
        id: generateID(),
        description: desc,
        date: date,
        completed: false
    };

    reminders.push(newReminder);
    saveReminders();
    renderReminders();
    
    reminderForm.reset();
}

window.toggleReminder = function(id) {
    const reminder = reminders.find(r => r.id === id);
    if (reminder) {
        reminder.completed = !reminder.completed;
        saveReminders();
        renderReminders();
    }
};

window.deleteReminder = function(id) {
    if (confirm('Are you sure you want to delete this reminder?')) {
        reminders = reminders.filter(r => r.id !== id);
        saveReminders();
        renderReminders();
    }
};

function saveReminders() {
    localStorage.setItem('reminders', JSON.stringify(reminders));
}

// Event Listeners
expenseForm.addEventListener('submit', handleFormSubmit);
cancelEditBtn.addEventListener('click', cancelEditMode);
reminderForm.addEventListener('submit', handleReminderSubmit);

// Boot App
init();
