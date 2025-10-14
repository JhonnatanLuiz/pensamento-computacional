document.addEventListener('DOMContentLoaded', () => {
    const taskForm = document.getElementById('task-form');
    const taskInput = document.getElementById('task-input');
    const scheduleInput = document.getElementById('schedule-input');
    const pendingTasksList = document.getElementById('pending-tasks');
    const inprogressTasksList = document.getElementById('inprogress-tasks');
    const completedTasksList = document.getElementById('completed-tasks');
    const kanbanBoard = document.querySelector('.kanban-board');

    function createTaskCard(task) {
        const card = document.createElement('li');
        card.className = 'task-card';
        card.dataset.id = task.id;
        card.draggable = true; // Torna o card arrastável

        const content = document.createElement('p');
        content.textContent = task.content;
        card.appendChild(content);

        const timeInfo = document.createElement('div');
        timeInfo.className = `time-info status-${task.status}`;
        let timeText = '';
        let dateToShow;
        switch (task.status) {
            case 'pending':
                if (task.scheduled_for) {
                    dateToShow = new Date(task.scheduled_for);
                    timeText = `Agendado para: ${dateToShow.toLocaleDateString()} ${dateToShow.toLocaleTimeString()}`;
                } else {
                    dateToShow = new Date(task.created_at);
                    timeText = `Criado em: ${dateToShow.toLocaleDateString()} ${dateToShow.toLocaleTimeString()}`;
                }
                break;
            case 'in_progress':
                dateToShow = new Date(task.updated_at);
                timeText = `Iniciado em: ${dateToShow.toLocaleDateString()} ${dateToShow.toLocaleTimeString()}`;
                break;
            case 'completed':
                dateToShow = new Date(task.updated_at);
                timeText = `Concluído em: ${dateToShow.toLocaleDateString()} ${dateToShow.toLocaleTimeString()}`;
                break;
        }
        timeInfo.textContent = timeText;
        card.appendChild(timeInfo);

        const actions = document.createElement('div');
        actions.className = 'actions';
        const moveButtons = document.createElement('div');
        moveButtons.className = 'move-buttons';
        if (task.status === 'pending') {
            const startButton = document.createElement('button');
            startButton.textContent = 'Iniciar';
            startButton.dataset.newStatus = 'in_progress';
            moveButtons.appendChild(startButton);
        } else if (task.status === 'in_progress') {
            const pendingButton = document.createElement('button');
            pendingButton.textContent = 'Pendente';
            pendingButton.dataset.newStatus = 'pending';
            moveButtons.appendChild(pendingButton);
            const completeButton = document.createElement('button');
            completeButton.textContent = 'Concluir';
            completeButton.dataset.newStatus = 'completed';
            moveButtons.appendChild(completeButton);
        } else if (task.status === 'completed') {
            const reopenButton = document.createElement('button');
            reopenButton.textContent = 'Reabrir';
            reopenButton.dataset.newStatus = 'in_progress';
            moveButtons.appendChild(reopenButton);
        }
        const deleteButton = document.createElement('button');
        deleteButton.className = 'delete-btn';
        deleteButton.innerHTML = '&times;';
        actions.appendChild(moveButtons);
        actions.appendChild(deleteButton);
        card.appendChild(actions);
        return card;
    }

    async function fetchAndRenderTasks() {
        try {
            const response = await fetch('/tasks');
            const tasks = await response.json();

            // 1. Separar tarefas por status
            const pending = tasks.filter(t => t.status === 'pending');
            const inProgress = tasks.filter(t => t.status === 'in_progress');
            const completed = tasks.filter(t => t.status === 'completed');

            // 2. Ordenar cada lista individualmente
            // Ordena pendentes por data de agendamento (com nulos no fim), depois por data de criação
            pending.sort((a, b) => {
                if (a.scheduled_for && b.scheduled_for) {
                    return new Date(a.scheduled_for) - new Date(b.scheduled_for);
                }
                if (a.scheduled_for) return -1; // a vem primeiro
                if (b.scheduled_for) return 1;  // b vem primeiro
                return new Date(a.created_at) - new Date(b.created_at); // fallback para data de criação
            });

            // Ordena em progresso e concluídas pela data de atualização mais recente
            inProgress.sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));
            completed.sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));

            // 3. Limpar e renderizar
            pendingTasksList.innerHTML = '';
            inprogressTasksList.innerHTML = '';
            completedTasksList.innerHTML = '';

            pending.forEach(task => pendingTasksList.appendChild(createTaskCard(task)));
            inProgress.forEach(task => inprogressTasksList.appendChild(createTaskCard(task)));
            completed.forEach(task => completedTasksList.appendChild(createTaskCard(task)));

        } catch (error) {
            console.error('Falha ao buscar e renderizar tarefas:', error);
        }
    }

    async function updateTaskStatus(taskId, newStatus) {
        try {
            await fetch(`/tasks/${taskId}/status`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus })
            });
            fetchAndRenderTasks();
        } catch (error) {
            console.error('Falha ao atualizar status:', error);
        }
    }

    async function deleteTask(taskId) {
        try {
            await fetch(`/tasks/${taskId}`, { method: 'DELETE' });
            fetchAndRenderTasks();
        } catch (error) {
            console.error('Falha ao deletar tarefa:', error);
        }
    }

    taskForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const taskText = taskInput.value.trim();
        const scheduleValue = scheduleInput.value;
        if (taskText) {
            const payload = {
                task: taskText,
                scheduled_for: scheduleValue ? scheduleValue : null
            };
            try {
                await fetch('/tasks', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
                taskInput.value = '';
                scheduleInput.value = '';
                fetchAndRenderTasks();
            } catch (error) {
                console.error('Falha ao adicionar tarefa:', error);
            }
        }
    });

    kanbanBoard.addEventListener('click', (e) => {
        const target = e.target;
        const card = target.closest('.task-card');
        if (!card) return;
        const taskId = card.dataset.id;
        if (target.tagName === 'BUTTON' && target.dataset.newStatus) {
            updateTaskStatus(taskId, target.dataset.newStatus);
        }
        if (target.classList.contains('delete-btn')) {
            deleteTask(taskId);
        }
    });

    // --- DRAG AND DROP LISTENERS ---
    kanbanBoard.addEventListener('dragstart', (e) => {
        if (e.target.classList.contains('task-card')) {
            e.dataTransfer.setData('text/plain', e.target.dataset.id);
            setTimeout(() => {
                e.target.classList.add('dragging');
            }, 0);
        }
    });

    kanbanBoard.addEventListener('dragend', (e) => {
        if (e.target.classList.contains('task-card')) {
            e.target.classList.remove('dragging');
        }
    });

    const columns = document.querySelectorAll('.task-column');
    columns.forEach(column => {
        column.addEventListener('dragover', (e) => {
            e.preventDefault();
        });

        column.addEventListener('dragenter', (e) => {
            e.preventDefault();
            if (e.currentTarget.classList.contains('task-column')) {
                e.currentTarget.classList.add('drag-over');
            }
        });

        column.addEventListener('dragleave', (e) => {
            if (e.currentTarget.classList.contains('task-column')) {
                e.currentTarget.classList.remove('drag-over');
            }
        });

        column.addEventListener('drop', (e) => {
            e.preventDefault();
            if (e.currentTarget.classList.contains('task-column')) {
                e.currentTarget.classList.remove('drag-over');
                const taskId = e.dataTransfer.getData('text/plain');
                let newStatus = 'pending';
                if (e.currentTarget.id === 'inprogress-column') {
                    newStatus = 'in_progress';
                } else if (e.currentTarget.id === 'completed-column') {
                    newStatus = 'completed';
                }
                updateTaskStatus(taskId, newStatus);
            }
        });
    });

    fetchAndRenderTasks();
});