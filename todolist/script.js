// script.js

// Obtener referencias a los elementos del DOM
const taskInput = document.getElementById('taskInput');
const addTaskBtn = document.getElementById('addTaskBtn');
const taskList = document.getElementById('taskList');

// Cargar tareas desde el Local Storage al cargar la página
document.addEventListener('DOMContentLoaded', () => {
  const savedTasks = JSON.parse(localStorage.getItem('tasks')) || [];
  savedTasks.forEach(task => addTaskToDOM(task.text, task.completed));
});

// Agregar tarea al hacer clic en el botón
addTaskBtn.addEventListener('click', () => {
  const taskText = taskInput.value.trim();
  if (taskText !== '') {
    addTask(taskText);
    taskInput.value = '';
  }
});

// Agregar tarea presionando "Enter"
taskInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    addTaskBtn.click();
  }
});

// Función para agregar una tarea
function addTask(text) {
  const newTask = { text, completed: false };
  addTaskToDOM(text, false);
  saveTaskToLocalStorage(newTask);
}

// Función para agregar una tarea al DOM
function addTaskToDOM(text, completed) {
  const li = document.createElement('li');
  li.textContent = text;

  if (completed) {
    li.classList.add('completed');
  }

  // Botón para eliminar tarea
  const deleteBtn = document.createElement('button');
  deleteBtn.textContent = 'Eliminar';
  deleteBtn.classList.add('delete-btn');
  deleteBtn.addEventListener('click', () => {
    taskList.removeChild(li);
    removeFromLocalStorage(text);
  });

  // Marcar tarea como completada al hacer clic
  li.addEventListener('click', () => {
    li.classList.toggle('completed');
    updateTaskInLocalStorage(text, li.classList.contains('completed'));
  });

  li.appendChild(deleteBtn);
  taskList.appendChild(li);
}

// Guardar tarea en el Local Storage
function saveTaskToLocalStorage(task) {
  const tasks = JSON.parse(localStorage.getItem('tasks')) || [];
  tasks.push(task);
  localStorage.setItem('tasks', JSON.stringify(tasks));
}

// Actualizar estado de una tarea en el Local Storage
function updateTaskInLocalStorage(taskText, completed) {
  const tasks = JSON.parse(localStorage.getItem('tasks')) || [];
  const updatedTasks = tasks.map(task =>
    task.text === taskText ? { ...task, completed } : task
  );
  localStorage.setItem('tasks', JSON.stringify(updatedTasks));
}

// Eliminar tarea del Local Storage
function removeFromLocalStorage(taskText) {
  const tasks = JSON.parse(localStorage.getItem('tasks')) || [];
  const updatedTasks = tasks.filter(task => task.text !== taskText);
  localStorage.setItem('tasks', JSON.stringify(updatedTasks));
}