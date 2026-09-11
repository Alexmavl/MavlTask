import React, { useState } from "react";
import { X, FolderPlus } from "lucide-react";

export default function ProjectModal({ isOpen, onClose, onCreateProject }) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [key, setKey] = useState("");

  if (!isOpen) return null;

  const handleNameChange = (val) => {
    setName(val);
    const words = val.trim().split(/\s+/);
    if (words.length >= 2) {
      setKey(words.map(w => w[0]).join('').substring(0, 4).toUpperCase());
    } else if (val.length >= 3) {
      setKey(val.substring(0, 3).toUpperCase());
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    onCreateProject({
      name: name.trim(),
      description: description.trim(),
      key: (key.trim() || 'PROJ').toUpperCase()
    });

    setName("");
    setDescription("");
    setKey("");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="w-full max-w-md bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <FolderPlus className="w-5 h-5 text-blue-600" />
            <h3 className="text-lg font-bold text-slate-800">Crear Nuevo Proyecto</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Nombre del Proyecto *
            </label>
            <input
              type="text"
              required
              placeholder="Ej. Sistema de Facturación, App Móvil..."
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Clave de Tareas (Prefijo) *
            </label>
            <input
              type="text"
              required
              maxLength={6}
              placeholder="Ej. MAT, FACT, APP"
              value={key}
              onChange={(e) => setKey(e.target.value.toUpperCase())}
              className="w-full font-mono uppercase px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <span className="text-[11px] text-slate-500 mt-1 block">
              Las tareas se generarán como: <strong className="text-blue-600">{key || 'KEY'}-1</strong>, <strong className="text-blue-600">{key || 'KEY'}-2</strong>...
            </span>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Descripción
            </label>
            <textarea
              rows={2}
              placeholder="Objetivo o alcance de este proyecto..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-100"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 active:scale-98 shadow-md shadow-blue-500/20"
            >
              Crear Tablero
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
