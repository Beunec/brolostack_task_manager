import React, { useState } from 'react';
import { Check, Edit2, Trash2, Calendar, Tag, AlertCircle, Clock } from 'lucide-react';
import { Task } from '../types/task';
import { useTaskContext } from '../context/TaskContext';
import TaskForm from './TaskForm';

interface TaskItemProps {
  task: Task;
}

const TaskItem: React.FC<TaskItemProps> = ({ task }) => {
  const { toggleTask, deleteTask } = useTaskContext();
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleToggle = async () => {
    await toggleTask(task.id);
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      setIsDeleting(true);
      await deleteTask(task.id);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getDueDateStatus = (dueDate?: string) => {
    if (!dueDate) return null;
    
    const today = new Date();
    const due = new Date(dueDate);
    const diffTime = due.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return { status: 'overdue', color: 'text-red-600', bg: 'bg-red-100' };
    if (diffDays === 0) return { status: 'today', color: 'text-orange-600', bg: 'bg-orange-100' };
    if (diffDays <= 3) return { status: 'soon', color: 'text-yellow-600', bg: 'bg-yellow-100' };
    return { status: 'future', color: 'text-gray-600', bg: 'bg-gray-100' };
  };

  const priorityConfig = {
    high: { color: 'text-red-600', bg: 'bg-red-100', border: 'border-red-200' },
    medium: { color: 'text-orange-600', bg: 'bg-orange-100', border: 'border-orange-200' },
    low: { color: 'text-green-600', bg: 'bg-green-100', border: 'border-green-200' },
  };

  const dueDateInfo = getDueDateStatus(task.dueDate);

  if (isEditing) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <TaskForm
          mode="edit"
          taskId={task.id}
          initialData={task}
          onClose={() => setIsEditing(false)}
        />
      </div>
    );
  }

  return (
    <div 
      className={`bg-white rounded-lg shadow-sm border transition-all duration-200 hover:shadow-md ${
        task.completed ? 'opacity-75 bg-gray-50' : ''
      } ${isDeleting ? 'opacity-50 scale-95' : ''}`}
    >
      <div className="p-4">
        <div className="flex items-start space-x-3">
          <button
            onClick={handleToggle}
            className={`mt-1 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
              task.completed
                ? 'bg-green-500 border-green-500 text-white'
                : 'border-gray-300 hover:border-green-500'
            }`}
          >
            {task.completed && <Check className="w-3 h-3" />}
          </button>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between">
              <h3 
                className={`font-medium transition-all ${
                  task.completed 
                    ? 'line-through text-gray-500' 
                    : 'text-gray-900'
                }`}
              >
                {task.title}
              </h3>
              <div className="flex items-center space-x-2 ml-2">
                <button
                  onClick={() => setIsEditing(true)}
                  className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                  title="Edit task"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={handleDelete}
                  className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                  title="Delete task"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {task.description && (
              <p className={`mt-1 text-sm ${task.completed ? 'text-gray-400' : 'text-gray-600'}`}>
                {task.description}
              </p>
            )}

            <div className="flex items-center flex-wrap gap-2 mt-3">
              <span 
                className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                  priorityConfig[task.priority].bg
                } ${priorityConfig[task.priority].color}`}
              >
                <AlertCircle className="w-3 h-3 mr-1" />
                {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
              </span>

              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                <Tag className="w-3 h-3 mr-1" />
                {task.category}
              </span>

              {task.dueDate && (
                <span 
                  className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    dueDateInfo?.bg || 'bg-gray-100'
                  } ${dueDateInfo?.color || 'text-gray-700'}`}
                >
                  <Calendar className="w-3 h-3 mr-1" />
                  {formatDate(task.dueDate)}
                  {dueDateInfo?.status === 'overdue' && ' (Overdue)'}
                  {dueDateInfo?.status === 'today' && ' (Today)'}
                </span>
              )}

              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-500">
                <Clock className="w-3 h-3 mr-1" />
                {formatDate(task.createdAt)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TaskItem;