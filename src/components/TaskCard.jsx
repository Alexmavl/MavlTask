import React from "react";
import { 
  CheckSquare, 
  Bug, 
  Bookmark, 
  Zap, 
  Calendar, 
  Trash2, 
  Edit3, 
  Clock,
  ExternalLink,
  MessageSquare,
  Image as ImageIcon
} from "lucide-react";
import { PRIORITIES, ISSUE_TYPES } from "../types/constants";

export default function TaskCard({ task, onEdit, onDelete, provided, snapshot, currentUser }) {
  const priorityInfo = PRIORITIES[task.priority] || PRIORITIES.medium;
  const typeInfo = ISSUE_TYPES[task.type] || ISSUE_TYPES.task;

  const getIcon = (type) => {
    switch(type) {
      case 'bug': return <Bug className="w-3.5 h-3.5 text-rose-500" />;
      case 'story': return <Bookmark className="w-3.5 h-3.5 text-sky-500" />;
      case 'improvement': return <Zap className="w-3.5 h-3.5 text-amber-500" />;
      default: return <CheckSquare className="w-3.5 h-3.5 text-blue-600" />;
    }
  };

  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'done';
  const commentsCount = (task.comments || []).length;
  const imagesCount = (task.images || []).length;
  const isCreator = !task.createdBy || task.createdBy === currentUser?.id || task.createdBy === currentUser?.name;

  return (
    <div
      ref={provided.innerRef}
      {...provided.draggableProps}
      {...provided.dragHandleProps}
      className={`group relative rounded-xl border p-3.5 transition-all duration-200 select-none bg-white shadow-xs hover:shadow-md cursor-grab active:cursor-grabbing ${
        snapshot.isDragging
          ? "border-blue-500 ring-2 ring-blue-500/30 shadow-xl scale-105 z-50 rotate-1 bg-white"
          : "border-slate-200/90 hover:border-blue-300"
      }`}
    >
      {/* Cabecera de la tarjeta */}
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-1.5">
          <span title={typeInfo.label} className="p-1 rounded-md bg-slate-100 border border-slate-200">
            {getIcon(task.type)}
          </span>
          <span className="text-xs font-mono font-bold text-blue-600">
            {task.id}
          </span>
        </div>

        <div className="flex items-center gap-1">
          <span
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold border ${priorityInfo.color}`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${priorityInfo.dot}`}></span>
            {priorityInfo.label}
          </span>

          {/* Botones de acción rápida */}
          <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center ml-1">
            <button
              onClick={(e) => { e.stopPropagation(); onEdit(task); }}
              className="p-1 hover:bg-slate-100 text-slate-400 hover:text-blue-600 rounded transition-colors"
              title={isCreator ? "Editar tarea" : "Ver detalles y comentar"}
            >
              <Edit3 className="w-3.5 h-3.5" />
            </button>
            {isCreator && (
              <button
                onClick={(e) => { e.stopPropagation(); onDelete(task.id); }}
                className="p-1 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded transition-colors"
                title="Eliminar tarea"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Título */}
      <h4 
        onClick={() => onEdit(task)}
        className="text-sm font-semibold text-slate-800 group-hover:text-blue-600 transition-colors line-clamp-2 cursor-pointer mb-1.5 leading-snug"
      >
        {task.title}
      </h4>

      {/* Descripción corta si existe */}
      {task.description && (
        <p className="text-xs text-slate-500 line-clamp-2 mb-2.5 leading-relaxed">
          {task.description}
        </p>
      )}

      {/* Enlace de Referencia si existe */}
      {task.referenceUrl && (
        <div className="mb-2.5">
          <a
            href={task.referenceUrl.startsWith('http') ? task.referenceUrl : `https://${task.referenceUrl}`}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="inline-flex items-center gap-1 text-[11px] font-medium text-sky-600 hover:text-blue-700 bg-sky-50 hover:bg-sky-100 border border-sky-200 px-2 py-0.5 rounded-md transition-colors truncate max-w-full"
            title={task.referenceUrl}
          >
            <ExternalLink className="w-3 h-3 shrink-0" />
            <span className="truncate">{task.referenceUrl.replace(/^https?:\/\//, '')}</span>
          </a>
        </div>
      )}

      {/* Tags */}
      {task.tags && task.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-2.5">
          {task.tags.map((tag, idx) => (
            <span
              key={idx}
              className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-100 text-[10px] font-medium"
            >
              #{tag}
            </span>
          ))}
        </div>
      )}

      {/* Pie de tarjeta: Fecha, Evidencias/Imágenes, Comentarios y Asignado */}
      <div className="flex items-center justify-between pt-2 mt-1 border-t border-slate-100 text-xs text-slate-500">
        <div className="flex items-center gap-2">
          {task.dueDate ? (
            <span
              className={`flex items-center gap-1 text-[11px] px-1.5 py-0.5 rounded font-medium ${
                isOverdue
                  ? "text-rose-600 bg-rose-50 border border-rose-200"
                  : "text-slate-600 bg-slate-50 border border-slate-200"
              }`}
            >
              <Calendar className="w-3 h-3 text-blue-500" />
              {task.dueDate}
            </span>
          ) : (
            <span className="text-slate-400 text-[11px] flex items-center gap-1">
              <Clock className="w-3 h-3" /> Sin fecha
            </span>
          )}

          {/* Badge de Imágenes Adjuntas */}
          {imagesCount > 0 && (
            <span 
              onClick={() => onEdit(task)}
              className="flex items-center gap-1 text-[11px] text-sky-700 bg-sky-50 border border-sky-200 px-1.5 py-0.5 rounded-md hover:bg-sky-100 cursor-pointer font-medium"
              title={`${imagesCount} capturas de prueba adjuntas`}
            >
              <ImageIcon className="w-3 h-3 text-sky-600" />
              {imagesCount}
            </span>
          )}

          {/* Contador de Comentarios */}
          {commentsCount > 0 && (
            <span 
              onClick={() => onEdit(task)}
              className="flex items-center gap-1 text-[11px] text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded-md hover:bg-blue-50 hover:text-blue-600 cursor-pointer font-medium"
              title={`${commentsCount} comentarios`}
            >
              <MessageSquare className="w-3 h-3 text-blue-500" />
              {commentsCount}
            </span>
          )}
        </div>

        {/* Asignado */}
        <div className="flex items-center gap-1.5">
          <div 
            title={task.assignee || 'Sin asignar'}
            className="w-6 h-6 rounded-full bg-gradient-to-tr from-blue-600 to-sky-500 flex items-center justify-center text-[10px] font-bold text-white shadow-xs ring-1 ring-blue-200"
          >
            {(task.assignee || 'U').substring(0, 2).toUpperCase()}
          </div>
        </div>
      </div>
    </div>
  );
}
