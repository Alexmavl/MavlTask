import React, { useState, useEffect } from "react";
import { X, Calendar, Flag, Sparkles, Trash2, CheckCircle2, Clock } from "lucide-react";

export default function SprintModal({
  isOpen,
  onClose,
  onSaveSprint,
  onDeleteSprint,
  sprintToEdit = null
}) {
  const [formData, setFormData] = useState({
    name: "",
    goal: "",
    startDate: "",
    endDate: "",
    status: "active"
  });

  useEffect(() => {
    if (sprintToEdit) {
      setFormData({
        name: sprintToEdit.name || "",
        goal: sprintToEdit.goal || "",
        startDate: sprintToEdit.startDate || "",
        endDate: sprintToEdit.endDate || "",
        status: sprintToEdit.status || "active"
      });
    } else {
      // Fechas por defecto: 2 semanas a partir de hoy
      const today = new Date();
      const twoWeeksLater = new Date();
      twoWeeksLater.setDate(today.getDate() + 14);

      setFormData({
        name: "",
        goal: "",
        startDate: today.toISOString().split("T")[0],
        endDate: twoWeeksLater.toISOString().split("T")[0],
        status: "active"
      });
    }
  }, [sprintToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    onSaveSprint({
      ...(sprintToEdit || {}),
      name: formData.name.trim(),
      goal: formData.goal.trim(),
      startDate: formData.startDate,
      endDate: formData.endDate,
      status: formData.status
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="w-full max-w-lg bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span>
            <h3 className="text-base sm:text-lg font-bold text-slate-800">
              {sprintToEdit ? `Editar ${sprintToEdit.name}` : "Crear Nuevo Sprint"}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4">
          
          {/* Nombre del Sprint */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Nombre del Sprint *
            </label>
            <input
              type="text"
              required
              placeholder="Ej. Sprint 1, Sprint 2 - Lanzamiento Beta..."
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Objetivo del Sprint */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Objetivo del Sprint (Goal)
            </label>
            <textarea
              rows={2}
              placeholder="¿Qué meta o entrega principal logrará el equipo en este sprint?..."
              value={formData.goal}
              onChange={(e) => setFormData({ ...formData, goal: e.target.value })}
              className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          {/* Fechas Inicio y Fin */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-blue-600" />
                Fecha Inicio
              </label>
              <input
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-rose-600" />
                Fecha Fin
              </label>
              <input
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Estado del Sprint */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Estado del Sprint
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, status: "active" })}
                className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  formData.status === "active"
                    ? "bg-emerald-50 border-emerald-400 text-emerald-700 shadow-xs"
                    : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                Activo
              </button>

              <button
                type="button"
                onClick={() => setFormData({ ...formData, status: "planned" })}
                className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  formData.status === "planned"
                    ? "bg-blue-50 border-blue-400 text-blue-700 shadow-xs"
                    : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                Planificado
              </button>

              <button
                type="button"
                onClick={() => setFormData({ ...formData, status: "completed" })}
                className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  formData.status === "completed"
                    ? "bg-slate-200 border-slate-400 text-slate-700 shadow-xs"
                    : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                }`}
              >
                <Flag className="w-3.5 h-3.5" />
                Cerrado
              </button>
            </div>
          </div>

          {/* Footer de Acciones */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
            {sprintToEdit && onDeleteSprint ? (
              <button
                type="button"
                onClick={() => {
                  if (window.confirm(`¿Seguro que deseas eliminar ${sprintToEdit.name}? Las tareas no se borrarán, quedarán sin sprint asignado.`)) {
                    onDeleteSprint(sprintToEdit.id);
                    onClose();
                  }
                }}
                className="flex items-center gap-1 text-xs text-rose-600 hover:text-rose-800 hover:bg-rose-50 px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Eliminar</span>
              </button>
            ) : <div />}

            <div className="flex gap-2.5">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs sm:text-sm font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl text-xs sm:text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 active:scale-98 transition-all shadow-md shadow-blue-500/20 cursor-pointer"
              >
                {sprintToEdit ? "Guardar Cambios" : "Crear Sprint"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
