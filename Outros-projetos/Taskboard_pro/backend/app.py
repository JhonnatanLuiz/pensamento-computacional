# backend/app.py

from flask import Flask, jsonify, request
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
import os

#---CONFIGURAÇÃO DA APLICAÇÃO---
app = Flask(__name__)
# Configura o CORS para permitir requisições do frontend
CORS(app)

# Configuração do banco de dados SQLite
basedir = os.path.abspath(os.path.dirname(__file__))
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///' + os.path.join(basedir, 'tasks.db')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)

# ---MODELOS DE DADOS (DATABASE MODELS)---
class Column(db.Model):
    id = db.Column(db.String(50), primary_key=True)
    title = db.Column(db.String(100), nullable=False)
    # Relação: Uma coluna pode te muitas tarefas
    tasks = db.relationship('Task', backref='column', cascade="all, delete-orphan", lazy=True)

    def to_dict(self):
        return {
            'id': self.id,
            'title': self.title,
            'tasks': [task.to_dict() for task in self.tasks]
        }
    
class Task(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    text = db.Column(db.String(200), nullable=False)
    # Chave Estrangeira: Conecta a tarefa à coluna
    column_id = db.Column(db.String(50), db.ForeignKey('column.id'), nullable=False)

    def to_dict(self):
        return {
            'id': self.id,
            'text': self.text,
            'column_id': self.column_id
        }
    
    #---ROTAS DA API (API ROUTES)---

    # Rota para obter o estado completo do quadro (board)
@app.route('/api/board', methods=['GET'])
def get_board():
    columns = Column.query.order_by(Column.id).all() # Ordena a coluna pelo ID
    return jsonify([column.to_dict() for column in columns])

# Rota para adicionar uma nova tarefa
@app.route('/api/tasks', methods=['POST'])
def add_task():
    data = request.get_json()
    if not data or 'text' not in data or 'column_id' not in data:
        return jsonify({'error': 'Dados inválidos'}), 400
    
    new_task = Task(text=data['text'], column_id=data['column_id'])
    db.session.add(new_task)
    db.session.commit()
    return jsonify(new_task.to_dict()), 201

# Rota para atualizar uma tarefa (ex: mover para outra coluna)
@app.route('/api/tasks/<int:task_id>', methods=['PUT'])
def update_task(task_id):
    task = Task.query.get_or_404(task_id)
    data = request.get_json()
    if not data or 'column_id' not in data:
        return jsonify({'error': 'Dados inválidos'}), 400
    
    task.column_id = data['column_id']
    # Poderiamos atualizar o texto também: task.text = data.get('text', task.text)
    db.session.commit()
    return jsonify(task.to_dict())

# Rota para deletar uma tarefa
@app.route('/api/tasks/<int:task_id>', methods=['DELETE'])
def delete_task(task_id):
    task = Task.query.get_or_404(task_id)
    db.session.delete(task)
    db.session.commit()
    return jsonify({'message': 'Tarefa deletada com sucesso'}), 200

# INICIALIZAÇÃO E SETUP DO BANCO DE DADOS ---
with app.app_context():
    db.create_all() # Cria as tabelas se não existirem

    # Adiciona as colunas padrão na primeira vez que o app roda
    if not Column.query.first():
        default_columns = [
            Column(id='todo', title= 'A Fazer'),
            Column(id='inprogress', title='Em Progresso'),
            Column(id='done', title='Concluído')
        ]
        db.session.bulk_save_objects(default_columns)
        db.session.commit()
if __name__ == '__main__':
    app.run(debug=True) # Roda o srvidor Flask em modo de desenvolvimento
