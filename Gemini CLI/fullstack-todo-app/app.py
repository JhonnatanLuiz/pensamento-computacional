import sqlite3
import datetime
from flask import Flask, render_template, request, jsonify

app = Flask(__name__)
DATABASE = 'tasks.db'

def get_db_connection():
    conn = sqlite3.connect(DATABASE)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db_connection()
    # Tabela recriada com a coluna 'scheduled_for'
    conn.execute('''
        CREATE TABLE IF NOT EXISTS tasks (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            content TEXT NOT NULL,
            status TEXT NOT NULL DEFAULT 'pending',
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL,
            scheduled_for TEXT
        )
    ''')
    conn.commit()
    conn.close()

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/tasks', methods=['GET'])
def get_tasks():
    conn = get_db_connection()
    tasks_rows = conn.execute('SELECT id, content, status, created_at, updated_at, scheduled_for FROM tasks').fetchall()
    conn.close()
    tasks = [dict(row) for row in tasks_rows]
    return jsonify(tasks)

@app.route('/tasks', methods=['POST'])
def add_task():
    data = request.get_json()
    task_content = data.get('task')
    scheduled_for = data.get('scheduled_for') # Novo campo

    if not task_content:
        return jsonify({'status': 'failed', 'message': 'Task content is required'}), 400

    now = datetime.datetime.now().isoformat()
    conn = get_db_connection()
    conn.execute(
        'INSERT INTO tasks (content, created_at, updated_at, scheduled_for) VALUES (?, ?, ?, ?)',
        (task_content, now, now, scheduled_for)
    )
    conn.commit()
    conn.close()
    return jsonify({'status': 'success'}), 201


@app.route('/tasks/<int:task_id>', methods=['DELETE'])
def delete_task(task_id):
    conn = get_db_connection()
    conn.execute('DELETE FROM tasks WHERE id = ?', (task_id,))
    conn.commit()
    conn.close()
    return jsonify({'status': 'success'})

@app.route('/tasks/<int:task_id>/status', methods=['PUT'])
def update_task_status(task_id):
    data = request.get_json()
    new_status = data.get('status')
    allowed_statuses = ['pending', 'in_progress', 'completed']

    if new_status not in allowed_statuses:
        return jsonify({'status': 'failed', 'message': 'Invalid status'}), 400

    now = datetime.datetime.now().isoformat()
    conn = get_db_connection()
    conn.execute(
        'UPDATE tasks SET status = ?, updated_at = ? WHERE id = ?',
        (new_status, now, task_id)
    )
    conn.commit()
    conn.close()
    return jsonify({'status': 'success'})


# Inicializa o banco de dados ao iniciar a aplicação
init_db()

if __name__ == '__main__':
    app.run(debug=True)
