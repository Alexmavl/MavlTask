import React, { useState, useRef } from "react";
import { X, FileSpreadsheet, Upload, Download, Check, AlertCircle, ArrowRight, Loader2, Sparkles } from "lucide-react";
import * as XLSX from "xlsx";

export default function ExcelImportModal({
  isOpen,
  onClose,
  currentProject,
  currentUser,
  existingTasksCount,
  onImportTasks
}) {
  const [file, setFile] = useState(null);
  const [parsedData, setParsedData] = useState([]);
  const [headers, setHeaders] = useState([]);
  const [mapping, setMapping] = useState({
    title: "",
    description: "",
    status: "",
    priority: "",
    type: "",
    assignee: "",
    dueDate: "",
    referenceUrl: "",
    tags: ""
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [step, setStep] = useState(1); // 1: Upload, 2: Map & Preview, 3: Completed
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  const resetState = () => {
    setFile(null);
    setParsedData([]);
    setHeaders([]);
    setStep(1);
    setError(null);
    setIsProcessing(false);
    setImportProgress(0);
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  const handleFileUpload = (e) => {
    const uploadedFile = e.target.files?.[0];
    if (!uploadedFile) return;
    processFile(uploadedFile);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile) {
      processFile(droppedFile);
    }
  };

  const processFile = (f) => {
    setError(null);
    setFile(f);
    const reader = new FileReader();

    reader.onload = (evt) => {
      try {
        const bstr = evt.target.result;
        const wb = XLSX.read(bstr, { type: "binary", cellDates: true });
        const wsName = wb.SheetNames[0];
        const ws = wb.Sheets[wsName];
        const data = XLSX.utils.sheet_to_json(ws, { header: 1, defval: "" });

        if (!data || data.length < 2) {
          setError("El archivo parece estar vacío o no contiene filas de datos.");
          return;
        }

        const rawHeaders = data[0].map((h) => String(h || "").trim());
        const rawRows = data.slice(1).filter((r) => r.some((cell) => cell !== ""));

        setHeaders(rawHeaders);
        setParsedData(rawRows);

        // Auto-detect mappings based on header name
        const autoMap = {
          title: findHeader(rawHeaders, ["titulo", "title", "tarea", "asunto", "nombre", "task", "resumen", "summary"]),
          description: findHeader(rawHeaders, ["descripcion", "description", "detalle", "detalles", "cuerpo", "body", "notas", "notes"]),
          status: findHeader(rawHeaders, ["estado", "status", "columna", "fase", "state"]),
          priority: findHeader(rawHeaders, ["prioridad", "priority", "urgencia", "importancia"]),
          type: findHeader(rawHeaders, ["tipo", "type", "categoria", "tipo de incidencia", "issue type"]),
          assignee: findHeader(rawHeaders, ["asignado", "assignee", "responsable", "persona", "encargado", "user", "usuario"]),
          dueDate: findHeader(rawHeaders, ["fecha", "fecha limite", "due date", "vencimiento", "fecha entrega", "deadline"]),
          referenceUrl: findHeader(rawHeaders, ["enlace", "link", "url", "referencia", "doc", "documento"]),
          tags: findHeader(rawHeaders, ["tags", "etiquetas", "labels", "modulos", "sprint"])
        };

        setMapping(autoMap);
        setStep(2);
      } catch (err) {
        console.error("Error leyendo Excel:", err);
        setError("Error al procesar el archivo. Asegúrate de que sea un archivo válido (.xlsx, .xls o .csv).");
      }
    };

    reader.readAsBinaryString(f);
  };

  const findHeader = (headersList, keywords) => {
    for (const h of headersList) {
      const lower = h.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      for (const kw of keywords) {
        if (lower.includes(kw)) return h;
      }
    }
    return "";
  };

  const normalizeStatus = (val) => {
    if (!val) return "todo";
    const str = String(val).toLowerCase().trim();
    if (str.includes("progreso") || str.includes("proceso") || str.includes("doing") || str.includes("in progress") || str.includes("desarrollo") || str.includes("curso")) return "in_progress";
    if (str.includes("revision") || str.includes("review") || str.includes("qa") || str.includes("test") || str.includes("pruebas")) return "review";
    if (str.includes("hecho") || str.includes("complet") || str.includes("done") || str.includes("final") || str.includes("terminad") || str.includes("cerrad")) return "done";
    return "todo";
  };

  const normalizePriority = (val) => {
    if (!val) return "medium";
    const str = String(val).toLowerCase().trim();
    if (str.includes("urgent") || str.includes("critica") || str.includes("bloqueante")) return "urgent";
    if (str.includes("alta") || str.includes("high")) return "high";
    if (str.includes("baja") || str.includes("low")) return "low";
    return "medium";
  };

  const normalizeType = (val) => {
    if (!val) return "task";
    const str = String(val).toLowerCase().trim();
    if (str.includes("bug") || str.includes("error") || str.includes("fallo") || str.includes("defecto")) return "bug";
    if (str.includes("historia") || str.includes("story") || str.includes("feature")) return "story";
    if (str.includes("mejora") || str.includes("improvement") || str.includes("optimizacion")) return "improvement";
    return "task";
  };

  const normalizeDate = (val) => {
    if (!val) return "";
    if (val instanceof Date && !isNaN(val.getTime())) {
      return val.toISOString().split("T")[0];
    }
    const str = String(val).trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(str)) return str;
    const parsed = new Date(str);
    if (!isNaN(parsed.getTime())) {
      return parsed.toISOString().split("T")[0];
    }
    return "";
  };

  const handleExecuteImport = async () => {
    if (!mapping.title) {
      setError("Debes seleccionar cuál columna corresponde al 'Título' de la tarea.");
      return;
    }

    setIsProcessing(true);
    setError(null);

    const titleIdx = headers.indexOf(mapping.title);
    const descIdx = mapping.description ? headers.indexOf(mapping.description) : -1;
    const statusIdx = mapping.status ? headers.indexOf(mapping.status) : -1;
    const priorityIdx = mapping.priority ? headers.indexOf(mapping.priority) : -1;
    const typeIdx = mapping.type ? headers.indexOf(mapping.type) : -1;
    const assigneeIdx = mapping.assignee ? headers.indexOf(mapping.assignee) : -1;
    const dueIdx = mapping.dueDate ? headers.indexOf(mapping.dueDate) : -1;
    const refIdx = mapping.referenceUrl ? headers.indexOf(mapping.referenceUrl) : -1;
    const tagsIdx = mapping.tags ? headers.indexOf(mapping.tags) : -1;

    const prefix = currentProject?.key || "MAVL";
    const tasksToInsert = [];

    parsedData.forEach((row, i) => {
      const titleVal = row[titleIdx];
      if (!titleVal || String(titleVal).trim() === "") return;

      const descVal = descIdx !== -1 ? String(row[descIdx] || "") : "";
      const statusVal = statusIdx !== -1 ? normalizeStatus(row[statusIdx]) : "todo";
      const priorityVal = priorityIdx !== -1 ? normalizePriority(row[priorityIdx]) : "medium";
      const typeVal = typeIdx !== -1 ? normalizeType(row[typeIdx]) : "task";
      const assigneeVal = assigneeIdx !== -1 && String(row[assigneeIdx] || "").trim() ? String(row[assigneeIdx]).trim() : "Sin asignar";
      const dueVal = dueIdx !== -1 ? normalizeDate(row[dueIdx]) : "";
      const refVal = refIdx !== -1 ? String(row[refIdx] || "").trim() : "";

      let tagsVal = [];
      if (tagsIdx !== -1 && row[tagsIdx]) {
        tagsVal = String(row[tagsIdx])
          .split(/[,;|]/)
          .map((t) => t.trim())
          .filter(Boolean);
      }

      const generatedId = `${prefix}-${existingTasksCount + i + 1}`;

      tasksToInsert.push({
        id: generatedId,
        projectId: currentProject?.id || "proj_demo",
        title: String(titleVal).trim(),
        description: descVal,
        status: statusVal,
        priority: priorityVal,
        type: typeVal,
        assignee: assigneeVal,
        dueDate: dueVal,
        referenceUrl: refVal,
        tags: tagsVal,
        images: [],
        comments: [],
        createdBy: currentUser?.id || "usr_import",
        createdByName: currentUser?.name || "Importador Excel",
        createdAt: new Date().toISOString()
      });
    });

    if (tasksToInsert.length === 0) {
      setError("No se encontraron filas válidas con título para importar.");
      setIsProcessing(false);
      return;
    }

    try {
      await onImportTasks(tasksToInsert);
      setImportProgress(tasksToInsert.length);
      setStep(3);
    } catch (err) {
      console.error(err);
      setError("Ocurrió un error al guardar las tareas en la base de datos.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownloadTemplate = () => {
    const templateData = [
      {
        "Título": "Crear pantalla de inicio de sesión",
        "Descripción": "Diseñar interfaz accesible con Google 1-Click y Email",
        "Estado": "Por Hacer",
        "Prioridad": "Alta",
        "Tipo": "Historia",
        "Asignado": currentUser?.name || "Carlos Dev",
        "Fecha Límite": "2026-09-25",
        "Enlace Referencia": "https://figma.com",
        "Etiquetas": "Frontend, UI/UX"
      },
      {
        "Título": "Corregir error de carga en lista",
        "Descripción": "Optimizar consultas y validación de respuesta",
        "Estado": "En Progreso",
        "Prioridad": "Urgente",
        "Tipo": "Bug / Error",
        "Asignado": "Ana QA",
        "Fecha Límite": "2026-09-20",
        "Enlace Referencia": "",
        "Etiquetas": "Backend, Bug"
      },
      {
        "Título": "Documentación técnica del proyecto",
        "Descripción": "Redactar manual de uso de endpoints y despliegue",
        "Estado": "Completado",
        "Prioridad": "Media",
        "Tipo": "Tarea",
        "Asignado": "Sin asignar",
        "Fecha Límite": "2026-09-30",
        "Enlace Referencia": "https://notion.so",
        "Etiquetas": "Docs"
      }
    ];

    const ws = XLSX.utils.json_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Tareas");
    XLSX.writeFile(wb, `Plantilla_MavlTask_${currentProject?.key || "MAVL"}.xlsx`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="w-full max-w-2xl bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-200/80 flex items-center justify-center text-emerald-600 shadow-xs">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800 leading-tight">
                Migrar / Importar Tareas desde Excel
              </h3>
              <p className="text-xs text-slate-400">
                Proyecto: <span className="font-semibold text-slate-700">{currentProject?.name}</span> ({currentProject?.key})
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-4 text-sm flex-1">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-2.5 text-rose-700 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
              <p className="leading-relaxed">{error}</p>
            </div>
          )}

          {/* PASO 1: Subir Archivo */}
          {step === 1 && (
            <div className="space-y-4">
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-300 hover:border-emerald-500 bg-slate-50 hover:bg-emerald-50/30 transition-all rounded-3xl p-8 flex flex-col items-center justify-center text-center cursor-pointer group"
              >
                <div className="w-16 h-16 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-emerald-600 group-hover:scale-110 shadow-sm transition-transform mb-3">
                  <Upload className="w-8 h-8" />
                </div>
                <h4 className="font-bold text-slate-800 text-sm mb-1">
                  Arrastra tu archivo Excel o CSV aquí
                </h4>
                <p className="text-xs text-slate-500 max-w-sm">
                  Soporta formatos <span className="font-semibold text-emerald-700">.xlsx</span>, <span className="font-semibold text-emerald-700">.xls</span> y <span className="font-semibold text-emerald-700">.csv</span> de cualquier versión.
                </p>
                <span className="mt-3 px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-700 text-xs font-semibold shadow-2xs group-hover:border-emerald-300">
                  Explorar archivo en tu computadora
                </span>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx, .xls, .csv"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </div>

              {/* Descargar Plantilla */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <Sparkles className="w-5 h-5 text-amber-500 shrink-0" />
                  <div>
                    <p className="text-xs font-bold text-slate-800">¿Quieres ver una plantilla de ejemplo?</p>
                    <p className="text-[11px] text-slate-500">Descarga un archivo con columnas sugeridas para rellenar tus tareas.</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleDownloadTemplate}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-white hover:bg-slate-100 text-emerald-700 border border-emerald-300 shadow-2xs transition-all shrink-0 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Descargar Plantilla</span>
                </button>
              </div>
            </div>
          )}

          {/* PASO 2: Mapeo de Columnas y Vista Previa */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200 px-4 py-2.5 rounded-2xl">
                <div className="flex items-center gap-2">
                  <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                  <span className="text-xs font-bold text-emerald-900 truncate max-w-[200px] sm:max-w-xs">{file?.name}</span>
                </div>
                <span className="text-xs font-bold text-emerald-700 bg-white px-2.5 py-0.5 rounded-full border border-emerald-200">
                  {parsedData.length} filas detectadas
                </span>
              </div>

              <div>
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
                  1. Mapea las columnas de tu Excel a MavlTask:
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Título de la tarea * <span className="text-rose-500 font-normal">(Requerido)</span>
                    </label>
                    <select
                      value={mapping.title}
                      onChange={(e) => setMapping({ ...mapping, title: e.target.value })}
                      className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500"
                    >
                      <option value="">-- Selecciona columna --</option>
                      {headers.map((h) => (
                        <option key={h} value={h}>{h}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Descripción / Detalle
                    </label>
                    <select
                      value={mapping.description}
                      onChange={(e) => setMapping({ ...mapping, description: e.target.value })}
                      className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500"
                    >
                      <option value="">-- Opcional (Sin descripción) --</option>
                      {headers.map((h) => (
                        <option key={h} value={h}>{h}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Estado (Columna)
                    </label>
                    <select
                      value={mapping.status}
                      onChange={(e) => setMapping({ ...mapping, status: e.target.value })}
                      className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500"
                    >
                      <option value="">-- Opcional (Por defecto: Por Hacer) --</option>
                      {headers.map((h) => (
                        <option key={h} value={h}>{h}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Prioridad
                    </label>
                    <select
                      value={mapping.priority}
                      onChange={(e) => setMapping({ ...mapping, priority: e.target.value })}
                      className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500"
                    >
                      <option value="">-- Opcional (Por defecto: Media) --</option>
                      {headers.map((h) => (
                        <option key={h} value={h}>{h}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Tipo de Incidencia
                    </label>
                    <select
                      value={mapping.type}
                      onChange={(e) => setMapping({ ...mapping, type: e.target.value })}
                      className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500"
                    >
                      <option value="">-- Opcional (Por defecto: Tarea) --</option>
                      {headers.map((h) => (
                        <option key={h} value={h}>{h}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Asignado a (Nombre)
                    </label>
                    <select
                      value={mapping.assignee}
                      onChange={(e) => setMapping({ ...mapping, assignee: e.target.value })}
                      className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500"
                    >
                      <option value="">-- Opcional (Sin asignar) --</option>
                      {headers.map((h) => (
                        <option key={h} value={h}>{h}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Fecha Límite
                    </label>
                    <select
                      value={mapping.dueDate}
                      onChange={(e) => setMapping({ ...mapping, dueDate: e.target.value })}
                      className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500"
                    >
                      <option value="">-- Opcional (Sin fecha) --</option>
                      {headers.map((h) => (
                        <option key={h} value={h}>{h}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Enlace / Link Referencia
                    </label>
                    <select
                      value={mapping.referenceUrl}
                      onChange={(e) => setMapping({ ...mapping, referenceUrl: e.target.value })}
                      className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500"
                    >
                      <option value="">-- Opcional (Sin enlace) --</option>
                      {headers.map((h) => (
                        <option key={h} value={h}>{h}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Vista previa primeras 3 filas */}
              <div>
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-1.5">
                  2. Vista previa (Primeras filas):
                </h4>
                <div className="border border-slate-200 rounded-2xl overflow-x-auto max-h-40 bg-white">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                      <tr>
                        <th className="p-2">#</th>
                        <th className="p-2">Título</th>
                        <th className="p-2">Estado</th>
                        <th className="p-2">Prioridad</th>
                        <th className="p-2">Asignado</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-600">
                      {parsedData.slice(0, 4).map((row, idx) => {
                        const titleIdx = headers.indexOf(mapping.title);
                        const statusIdx = headers.indexOf(mapping.status);
                        const prioIdx = headers.indexOf(mapping.priority);
                        const assIdx = headers.indexOf(mapping.assignee);

                        return (
                          <tr key={idx} className="hover:bg-slate-50">
                            <td className="p-2 font-mono text-slate-400">{idx + 1}</td>
                            <td className="p-2 font-semibold text-slate-800 truncate max-w-[200px]">
                              {titleIdx !== -1 ? row[titleIdx] : "—"}
                            </td>
                            <td className="p-2">
                              <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                                {statusIdx !== -1 ? normalizeStatus(row[statusIdx]) : "todo"}
                              </span>
                            </td>
                            <td className="p-2 text-[11px]">
                              {prioIdx !== -1 ? normalizePriority(row[prioIdx]) : "medium"}
                            </td>
                            <td className="p-2 text-[11px]">
                              {assIdx !== -1 ? row[assIdx] || "Sin asignar" : "Sin asignar"}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* PASO 3: Éxito */}
          {step === 3 && (
            <div className="py-8 flex flex-col items-center justify-center text-center space-y-3">
              <div className="w-16 h-16 rounded-full bg-emerald-100 border-4 border-emerald-50 text-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                <Check className="w-8 h-8 stroke-[3]" />
              </div>
              <h4 className="text-lg font-extrabold text-slate-800">
                ¡Migración Completada con Éxito!
              </h4>
              <p className="text-xs text-slate-500 max-w-sm">
                Se han importado <strong className="text-emerald-600 font-bold">{importProgress} tareas</strong> directamente al proyecto <strong className="text-slate-700">{currentProject?.name}</strong>.
              </p>
            </div>
          )}
        </div>

        {/* Footer Buttons */}
        <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between bg-slate-50">
          {step === 1 && (
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-200/60 cursor-pointer"
            >
              Cancelar
            </button>
          )}

          {step === 2 && (
            <>
              <button
                type="button"
                onClick={() => setStep(1)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-200/60 cursor-pointer"
              >
                ← Cambiar archivo
              </button>
              <button
                type="button"
                onClick={handleExecuteImport}
                disabled={isProcessing || !mapping.title}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs text-white bg-emerald-600 hover:bg-emerald-700 shadow-md shadow-emerald-500/20 active:scale-98 transition-all disabled:opacity-50 cursor-pointer"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Importando...</span>
                  </>
                ) : (
                  <>
                    <span>Importar {parsedData.length} Tareas</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </>
          )}

          {step === 3 && (
            <button
              type="button"
              onClick={handleClose}
              className="w-full py-2.5 rounded-xl font-bold text-xs text-white bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-500/20 active:scale-98 transition-all cursor-pointer"
            >
              Ver Tablero con Tareas Importadas
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
