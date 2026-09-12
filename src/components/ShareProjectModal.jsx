import React, { useState } from "react";
import { X, Share2, Copy, Check, Users, UserPlus, Link as LinkIcon } from "lucide-react";

export default function ShareProjectModal({ isOpen, onClose, project, onAddMember, onRemoveMember, currentUser }) {
  const [copied, setCopied] = useState(false);
  const [newMemberName, setNewMemberName] = useState("");
  const [newMemberEmail, setNewMemberEmail] = useState("");

  if (!isOpen || !project) return null;

  const inviteUrl = `${window.location.origin}${window.location.pathname}?project=${project.id}`;
  const isOwner = currentUser?.id === project.ownerId;

  const handleCopy = () => {
    navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleManualAddMember = (e) => {
    e.preventDefault();
    if (!newMemberName.trim()) return;

    onAddMember({
      id: 'usr_' + Date.now().toString().slice(-5),
      name: newMemberName.trim(),
      email: newMemberEmail.trim() || `${newMemberName.trim().toLowerCase().replace(/\s+/g, '')}@empresa.com`
    });

    setNewMemberName("");
    setNewMemberEmail("");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="w-full max-w-lg bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <Share2 className="w-5 h-5 text-blue-600" />
            <h3 className="text-lg font-bold text-slate-800">
              Gestión de Equipo: <span className="text-blue-600">{project.name}</span>
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5 text-sm">
          {/* Link de Compartir */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <LinkIcon className="w-3.5 h-3.5 text-blue-600" />
              Enlace de acceso directo al proyecto
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={inviteUrl}
                className="flex-1 px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 text-xs font-mono select-all focus:outline-none focus:border-blue-500"
              />
              <button
                onClick={handleCopy}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
                  copied
                    ? "bg-emerald-600 text-white shadow-sm"
                    : "bg-blue-600 hover:bg-blue-700 text-white shadow-sm shadow-blue-500/20"
                }`}
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? "¡Copiado!" : "Copiar"}
              </button>
            </div>
            <p className="text-[11px] text-slate-500 mt-1.5 leading-relaxed">
              Cualquier compañero que abra este enlace se unirá automáticamente a este proyecto.
            </p>
          </div>

          {/* Miembros Actuales */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-blue-600" />
                Miembros vinculados ({(project.members || []).length})
              </span>
            </label>
            
            <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
              {(project.members || []).map((m, idx) => {
                const isUserOwner = m.id === project.ownerId;
                return (
                  <div 
                    key={idx} 
                    className="flex items-center justify-between px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs hover:bg-white transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-blue-600 to-sky-500 flex items-center justify-center font-bold text-white text-[11px]">
                        {m.name.substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-semibold text-slate-800">
                          {m.name} {m.id === currentUser?.id ? "(Tú)" : ""}
                        </p>
                        {m.email && <p className="text-[10px] text-slate-500">{m.email}</p>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] px-2 py-0.5 rounded font-medium border ${
                        isUserOwner ? "bg-amber-50 text-amber-700 border-amber-200" : "bg-blue-50 text-blue-700 border-blue-200"
                      }`}>
                        {isUserOwner ? "Dueño" : "Miembro"}
                      </span>
                      {isOwner && !isUserOwner && (
                        <button
                          onClick={() => {
                            if (window.confirm(`¿Seguro que deseas desvincular a ${m.name} del proyecto?`)) {
                              onRemoveMember(m.id);
                            }
                          }}
                          className="p-1 text-rose-500 hover:bg-rose-100 hover:text-rose-700 rounded-lg transition-colors"
                          title="Desvincular usuario"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Agregar Miembro Rápido */}
          <form onSubmit={handleManualAddMember} className="pt-3 border-t border-slate-100">
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <UserPlus className="w-3.5 h-3.5 text-blue-600" />
              Vincular nuevo compañero manualmente
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Nombre (ej. María López)"
                value={newMemberName}
                onChange={(e) => setNewMemberName(e.target.value)}
                className="flex-1 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="submit"
                className="px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium border border-slate-300 transition-colors"
              >
                Agregar
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
