import React, { useState } from "react";
import { FolderKanban, AlertCircle } from "lucide-react";
import { loginWithGoogle, saveUserProfile } from "../services/storage";

export default function LoginScreen({ onLoginSuccess }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleGoogleLogin = async () => {
    setError(null);
    setLoading(true);
    try {
      const user = await loginWithGoogle();
      onLoginSuccess(user);
    } catch (err) {
      console.error(err);
      if (err.code === "auth/popup-closed-by-user") {
        setError("Ventana de autenticación cerrada.");
      } else {
        setError(err.message || "Error al iniciar sesión con Google.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0b192c] flex items-center justify-center p-4 selection:bg-blue-600 selection:text-white">
      <div className="w-full max-w-md bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden flex flex-col p-8 sm:p-10 text-center animate-in fade-in zoom-in-95 duration-300">
        
        {/* Logo */}
        <div className="mx-auto w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-gradient-to-br from-blue-500 via-sky-400 to-cyan-400 p-1 shadow-lg shadow-blue-500/30 mb-6">
          <div className="w-full h-full bg-[#0b192c] rounded-[20px] flex items-center justify-center">
            <FolderKanban className="w-10 h-10 sm:w-12 sm:h-12 text-sky-400" />
          </div>
        </div>

        {/* Título */}
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-800 mb-2">
          Mavl<span className="text-sky-500">Task</span>
        </h1>
        <p className="text-sm sm:text-base text-slate-500 mb-8 font-medium">
          Sistema colaborativo de tareas e incidencias
        </p>

        {/* Mensaje de Error */}
        {error && (
          <div className="p-3 mb-6 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2.5 text-rose-700 text-xs text-left animate-in fade-in">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
            <p className="leading-relaxed font-semibold">{error}</p>
          </div>
        )}

        {/* Botón de Login */}
        <button
          type="button"
          onClick={handleGoogleLogin}
          disabled={loading}
          className="w-full py-3.5 px-4 mb-3 rounded-2xl bg-white hover:bg-slate-50 border-2 border-slate-200 text-slate-700 font-bold text-sm flex items-center justify-center gap-3 shadow-sm hover:shadow-md transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <div className="w-5 h-5 border-2 border-slate-400 border-t-transparent rounded-full animate-spin"></div>
          ) : (
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
          )}
          <span>{loading ? "Conectando..." : "Entrar con Google"}</span>
        </button>

        {/* Botón Invitado / Local */}
        <button
          type="button"
          onClick={() => {
            const guestUser = {
              id: 'usr_' + Math.random().toString(36).substring(2, 9),
              name: 'Invitado',
              email: '',
              photoURL: '',
              isAnonymous: false,
              provider: 'local'
            };
            saveUserProfile(guestUser);
            onLoginSuccess(guestUser);
          }}
          disabled={loading}
          className="w-full py-3 px-4 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-sm flex items-center justify-center transition-all active:scale-95 disabled:opacity-50"
        >
          Usar Modo Local (Invitado)
        </button>

        <p className="mt-8 text-xs text-slate-400 font-medium">
          Debes iniciar sesión para acceder a los proyectos y tareas asignadas.
        </p>
      </div>
    </div>
  );
}
