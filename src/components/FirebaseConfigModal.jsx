import React, { useState } from "react";
import { X, Database, Check, AlertCircle } from "lucide-react";
import { getStoredFirebaseConfig, saveFirebaseConfig } from "../services/storage";

export default function FirebaseConfigModal({ isOpen, onClose, onConfigSaved }) {
  const currentConfig = getStoredFirebaseConfig();
  const [configText, setConfigText] = useState(
    currentConfig ? JSON.stringify(currentConfig, null, 2) : ""
  );
  const [status, setStatus] = useState(null);

  if (!isOpen) return null;

  const handleSave = () => {
    if (!configText.trim()) {
      saveFirebaseConfig(null);
      setStatus({ type: "success", msg: "Se usará almacenamiento LocalStorage." });
      onConfigSaved();
      setTimeout(onClose, 1000);
      return;
    }

    try {
      let parsed;
      try {
        parsed = JSON.parse(configText);
      } catch {
        const clean = configText
          .replace(/const\s+firebaseConfig\s*=\s*/g, '')
          .replace(/;\s*$/g, '');
        parsed = Function(`"use strict";return (${clean})`)();
      }

      if (!parsed.projectId || !parsed.apiKey) {
        throw new Error("El objeto debe contener al menos 'apiKey' y 'projectId'");
      }

      saveFirebaseConfig(parsed);
      setStatus({ type: "success", msg: "¡Configuración de Firebase guardada con éxito!" });
      onConfigSaved();
      setTimeout(onClose, 1000);
    } catch (err) {
      setStatus({ type: "error", msg: "Error de sintaxis: " + err.message });
    }
  };

  const handleResetToLocal = () => {
    saveFirebaseConfig(null);
    setConfigText("");
    setStatus({ type: "success", msg: "Configuración restablecida a modo local (LocalStorage)." });
    onConfigSaved();
    setTimeout(onClose, 1000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="w-full max-w-xl bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <Database className="w-5 h-5 text-amber-500" />
            <h3 className="text-lg font-bold text-slate-800">
              Conexión con Firebase Firestore
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4 text-sm text-slate-600">
          <p className="text-xs text-slate-500 leading-relaxed">
            Puedes sincronizar tus proyectos y tareas en tiempo real con Firebase Firestore. Si lo dejas en blanco,
            la aplicación funcionará de forma local con <strong>LocalStorage</strong>.
          </p>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
              Pega tu <code className="text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">firebaseConfig</code> aquí:
            </label>
            <textarea
              rows={8}
              placeholder={`{\n  "apiKey": "AIzaSy...",\n  "authDomain": "tu-proyecto.firebaseapp.com",\n  "projectId": "tu-proyecto",\n  "storageBucket": "tu-proyecto.appspot.com",\n  "messagingSenderId": "...",\n  "appId": "..."\n}`}
              value={configText}
              onChange={(e) => setConfigText(e.target.value)}
              className="w-full font-mono text-xs px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
            />
          </div>

          {status && (
            <div className={`p-3 rounded-xl flex items-center gap-2 text-xs ${
              status.type === 'success' 
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                : 'bg-rose-50 text-rose-700 border border-rose-200'
            }`}>
              {status.type === 'success' ? <Check className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
              {status.msg}
            </div>
          )}

          <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
            <button
              type="button"
              onClick={handleResetToLocal}
              className="text-xs text-slate-500 hover:text-rose-600 transition-colors"
            >
              Usar solo LocalStorage
            </button>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-100 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSave}
                className="px-5 py-2 rounded-xl text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 active:scale-98 transition-all shadow-md shadow-blue-500/20"
              >
                Guardar y Conectar
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
