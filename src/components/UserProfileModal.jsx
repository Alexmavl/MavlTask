import React, { useState } from "react";
import { X, User, LogIn, LogOut, Mail, Lock, Check, AlertCircle, Sparkles } from "lucide-react";
import { 
  saveUserProfile, 
  loginWithGoogle, 
  loginWithEmail, 
  registerWithEmail, 
  logoutUser 
} from "../services/storage";

export default function UserProfileModal({ 
  isOpen, 
  onClose, 
  currentUser, 
  onProfileUpdated,
  isFirebaseConnected,
  onOpenDbModal
}) {
  const [authTab, setAuthTab] = useState("profile"); // 'profile' | 'email_login' | 'email_register'
  const [name, setName] = useState(currentUser.name || "");
  const [email, setEmail] = useState(currentUser.email || "");
  const [password, setPassword] = useState("");
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

  const handleGoogleLogin = async () => {
    setError(null);
    setLoading(true);
    try {
      const user = await loginWithGoogle();
      onProfileUpdated(user);
      setSuccessMsg(`¡Bienvenido, ${user.name}!`);
      setTimeout(() => {
        setSuccessMsg(null);
        onClose();
      }, 800);
    } catch (err) {
      console.error(err);
      if (err.code === "auth/popup-closed-by-user") {
        setError("Ventana de autenticación cerrada.");
      } else if (err.code === "auth/unauthorized-domain") {
        setError("Dominio no autorizado en Firebase Console (Authentication > Settings > Authorized domains).");
      } else {
        setError(err.message || "Error al iniciar sesión con Google.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleEmailAuth = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (authTab === "email_register") {
        if (!name.trim()) {
          setError("Ingresa tu nombre completo.");
          setLoading(false);
          return;
        }
        if (password.length < 6) {
          setError("La contraseña debe tener al menos 6 caracteres.");
          setLoading(false);
          return;
        }
        const user = await registerWithEmail(email.trim(), password, name.trim());
        onProfileUpdated(user);
        setSuccessMsg("¡Cuenta creada exitosamente!");
      } else {
        const user = await loginWithEmail(email.trim(), password);
        onProfileUpdated(user);
        setSuccessMsg("¡Sesión iniciada con éxito!");
      }

      setTimeout(() => {
        setSuccessMsg(null);
        setPassword("");
        onClose();
      }, 800);
    } catch (err) {
      console.error(err);
      if (err.code === "auth/user-not-found" || err.code === "auth/wrong-password" || err.code === "auth/invalid-credential") {
        setError("Correo o contraseña incorrectos.");
      } else if (err.code === "auth/email-already-in-use") {
        setError("Ya existe una cuenta con este correo.");
      } else if (err.code === "auth/weak-password") {
        setError("Contraseña demasiado débil (mínimo 6 caracteres).");
      } else {
        setError(err.message || "Error al procesar la solicitud.");
      }
    } finally {
      setLoading(false);
    }
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
                {isLoggedIn ? "Mi Cuenta y Perfil" : "Autenticación y Perfil"}
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
          
          {/* Mensajes de Alerta / Éxito */}
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

          {/* Banner si Firebase NO está conectado */}
          {!isFirebaseConnected && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-2.5 text-amber-800 text-xs">
              <Sparkles className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
              <div className="space-y-1">
                <p className="font-semibold">Modo Local Activo</p>
                <p className="text-[11px] text-amber-700 leading-normal">
                  Puedes personalizar tu nombre local aquí. Para activar Google 1-Click o usuarios en la nube, conecta Firebase.
                </p>
                {onOpenDbModal && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenDbModal();
                    }}
                    className="inline-block mt-1 font-bold text-blue-600 hover:underline cursor-pointer"
                  >
                    ⚙️ Configurar Firebase ahora →
                  </button>
                )}
              </div>
            </div>
          )}

          {/* CASO 1: Usuario con Sesión Activa (Firebase Auth) */}
          {isLoggedIn ? (
            <div className="space-y-4">
              {/* Tarjeta de Perfil Logueado */}
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

              {/* Formulario para editar nombre en pantalla */}
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
          ) : (
            /* CASO 2: Usuario Anónimo / Invitado - Opciones de Inicio de Sesión */
            <div className="space-y-4">
              
              {/* Botón de Google 1-Click (Solo si Firebase está conectado) */}
              {isFirebaseConnected && (
                <div className="space-y-3">
                  <button
                    type="button"
                    onClick={handleGoogleLogin}
                    disabled={loading}
                    className="w-full py-2.5 px-4 rounded-2xl bg-white hover:bg-slate-50 border-2 border-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center gap-3 shadow-xs hover:shadow-md transition-all active:scale-98 disabled:opacity-50 cursor-pointer"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24">
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
                    <span>Continuar con Google</span>
                  </button>

                  <div className="relative flex items-center justify-center">
                    <div className="border-t border-slate-200 w-full"></div>
                    <span className="bg-white px-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider shrink-0">
                      o con correo
                    </span>
                  </div>

                  {/* Pestañas Login vs Registro */}
                  <div className="flex rounded-xl bg-slate-100 p-1">
                    <button
                      type="button"
                      onClick={() => setAuthTab("email_login")}
                      className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                        authTab === "email_login"
                          ? "bg-white text-blue-600 shadow-xs"
                          : "text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      Iniciar Sesión
                    </button>
                    <button
                      type="button"
                      onClick={() => setAuthTab("email_register")}
                      className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                        authTab === "email_register"
                          ? "bg-white text-blue-600 shadow-xs"
                          : "text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      Crear Cuenta
                    </button>
                  </div>

                  {/* Formulario Email / Password */}
                  {(authTab === "email_login" || authTab === "email_register") && (
                    <form onSubmit={handleEmailAuth} className="space-y-3 pt-1">
                      {authTab === "email_register" && (
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-700 uppercase tracking-wider mb-1">
                            Tu Nombre Completo *
                          </label>
                          <div className="relative">
                            <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                            <input
                              type="text"
                              required
                              placeholder="Ej. María Gómez"
                              value={name}
                              onChange={(e) => setName(e.target.value)}
                              className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                        </div>
                      )}

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 uppercase tracking-wider mb-1">
                          Correo Electrónico *
                        </label>
                        <div className="relative">
                          <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                          <input
                            type="email"
                            required
                            placeholder="tu@correo.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 uppercase tracking-wider mb-1">
                          Contraseña *
                        </label>
                        <div className="relative">
                          <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                          <input
                            type="password"
                            required
                            placeholder="Mínimo 6 caracteres"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-2.5 rounded-xl font-bold text-xs text-white bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-500/20 active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <LogIn className="w-4 h-4" />
                        <span>{authTab === "email_register" ? "Registrarse" : "Entrar a MavlTask"}</span>
                      </button>
                    </form>
                  )}
                </div>
              )}

              {/* Opción de Modo Invitado / Local */}
              <div className="pt-2 border-t border-slate-100">
                <h5 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                  O usar como Invitado Local
                </h5>
                <form onSubmit={handleSaveLocal} className="space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-medium text-slate-600 mb-1">
                        Nombre / Alias
                      </label>
                      <input
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Ej. Invitado"
                        className="w-full px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-slate-600 mb-1">
                        Email (Opcional)
                      </label>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="alias@correo.com"
                        className="w-full px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={onClose}
                      className="px-3 py-1.5 rounded-xl text-xs font-medium text-slate-600 hover:bg-slate-100 cursor-pointer"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-1.5 rounded-xl text-xs font-bold text-slate-800 bg-slate-100 hover:bg-slate-200 border border-slate-300 active:scale-98 transition-all cursor-pointer"
                    >
                      Guardar como Invitado
                    </button>
                  </div>
                </form>
              </div>

            </div>
          )}

        </div>
      </div>
    </div>
  );
}

