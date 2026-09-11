import React, { useState } from "react";
import { X, FolderKanban, Plus, Share2, Search, Check, FileSpreadsheet } from "lucide-react";
import { PRIORITIES, ISSUE_TYPES } from "../types/constants";

export default function MobileDrawerMenu({
  isOpen,
  onClose,
  projects,
  currentProject,
  onSelectProject,
  onOpenProjectModal,
  onOpenShareModal,
  onOpenProfileModal,
  onOpenDbModal,
  onOpenImportModal,
  currentUser,
  isFirebaseConnected,
  searchTerm,
  setSearchTerm,
  selectedAssignee,
  setSelectedAssignee,
  selectedPriority,
  setSelectedPriority,
  selectedType,
  setSelectedType,
  onResetFilters,
  activeFiltersCount
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 lg:hidden flex">
      {/* Overlay Oscuro */}
      <div
        className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs transition-opacity animate-in fade-in"
        onClick={onClose}
      />

      {/* Panel Lateral Drawer */}
      <div className="relative w-4/5 max-w-sm bg-[#0b192c] border-r border-[#1e3a5f] p-5 flex flex-col h-full shadow-2xl z-10 animate-in slide-in-from-left duration-200">
        
        {/* Cabecera */}
        <div className="flex items-center justify-between pb-4 border-b border-[#1e3a5f]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-sky-400 p-0.5">
              <div className="w-full h-full bg-[#0b192c] rounded-[10px] flex items-center justify-center">
                <FolderKanban className="w-4 h-4 text-sky-400" />
              </div>
            </div>
            <span className="font-extrabold text-base text-white">
              Mavl<span className="text-sky-400">Task</span>
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-[#1e3e62]/50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Contenido */}
        <div className="flex-1 overflow-y-auto py-4 space-y-5 text-sm">
          
          {/* Proyectos */}
          <div>
            <label className="block text-xs font-bold text-sky-300 uppercase tracking-wider mb-2">
              Proyecto Activo
            </label>
            <div className="space-y-1.5">
              {projects.map((p) => (
                <button
                  key={p.id}
                  onClick={() => {
                    onSelectProject(p);
                    onClose();
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-left text-xs font-semibold transition-all ${
                    currentProject?.id === p.id
                      ? "bg-blue-600 text-white shadow-sm"
                      : "bg-[#10243e] hover:bg-[#1e3e62] text-slate-200 border border-[#20436d]"
                  }`}
                >
                  <span className="truncate">{p.name}</span>
                  {currentProject?.id === p.id && <Check className="w-4 h-4 text-white shrink-0" />}
                </button>
              ))}
            </div>

            <div className="flex gap-2 mt-2.5">
              <button
                onClick={() => { onClose(); onOpenProjectModal(); }}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-[#1e3e62]/70 hover:bg-[#1e3e62] text-sky-200 border border-blue-400/30 text-xs font-semibold cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Nuevo</span>
              </button>
              <button
                onClick={() => { onClose(); onOpenImportModal(); }}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-400/30 text-xs font-semibold cursor-pointer"
                title="Importar Excel o CSV"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>Excel</span>
              </button>
              <button
                onClick={() => { onClose(); onOpenShareModal(); }}
                className="flex items-center justify-center px-3 py-2 rounded-xl bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 border border-sky-400/30 text-xs font-semibold cursor-pointer"
                title="Invitar compañeros"
              >
                <Share2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Filtros */}
          <div className="space-y-3 pt-3 border-t border-[#1e3a5f]">
            <label className="block text-xs font-bold text-sky-300 uppercase tracking-wider">
              Búsqueda y Filtros
            </label>

            {/* Buscador */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-sky-300 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar tareas..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-8 pr-3 py-2 text-xs bg-[#10243e] border border-[#20436d] rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-400"
              />
            </div>

            {/* Filtro Usuario */}
            <div>
              <label className="block text-[11px] text-slate-400 mb-1">Filtrar por Usuario:</label>
              <select
                value={selectedAssignee}
                onChange={(e) => setSelectedAssignee(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-[#10243e] border border-[#20436d] rounded-xl text-slate-200 focus:outline-none"
              >
                <option value="all" className="bg-[#0b192c]">Todos los usuarios</option>
                {(currentProject?.members || []).map((m, i) => (
                  <option key={i} value={m.name} className="bg-[#0b192c]">👤 {m.name}</option>
                ))}
                <option value="Sin asignar" className="bg-[#0b192c]">⚪ Sin asignar</option>
              </select>
            </div>

            {/* Filtro Prioridad */}
            <div>
              <label className="block text-[11px] text-slate-400 mb-1">Prioridad:</label>
              <select
                value={selectedPriority}
                onChange={(e) => setSelectedPriority(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-[#10243e] border border-[#20436d] rounded-xl text-slate-200 focus:outline-none"
              >
                <option value="all" className="bg-[#0b192c]">Todas las prioridades</option>
                {Object.entries(PRIORITIES).map(([k, v]) => (
                  <option key={k} value={k} className="bg-[#0b192c]">{v.label}</option>
                ))}
              </select>
            </div>

            {/* Filtro Tipo */}
            <div>
              <label className="block text-[11px] text-slate-400 mb-1">Tipo de Incidencia:</label>
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-[#10243e] border border-[#20436d] rounded-xl text-slate-200 focus:outline-none"
              >
                <option value="all" className="bg-[#0b192c]">Todos los tipos</option>
                {Object.entries(ISSUE_TYPES).map(([k, v]) => (
                  <option key={k} value={k} className="bg-[#0b192c]">{v.label}</option>
                ))}
              </select>
            </div>

            {activeFiltersCount > 0 && (
              <button
                onClick={onResetFilters}
                className="w-full py-2 text-xs text-rose-300 hover:bg-rose-500/20 border border-rose-500/30 rounded-xl transition-colors font-semibold"
              >
                Restablecer Filtros
              </button>
            )}
          </div>
        </div>

        {/* Footer Drawer */}
        <div className="pt-3 border-t border-[#1e3a5f] space-y-2">
          <div className="flex items-center justify-between">
            <button
              onClick={() => { onClose(); onOpenProfileModal(); }}
              className="flex items-center gap-2 text-xs text-slate-300 hover:text-white"
            >
              {currentUser.photoURL ? (
                <img
                  src={currentUser.photoURL}
                  alt={currentUser.name}
                  className="w-7 h-7 rounded-full object-cover border border-blue-400"
                />
              ) : (
                <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center font-bold text-white text-[11px]">
                  {(currentUser.name || "U").substring(0, 2).toUpperCase()}
                </div>
              )}
              <span className="font-semibold truncate max-w-[100px]">{currentUser.name}</span>
            </button>
            <button
              onClick={() => { onClose(); onOpenDbModal(); }}
              className="text-xs text-sky-400 hover:underline"
            >
              {isFirebaseConnected ? "Firebase 🔥" : "Local 💾"}
            </button>
          </div>
          <div className="text-center text-[10px] text-slate-400 pt-1 border-t border-[#1e3a5f]/60">
            Hecho con ❤️ por <span className="text-slate-200 font-semibold">Marvin Vásquez</span>
          </div>
        </div>
      </div>
    </div>
  );
}
