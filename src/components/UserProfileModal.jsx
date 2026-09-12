import React, { useState } from "react";
import { X, User, LogIn, LogOut, Mail, Lock, Check, AlertCircle, Sparkles } from "lucide-react";
import { 
  saveUserProfile, 
  logoutUser 
} from "../services/storage";

export default function UserProfileModal({ 
  isOpen, 
  onClose, 
  currentUser, 
  onProfileUpdated,
  isFirebaseConnected
}) {
  const [name, setName] = useState(currentUser.name || "");
  const [email, setEmail] = useState(currentUser.email || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  if (!isOpen) return null;

  const handleSaveLocal = (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    const updated = {
      ...currentUser,
      name: name.trim(),
      email: email.trim()
    };

    saveUserProfile(updated);
    onProfileUpdated(updated);
    setSuccessMsg("Perfil actualizado correctamente");
    setTimeout(() => {
      setSuccessMsg(null);
      onClose();
    }, 700);
  };



  const handleLogout = async () => {
    if (!window.confirm("¿Deseas cerrar tu sesión actual?")) return;
    setLoading(true);
    try {
      const defaultGuest = await logoutUser();
      onProfileUpdated(defaultGuest);
      setSuccessMsg("Sesión cerrada.");
      setTimeout(() => {
        setSuccessMsg(null);
        onClose();
      }, 600);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const isLoggedIn = !currentUser.isAnonymous && currentUser.email;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="w-full max-w-md bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Modal */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-50 border border-blue-200/60 flex items-center justify-center text-blue-600">
              <User className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800 leading-tight">
                Mi Cuenta y Perfil
              </h3>
              <p className="text-xs text-slate-400">MavlTask Colaborativo</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-4 text-sm">
          
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-2.5 text-rose-700 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
              <p className="leading-relaxed">{error}</p>
            </div>
          )}

          {successMsg && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-2 text-emerald-700 text-xs font-semibold">
              <Check className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          <div className="space-y-4">
            <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl flex items-center gap-3.5">
              {currentUser.photoURL ? (
                <img
                  src={currentUser.photoURL}
                  alt={currentUser.name}
                  className="w-14 h-14 rounded-2xl object-cover border-2 border-white shadow-md ring-2 ring-blue-500/20"
                />
              ) : (
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 to-sky-500 flex items-center justify-center text-xl font-black text-white shadow-md shadow-blue-500/20">
                  {(currentUser.name || "U").substring(0, 2).toUpperCase()}
                </div>
              )}
              
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <h4 className="font-bold text-slate-800 text-sm truncate">{currentUser.name}</h4>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700 border border-emerald-200">
                    {currentUser.provider === "google.com" ? "Google" : "Email"}
                  </span>
                </div>
                <p className="text-xs text-slate-500 truncate">{currentUser.email}</p>
                <p className="text-[10px] text-slate-400 font-mono mt-0.5 truncate">UID: {currentUser.id}</p>
              </div>
            </div>

            <form onSubmit={handleSaveLocal} className="space-y-3 pt-2">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Nombre visible en tareas
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={handleLogout}
                  disabled={loading}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 border border-rose-200 transition-colors cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Cerrar Sesión</span>
                </button>

                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-500/20 transition-all cursor-pointer"
                >
                  Guardar Cambios
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

