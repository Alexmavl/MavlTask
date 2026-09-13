import React, { useState, useEffect, useRef } from "react";
import { 
  X, 
  Calendar, 
  Tag, 
  User, 
  Link as LinkIcon, 
  ExternalLink, 
  MessageSquare, 
  Send, 
  Clock, 
  Trash2,
  Image as ImageIcon,
  Lock,
  Paperclip,
  UploadCloud,
  Check
} from "lucide-react";
import { PRIORITIES, ISSUE_TYPES, DEFAULT_COLUMNS } from "../types/constants";
import UserSelect from "./UserSelect";

// Función utilitaria para redimensionar y comprimir imágenes (reduce ~3MB a ~25-40KB en Base64)
// evitando exceder el límite de 1MB de Firestore o cuotas de LocalStorage
export const compressImage = (file, maxWidth = 800, maxHeight = 800, quality = 0.65) => {
  return new Promise((resolve) => {
    if (!file || !file.type.startsWith("image/")) {
      resolve(null);
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > maxWidth || height > maxHeight) {
          if (width / height > maxWidth / maxHeight) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          } else {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);

        // Convertir a JPEG para optimizar drásticamente el tamaño Base64
        const compressedBase64 = canvas.toDataURL("image/jpeg", quality);
        resolve(compressedBase64);
      };
      img.onerror = () => resolve(e.target.result);
      img.src = e.target.result;
    };
    reader.onerror = () => resolve(null);
    reader.readAsDataURL(file);
  });
};

export default function TaskModal({ 
  isOpen, 
  onClose, 
  onSave, 
  taskToEdit, 
  members = [], 
  currentUser 
}) {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    status: "todo",
    priority: "medium",
    type: "task",
    assignee: currentUser?.name || "Sin asignar",
    dueDate: "",
    referenceUrl: "",
    tagsInput: "",
    images: []
  });

  const [comments, setComments] = useState([]);
  const [newCommentText, setNewCommentText] = useState("");
  const [commentImages, setCommentImages] = useState([]);
  const [previewImage, setPreviewImage] = useState(null);
  const [isProcessingImage, setIsProcessingImage] = useState(false);
  const prevTaskIdRef = useRef(null);
  
  // Estados de Drag & Drop sobre zonas de subida
  const [isDraggingTaskImg, setIsDraggingTaskImg] = useState(false);
  const [isDraggingCommentImg, setIsDraggingCommentImg] = useState(false);

  const isCreator = !taskToEdit?.createdBy || taskToEdit?.createdBy === currentUser?.id || taskToEdit?.createdBy === currentUser?.name;
  const canEditBody = !taskToEdit?.id || isCreator;

  useEffect(() => {
    if (!isOpen) {
      prevTaskIdRef.current = null;
      return;
    }

    const currentId = taskToEdit?.id || null;
    const isDifferentTask = currentId !== prevTaskIdRef.current;

    if (taskToEdit) {
      if (isDifferentTask) {
        setFormData({
          title: taskToEdit.title || "",
          description: taskToEdit.description || "",
          status: taskToEdit.status || "todo",
          priority: taskToEdit.priority || "medium",
          type: taskToEdit.type || "task",
          assignee: taskToEdit.assignee || (currentUser?.name || "Sin asignar"),
          dueDate: taskToEdit.dueDate || "",
          referenceUrl: taskToEdit.referenceUrl || "",
          tagsInput: (taskToEdit.tags || []).join(", "),
          images: taskToEdit.images || []
        });
        setComments(taskToEdit.comments || []);
        setNewCommentText("");
        setCommentImages([]);
      } else {
        // Misma tarea abierta: sincronizar comentarios sin borrar el borrador que escribe el usuario
        setComments(taskToEdit.comments || []);
      }
    } else {
      setFormData({
        title: "",
        description: "",
        status: "todo",
        priority: "medium",
        type: "task",
        assignee: currentUser?.name || "Sin asignar",
        dueDate: "",
        referenceUrl: "",
        tagsInput: "",
        images: []
      });
      setComments([]);
      setNewCommentText("");
      setCommentImages([]);
    }
    prevTaskIdRef.current = currentId;
  }, [taskToEdit, isOpen, currentUser]);

  // Procesar archivos con compresión a Base64
  const processFiles = async (files, isComment = false) => {
    const fileArray = Array.from(files).filter(f => f.type.startsWith("image/"));
    if (fileArray.length === 0) return;

    setIsProcessingImage(true);
    try {
      for (const file of fileArray) {
        const compressed = await compressImage(file);
        if (compressed) {
          if (isComment) {
            setCommentImages(prev => [...prev, compressed]);
          } else {
            setFormData(prev => ({
              ...prev,
              images: [...(prev.images || []), compressed]
            }));
          }
        }
      }
    } finally {
      setIsProcessingImage(false);
    }
  };

  const handleImageUpload = (e, isComment = false) => {
    if (e.target.files) {
      processFiles(e.target.files, isComment);
    }
  };

  // 1. Pegar con Ctrl + V (Paste Event)
  const handlePaste = (e, isComment = false) => {
    const clipboardData = e.clipboardData || window.clipboardData;
    if (!clipboardData) return;

    const items = clipboardData.items;
    const imageFiles = [];

    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf("image") !== -1) {
        const file = items[i].getAsFile();
        if (file) imageFiles.push(file);
      }
    }

    if (imageFiles.length > 0) {
      e.preventDefault();
      processFiles(imageFiles, isComment);
    }
  };

  // 2. Arrastrar y Soltar (Drag & Drop de Archivos)
  const handleDrop = (e, isComment = false) => {
    e.preventDefault();
    e.stopPropagation();

    if (isComment) {
      setIsDraggingCommentImg(false);
    } else {
      setIsDraggingTaskImg(false);
    }

    if (e.dataTransfer && e.dataTransfer.files) {
      processFiles(e.dataTransfer.files, isComment);
    }
  };

  const handleDragOver = (e, isComment = false) => {
    e.preventDefault();
    e.stopPropagation();
    if (isComment) {
      setIsDraggingCommentImg(true);
    } else if (canEditBody) {
      setIsDraggingTaskImg(true);
    }
  };

  const handleDragLeave = (e, isComment = false) => {
    e.preventDefault();
    e.stopPropagation();
    if (isComment) {
      setIsDraggingCommentImg(false);
    } else {
      setIsDraggingTaskImg(false);
    }
  };

  const handleRemoveTaskImage = (idx) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== idx)
    }));
  };

  const handleRemoveCommentImage = (idx) => {
    setCommentImages(prev => prev.filter((_, i) => i !== idx));
  };

  const handleAddComment = (e) => {
    if (e) e.preventDefault();
    if (isProcessingImage) return;
    if (!newCommentText.trim() && commentImages.length === 0) return;

    const newComment = {
      id: "comment_" + Date.now(),
      author: currentUser?.name || "Usuario",
      authorId: currentUser?.id || null,
      text: newCommentText.trim(),
      images: commentImages || [],
      createdAt: new Date().toISOString()
    };

    const updatedComments = [...comments, newComment];
    setComments(updatedComments);
    setNewCommentText("");
    setCommentImages([]);

    if (taskToEdit?.id) {
      onSave({
        ...taskToEdit,
        status: formData.status,
        comments: updatedComments
      });
    }
  };

  const handleDeleteComment = (commentId, commentAuthorId, commentAuthorName) => {
    if (commentAuthorId && commentAuthorId !== currentUser?.id && commentAuthorName !== currentUser?.name && !isCreator) {
      alert("Solo el autor de este comentario puede eliminarlo.");
      return;
    }

    const updated = comments.filter(c => c.id !== commentId);
    setComments(updated);

    if (taskToEdit?.id) {
      onSave({
        ...taskToEdit,
        status: formData.status,
        comments: updated
      });
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // Auto-incluir comentario o imagen pendiente al presionar Guardar
    let finalComments = [...comments];
    if (newCommentText.trim() || commentImages.length > 0) {
      const autoComment = {
        id: "comment_" + Date.now(),
        author: currentUser?.name || "Usuario",
        authorId: currentUser?.id || null,
        text: newCommentText.trim(),
        images: commentImages || [],
        createdAt: new Date().toISOString()
      };
      finalComments.push(autoComment);
      setComments(finalComments);
      setNewCommentText("");
      setCommentImages([]);
    }

    if (!canEditBody && taskToEdit?.id) {
      onSave({
        ...taskToEdit,
        status: formData.status,
        comments: finalComments
      });
      onClose();
      return;
    }

    if (!formData.title.trim()) return;

    const tags = formData.tagsInput
      .split(",")
      .map(t => t.trim())
      .filter(Boolean);

    const taskPayload = {
      ...taskToEdit,
      title: formData.title.trim(),
      description: formData.description.trim(),
      status: formData.status,
      priority: formData.priority,
      type: formData.type,
      assignee: formData.assignee.trim() || "Sin asignar",
      dueDate: formData.dueDate || "",
      referenceUrl: formData.referenceUrl.trim() || "",
      images: formData.images || [],
      tags: tags || [],
      comments: finalComments || [],
      createdBy: taskToEdit?.createdBy || currentUser?.id || null,
      createdByName: taskToEdit?.createdByName || currentUser?.name || "Usuario"
    };

    onSave(taskPayload);
    onClose();
  };


  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="w-full max-w-2xl bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
        onPaste={(e) => {
          // Si el usuario pega una imagen en cualquier parte del modal, procesarla como evidencia
          const clipboardData = e.clipboardData || window.clipboardData;
          if (clipboardData?.items) {
            const hasImage = Array.from(clipboardData.items).some(item => item.type.startsWith("image/"));
            if (hasImage) {
              handlePaste(e, true);
            }
          }
        }}
      >
        {/* Modal Header */}
        <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span>
            <h3 className="text-base sm:text-lg font-bold text-slate-800">
              {taskToEdit?.id ? `Incidencia #${taskToEdit.taskCode || taskToEdit.code || taskToEdit.id}` : "Nueva Tarea / Incidencia"}
            </h3>
            {!canEditBody && (
              <span className="flex items-center gap-1 text-[11px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md">
                <Lock className="w-3 h-3 text-amber-600" />
                Solo lectura (Creado por {taskToEdit?.createdByName || "otro usuario"})
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 overflow-y-auto space-y-4 flex-1">
          {/* Título */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center justify-between">
              <span>Título de la Tarea *</span>
              {!canEditBody && <span className="text-[11px] text-slate-400 font-normal">Bloqueado para edición</span>}
            </label>
            <input
              type="text"
              required
              disabled={!canEditBody}
              placeholder="Ej. Diseñar arquitectura de base de datos..."
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className={`w-full px-3.5 py-2 rounded-xl border text-sm transition-all ${
                canEditBody 
                  ? "bg-slate-50 border-slate-200 text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500" 
                  : "bg-slate-100/70 border-slate-200 text-slate-700 cursor-not-allowed"
              }`}
            />
          </div>

          {/* Tipo, Estado y Prioridad */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Tipo
              </label>
              <select
                disabled={!canEditBody}
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className={`w-full px-3 py-2 rounded-xl border text-sm ${
                  canEditBody 
                    ? "bg-slate-50 border-slate-200 text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    : "bg-slate-100/70 border-slate-200 text-slate-700 cursor-not-allowed"
                }`}
              >
                {Object.entries(ISSUE_TYPES).map(([key, val]) => (
                  <option key={key} value={key}>
                    {val.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Estado
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
              >
                {DEFAULT_COLUMNS.map((col) => (
                  <option key={col.id} value={col.id}>
                    {col.title}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Prioridad
              </label>
              <select
                disabled={!canEditBody}
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                className={`w-full px-3 py-2 rounded-xl border text-sm ${
                  canEditBody 
                    ? "bg-slate-50 border-slate-200 text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    : "bg-slate-100/70 border-slate-200 text-slate-700 cursor-not-allowed"
                }`}
              >
                {Object.entries(PRIORITIES).map(([key, val]) => (
                  <option key={key} value={key}>
                    {val.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Enlace de Referencia */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <LinkIcon className="w-3.5 h-3.5 text-blue-600" />
                Enlace / Link de Referencia
              </span>
              {formData.referenceUrl && (
                <a
                  href={formData.referenceUrl.startsWith('http') ? formData.referenceUrl : `https://${formData.referenceUrl}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-sky-600 hover:text-blue-700 inline-flex items-center gap-1 font-normal lowercase"
                >
                  Abrir enlace <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </label>
            <input
              type="text"
              disabled={!canEditBody}
              placeholder="https://github.com/..., https://figma.com/..., docs, etc."
              value={formData.referenceUrl}
              onChange={(e) => setFormData({ ...formData, referenceUrl: e.target.value })}
              className={`w-full px-3.5 py-2 rounded-xl border text-sm font-mono text-xs ${
                canEditBody 
                  ? "bg-slate-50 border-slate-200 text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  : "bg-slate-100/70 border-slate-200 text-slate-700 cursor-not-allowed"
              }`}
            />
          </div>

          {/* Descripción con soporte de Pegar (Ctrl+V) */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Descripción detallada
            </label>
            <textarea
              rows={2}
              disabled={!canEditBody}
              placeholder="Añade detalles o pega texto/capturas directamente con Ctrl+V..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              onPaste={(e) => canEditBody && handlePaste(e, false)}
              className={`w-full px-3.5 py-2 rounded-xl border text-sm resize-none ${
                canEditBody 
                  ? "bg-slate-50 border-slate-200 text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  : "bg-slate-100/70 border-slate-200 text-slate-700 cursor-not-allowed"
              }`}
            />
          </div>

          {/* Zona Drag & Drop / Pegar de Imágenes de Prueba de la Tarea */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <ImageIcon className="w-3.5 h-3.5 text-blue-600" />
                Capturas de Prueba ({(formData.images || []).length})
              </label>
              {canEditBody && (
                <label className="cursor-pointer text-xs font-semibold text-blue-600 hover:text-blue-700 inline-flex items-center gap-1">
                  <Paperclip className="w-3.5 h-3.5" /> Adjuntar Imagen
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={(e) => handleImageUpload(e, false)}
                  />
                </label>
              )}
            </div>

            {/* Dropzone con soporte de Arrastrar y Soltar o Ctrl+V */}
            {canEditBody && (
              <div
                onDrop={(e) => handleDrop(e, false)}
                onDragOver={(e) => handleDragOver(e, false)}
                onDragLeave={(e) => handleDragLeave(e, false)}
                onPaste={(e) => handlePaste(e, false)}
                tabIndex={0}
                className={`border-2 border-dashed rounded-xl p-3 text-center transition-colors cursor-pointer flex flex-col items-center justify-center gap-1 outline-none ${
                  isDraggingTaskImg 
                    ? "border-blue-500 bg-blue-50" 
                    : "border-slate-200 hover:border-blue-300 bg-slate-50/50 hover:bg-slate-50"
                }`}
              >
                <UploadCloud className="w-5 h-5 text-blue-500" />
                <p className="text-xs text-slate-600 font-medium">
                  <strong>Arrastra aquí capturas</strong> o pega con <kbd className="px-1 py-0.5 rounded bg-white border border-slate-300 text-[10px] font-mono">Ctrl + V</kbd>
                </p>
              </div>
            )}

            {/* Grid de miniaturas adjuntas */}
            {formData.images && formData.images.length > 0 && (
              <div className="flex flex-wrap gap-2 p-2 bg-slate-50 border border-slate-200 rounded-xl mt-2">
                {formData.images.map((img, idx) => (
                  <div key={idx} className="relative group w-16 h-16 rounded-lg overflow-hidden border border-slate-300 shadow-2xs">
                    <img 
                      src={img} 
                      alt={`Adjunto ${idx}`} 
                      className="w-full h-full object-cover cursor-pointer hover:opacity-90"
                      onClick={() => setPreviewImage(img)}
                    />
                    {canEditBody && (
                      <button
                        type="button"
                        onClick={() => handleRemoveTaskImage(idx)}
                        className="absolute top-0.5 right-0.5 bg-rose-600 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Eliminar imagen"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Asignado y Fecha límite */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-blue-600" />
                Asignado a
              </label>
              {members.length > 0 ? (
                <UserSelect
                  value={formData.assignee}
                  onChange={(val) => setFormData({ ...formData, assignee: val })}
                  members={members}
                  currentUser={currentUser}
                  disabled={!canEditBody}
                  className={!canEditBody ? "bg-slate-100/70" : "bg-slate-50 hover:bg-white"}
                />
              ) : (
                <input
                  type="text"
                  disabled={!canEditBody}
                  placeholder="Nombre del responsable"
                  value={formData.assignee}
                  onChange={(e) => setFormData({ ...formData, assignee: e.target.value })}
                  className={`w-full px-3.5 py-2 rounded-xl border text-sm ${
                    canEditBody 
                      ? "bg-slate-50 border-slate-200 text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      : "bg-slate-100/70 border-slate-200 text-slate-700 cursor-not-allowed"
                  }`}
                />
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-blue-600" />
                Fecha Límite
              </label>
              <input
                type="date"
                disabled={!canEditBody}
                value={formData.dueDate}
                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                className={`w-full px-3.5 py-2 rounded-xl border text-sm ${
                  canEditBody 
                    ? "bg-slate-50 border-slate-200 text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    : "bg-slate-100/70 border-slate-200 text-slate-700 cursor-not-allowed"
                }`}
              />
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5 text-blue-600" />
              Etiquetas (separadas por coma)
            </label>
            <input
              type="text"
              disabled={!canEditBody}
              placeholder="Frontend, Backend, Sprint 1"
              value={formData.tagsInput}
              onChange={(e) => setFormData({ ...formData, tagsInput: e.target.value })}
              className={`w-full px-3.5 py-2 rounded-xl border text-sm ${
                canEditBody 
                  ? "bg-slate-50 border-slate-200 text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  : "bg-slate-100/70 border-slate-200 text-slate-700 cursor-not-allowed"
              }`}
            />
          </div>

          {/* Sección de Comentarios con Soporte de Arrastrar y Pegar Evidencias */}
          <div className="pt-4 border-t border-slate-200 space-y-3">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <MessageSquare className="w-4 h-4 text-blue-600" />
                Comentarios y Evidencias ({comments.length})
              </span>
              <span className="text-[11px] text-slate-500 font-normal">
                Pega con Ctrl+V o arrastra imágenes directamente
              </span>
            </label>

            {/* Lista de comentarios */}
            <div className="space-y-2.5 max-h-52 overflow-y-auto pr-1">
              {comments.map((comment) => (
                <div 
                  key={comment.id}
                  className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs flex flex-col gap-1.5"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 font-bold text-slate-800">
                      {(() => {
                        const m = members?.find(member => member.name === comment.author);
                        if (m?.photoURL) {
                          return (
                            <img src={m.photoURL} alt={comment.author} className="w-5 h-5 rounded-full object-cover border border-blue-200" />
                          );
                        }
                        return (
                          <span className="w-5 h-5 rounded-full bg-blue-600 text-white text-[10px] flex items-center justify-center font-bold">
                            {comment.author.substring(0, 1).toUpperCase()}
                          </span>
                        );
                      })()}
                      <span>{comment.author}</span>
                      {comment.author === currentUser?.name && (
                        <span className="text-[10px] text-blue-600 font-normal">(Tú)</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-slate-400 text-[10px]">
                      <span>{new Date(comment.createdAt).toLocaleDateString()} {new Date(comment.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      <button
                        type="button"
                        onClick={() => handleDeleteComment(comment.id, comment.authorId, comment.author)}
                        className="text-slate-400 hover:text-rose-600 p-0.5"
                        title="Borrar comentario"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>

                  {comment.text && (
                    <p className="text-slate-700 pl-6 leading-relaxed whitespace-pre-wrap">
                      {comment.text}
                    </p>
                  )}

                  {/* Imágenes en comentarios */}
                  {comment.images && comment.images.length > 0 && (
                    <div className="flex flex-wrap gap-2 pl-6 pt-1">
                      {comment.images.map((cImg, cIdx) => (
                        <div key={cIdx} className="w-14 h-14 rounded-lg overflow-hidden border border-slate-300 shadow-2xs">
                          <img
                            src={cImg}
                            alt="Evidencia adjunta"
                            className="w-full h-full object-cover cursor-pointer hover:opacity-80"
                            onClick={() => setPreviewImage(cImg)}
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}

              {comments.length === 0 && (
                <p className="text-xs text-slate-400 italic py-2 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
                  No hay comentarios aún. Deja una nota o pega capturas de prueba.
                </p>
              )}
            </div>

            {/* Preview de imágenes del nuevo comentario */}
            {commentImages.length > 0 && (
              <div className="flex flex-wrap gap-2 p-2 bg-blue-50/50 border border-blue-200 rounded-xl">
                {commentImages.map((img, idx) => (
                  <div key={idx} className="relative group w-12 h-12 rounded-lg overflow-hidden border border-blue-300 shadow-2xs">
                    <img src={img} alt="Preview" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => handleRemoveCommentImage(idx)}
                      className="absolute top-0.5 right-0.5 bg-rose-600 text-white rounded-full p-0.5"
                    >
                      <X className="w-2.5 h-2.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Input con soporte de Ctrl+V y Drag & Drop directo */}
            <div 
              onDrop={(e) => handleDrop(e, true)}
              onDragOver={(e) => handleDragOver(e, true)}
              onDragLeave={(e) => handleDragLeave(e, true)}
              className={`flex gap-2 pt-1 items-center p-1 rounded-2xl transition-colors ${
                isDraggingCommentImg ? "bg-blue-100/70 ring-2 ring-blue-500" : ""
              }`}
            >
              <label 
                className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl border border-slate-300 cursor-pointer transition-colors" 
                title="Adjuntar imagen de prueba"
              >
                <Paperclip className="w-4 h-4 text-blue-600" />
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={(e) => handleImageUpload(e, true)}
                />
              </label>

              <input
                type="text"
                placeholder={isProcessingImage ? "Procesando y optimizando imagen..." : `Comentar o pegar imagen con Ctrl+V...`}
                disabled={isProcessingImage}
                value={newCommentText}
                onChange={(e) => setNewCommentText(e.target.value)}
                onPaste={(e) => handlePaste(e, true)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    if (!isProcessingImage) {
                      handleAddComment(e);
                    }
                  }
                }}
                className="flex-1 px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-60"
              />
              
              <button
                type="button"
                disabled={isProcessingImage || (!newCommentText.trim() && commentImages.length === 0)}
                onClick={handleAddComment}
                className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs shadow-blue-500/20"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{isProcessingImage ? "Procesando..." : "Comentar"}</span>
              </button>
            </div>
          </div>

          {/* Botones de acción del Modal */}
          <div className="pt-4 border-t border-slate-200 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-sm font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-100 transition-colors"
            >
              Cerrar
            </button>
            {canEditBody ? (
              <button
                type="submit"
                className="px-5 py-2 rounded-xl text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 active:scale-98 transition-all shadow-md shadow-blue-500/20 cursor-pointer"
              >
                {taskToEdit?.id ? "Guardar Cambios" : "Crear Tarea"}
              </button>
            ) : (
              <button
                type="submit"
                className="px-5 py-2 rounded-xl text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 active:scale-98 transition-all shadow-md shadow-blue-500/20 cursor-pointer"
              >
                Guardar Estado / Comentarios
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Modal de Vista Previa de Imagen */}
      {previewImage && (
        <div 
          className="fixed inset-0 z-60 bg-black/85 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in"
          onClick={() => setPreviewImage(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh]">
            <img 
              src={previewImage} 
              alt="Vista previa" 
              className="max-w-full max-h-[85vh] rounded-xl shadow-2xl object-contain"
            />
            <button
              onClick={() => setPreviewImage(null)}
              className="absolute -top-3 -right-3 bg-slate-900 text-white rounded-full p-1.5 border border-slate-700 hover:bg-rose-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
