import React, { useMemo, useState } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import { 
  Trophy, Activity, Target, CheckCircle2, ListTodo, 
  AlertTriangle, Users, Bug, Zap, Bookmark, CheckSquare, Clock, Medal,
  Layers, Calendar, Flag, ChevronDown
} from 'lucide-react';
import { PRIORITIES, ISSUE_TYPES } from '../types/constants';

// Función utilitaria para normalizar texto (sin tildes, minúsculas y sin espacios extra)
const normalizeText = (str) => {
  if (!str) return "";
  return String(str)
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ");
};

// Normalizar estado de tarea para soportar 'done', 'completado', etc.
const isDone = (status) => {
  if (!status) return false;
  const s = normalizeText(status);
  return s === "done" || 
         s.includes("complet") || 
         s.includes("terminad") || 
         s.includes("finaliz") || 
         s === "hecho" || 
         s === "resuelto";
};

const isReview = (status) => {
  if (!status) return false;
  const s = normalizeText(status);
  return s === "review" || 
         s === "in_review" || 
         s.includes("revision") || 
         s.includes("qa") || 
         s.includes("prueba");
};

const isInProgress = (status) => {
  if (!status) return false;
  const s = normalizeText(status);
  return s === "in_progress" || 
         s.includes("progres") || 
         s.includes("proceso") || 
         s.includes("desarroll") || 
         s === "doing";
};

export default function ProjectStats({ 
  tasks = [], 
  members = [], 
  currentUser = null,
  sprints = [] 
}) {
  const [selectedSprintId, setSelectedSprintId] = useState("all");

  const filteredTasks = useMemo(() => {
    if (selectedSprintId === "all") return tasks;
    if (selectedSprintId === "backlog") return tasks.filter(t => !t.sprintId);
    return tasks.filter(t => t.sprintId === selectedSprintId);
  }, [tasks, selectedSprintId]);

  const selectedSprintObj = sprints.find(s => s.id === selectedSprintId);
  
  // 1. Unificar lista de miembros canónicos (incluyendo usuario actual si aplica)
  const canonicalMembers = useMemo(() => {
    const list = [...(members || [])];
    if (currentUser && currentUser.name && !list.some(m => m.id === currentUser.id || m.email === currentUser.email)) {
      list.push(currentUser);
    }
    return list;
  }, [members, currentUser]);

  // 2. Resolver a qué miembro canónico pertenece un assignee (por ID, Email, Nombre, username o sin tildes)
  const resolveAssignee = (rawAssignee) => {
    if (!rawAssignee || rawAssignee === "Sin asignar") return null;
    const norm = normalizeText(rawAssignee);
    if (!norm) return null;

    // A. Coincidencia por ID exacta
    let found = canonicalMembers.find(m => m.id && m.id === rawAssignee);
    if (found) return found;

    // B. Coincidencia por Email exacto
    found = canonicalMembers.find(m => m.email && normalizeText(m.email) === norm);
    if (found) return found;

    // C. Coincidencia por Nombre normalizado (ignora tildes, mayúsculas y espacios)
    found = canonicalMembers.find(m => m.name && normalizeText(m.name) === norm);
    if (found) return found;

    // D. Coincidencia por prefijo de Email (ej. "alexmavl" coincide con "alexmavl@gmail.com")
    found = canonicalMembers.find(m => {
      if (!m.email) return false;
      const userPart = normalizeText(m.email.split('@')[0]);
      return userPart === norm;
    });
    if (found) return found;

    // E. Coincidencia parcial si el nombre contiene el término (ej. "Alex" con "Alex Vásquez")
    const partials = canonicalMembers.filter(m => {
      if (!m.name) return false;
      const mNorm = normalizeText(m.name);
      return mNorm.startsWith(norm) || norm.startsWith(mNorm);
    });
    if (partials.length === 1) return partials[0];

    // F. Si no coincide con ninguno registrado, creamos un registro consistente por nombre normalizado
    return {
      id: "ext_" + norm,
      name: String(rawAssignee).trim(),
      email: "",
      photoURL: null
    };
  };

  // 3. Resumen General de Tareas (filtradas por Sprint seleccionado)
  const totalTasks = filteredTasks.length;
  const completedTasks = filteredTasks.filter(t => isDone(t.status)).length;
  const inProgressTasks = filteredTasks.filter(t => isInProgress(t.status)).length;
  const reviewTasks = filteredTasks.filter(t => isReview(t.status)).length;
  const todoTasks = filteredTasks.filter(t => !isDone(t.status) && !isInProgress(t.status) && !isReview(t.status)).length;
  const progressPercent = totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100);

  // Tareas vencidas / en riesgo
  const now = new Date();
  const overdueTasks = filteredTasks.filter(t => {
    if (!t.dueDate || isDone(t.status)) return false;
    const due = new Date(t.dueDate);
    due.setHours(23, 59, 59, 999);
    return due < now;
  });

  // Tareas sin asignar
  const unassignedTasks = filteredTasks.filter(t => !t.assignee || t.assignee === 'Sin asignar');

  // 4. Datos para Gráfico Circular (Donut Chart)
  const pieData = [
    { name: 'Por Hacer', value: todoTasks, color: '#94a3b8' },
    { name: 'En Progreso', value: inProgressTasks, color: '#0ea5e9' },
    { name: 'En Revisión', value: reviewTasks, color: '#6366f1' },
    { name: 'Completado', value: completedTasks, color: '#10b981' }
  ].filter(d => d.value > 0);

  // 5. Métricas Agrupadas y Consolidadas por Usuario Canónico
  const userStatsMap = {};

  // Inicializar con todos los miembros conocidos
  canonicalMembers.forEach(m => {
    if (m.name) {
      const key = m.id || normalizeText(m.name);
      userStatsMap[key] = {
        id: m.id,
        name: m.name,
        photoURL: m.photoURL || null,
        completed: 0,
        pending: 0,
        total: 0
      };
    }
  });

  // Procesar cada tarea y acumular en el usuario canónico
  filteredTasks.forEach(t => {
    const rawAssignee = t.assignee;
    if (!rawAssignee || rawAssignee === 'Sin asignar') return;

    const resolved = resolveAssignee(rawAssignee);
    if (!resolved) return;

    const key = resolved.id || normalizeText(resolved.name);
    if (!userStatsMap[key]) {
      userStatsMap[key] = {
        id: resolved.id,
        name: resolved.name,
        photoURL: resolved.photoURL || null,
        completed: 0,
        pending: 0,
        total: 0
      };
    }

    userStatsMap[key].total++;
    if (isDone(t.status)) {
      userStatsMap[key].completed++;
    } else {
      userStatsMap[key].pending++;
    }
  });

  // Ordenar usuarios: 1° Mayor cantidad de tareas completadas, 2° Mayor tasa de éxito, 3° Menor pendiente
  const userData = Object.values(userStatsMap)
    .filter(u => u.total > 0)
    .sort((a, b) => {
      if (b.completed !== a.completed) {
        return b.completed - a.completed;
      }
      const bRate = b.total > 0 ? (b.completed / b.total) : 0;
      const aRate = a.total > 0 ? (a.completed / a.total) : 0;
      if (bRate !== aRate) {
        return bRate - aRate;
      }
      return b.total - a.total;
    });

  // MVP actual: el primer usuario con al menos 1 tarea completada
  const topPerformer = userData.length > 0 && userData[0].completed > 0 ? userData[0] : null;

  // 6. Distribución por Prioridad
  const priorityCounts = { urgent: 0, high: 0, medium: 0, low: 0 };
  filteredTasks.forEach(t => {
    const p = t.priority || 'medium';
    if (priorityCounts[p] !== undefined) priorityCounts[p]++;
    else priorityCounts.medium++;
  });

  // 7. Distribución por Tipo de Tarea
  const typeCounts = { task: 0, bug: 0, story: 0, improvement: 0 };
  filteredTasks.forEach(t => {
    const tp = t.type || 'task';
    if (typeCounts[tp] !== undefined) typeCounts[tp]++;
    else typeCounts.task++;
  });

  return (
    <div className="space-y-5 animate-in fade-in duration-300 pb-12">
      
      {/* ---------------- SELECTOR Y FILTRO DE SPRINTS PARA MÉTRICAS ---------------- */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-3.5 sm:p-4 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          
          <div className="flex items-center gap-2.5 flex-wrap">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 shrink-0">
              <Layers className="w-4 h-4 text-blue-600" />
              <span>Ver Métricas de:</span>
            </div>

            <div className="relative min-w-[220px] sm:min-w-[270px]">
              <select
                value={selectedSprintId}
                onChange={(e) => setSelectedSprintId(e.target.value)}
                className="w-full appearance-none px-3.5 py-1.5 pr-8 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-300 text-slate-800 text-xs sm:text-sm font-semibold focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer transition-colors shadow-2xs"
              >
                <option value="all">📊 Todo el Proyecto ({tasks.length})</option>
                {sprints.map((s) => {
                  const count = tasks.filter(t => t.sprintId === s.id).length;
                  const statusLabel = 
                    s.status === "active" ? "Activo" : 
                    s.status === "planned" ? "Planificado" : 
                    s.status === "inactive" ? "Inactivo" : "Cerrado";
                  return (
                    <option key={s.id} value={s.id}>
                      {s.name} ({statusLabel}) — {count} {count === 1 ? 'tarea' : 'tareas'}
                    </option>
                  );
                })}
                <option value="backlog">📦 Backlog / Sin Sprint ({tasks.filter(t => !t.sprintId).length})</option>
              </select>
              <ChevronDown className="w-4 h-4 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            {selectedSprintObj && (
              <span className={`px-2.5 py-1 rounded-xl text-xs font-bold flex items-center gap-1.5 border shadow-2xs ${
                selectedSprintObj.status === "active"
                  ? "bg-emerald-50 text-emerald-700 border-emerald-300"
                  : selectedSprintObj.status === "planned"
                  ? "bg-blue-50 text-blue-700 border-blue-300"
                  : selectedSprintObj.status === "inactive"
                  ? "bg-rose-50 text-rose-700 border-rose-300"
                  : "bg-slate-100 text-slate-700 border-slate-300"
              }`}>
                <span className={`w-2 h-2 rounded-full ${
                  selectedSprintObj.status === "active" ? "bg-emerald-500" :
                  selectedSprintObj.status === "planned" ? "bg-blue-500" :
                  selectedSprintObj.status === "inactive" ? "bg-rose-500" : "bg-slate-400"
                }`}></span>
                <span>
                  {selectedSprintObj.status === "active" ? "Sprint Activo" : 
                   selectedSprintObj.status === "planned" ? "Sprint Planificado" : 
                   selectedSprintObj.status === "inactive" ? "Sprint Inactivo" : "Sprint Cerrado"}
                </span>
              </span>
            )}
          </div>

          {selectedSprintObj && (
            <div className="flex items-center gap-2 text-xs font-medium text-slate-500 shrink-0">
              <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                selectedSprintObj.status === "active" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" :
                selectedSprintObj.status === "planned" ? "bg-blue-50 text-blue-700 border border-blue-200" :
                selectedSprintObj.status === "inactive" ? "bg-rose-50 text-rose-700 border border-rose-200" :
                "bg-slate-100 text-slate-600 border border-slate-200"
              }`}>
                {selectedSprintObj.status === "active" ? "Sprint Activo" : 
                 selectedSprintObj.status === "planned" ? "Sprint Planificado" : 
                 selectedSprintObj.status === "inactive" ? "Sprint Inactivo" : "Sprint Cerrado"}
              </span>
            </div>
          )}
        </div>

        {/* Objetivo y Fechas del Sprint */}
        {selectedSprintObj && (
          <div className="mt-2.5 pt-2.5 border-t border-slate-100 flex items-center justify-between gap-3 text-xs text-slate-500 flex-wrap">
            {selectedSprintObj.goal ? (
              <span className="text-slate-600 italic">
                🎯 Objetivo: “{selectedSprintObj.goal}”
              </span>
            ) : <span />}

            {(selectedSprintObj.startDate || selectedSprintObj.endDate) && (
              <div className="flex items-center gap-1.5 font-medium text-slate-500">
                <Calendar className="w-3.5 h-3.5 text-blue-500" />
                <span>{selectedSprintObj.startDate || "Inicio indefinido"} al {selectedSprintObj.endDate || "Fin indefinido"}</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ---------------- FILA 1: TARJETAS DE RESUMEN Y KPIS ---------------- */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5 sm:gap-4">
        
        {/* Progreso Total */}
        <div className="bg-white p-4.5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
            <Target className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Progreso</p>
            <div className="flex items-baseline gap-2">
              <h3 className="text-2xl font-black text-slate-800">{progressPercent}%</h3>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-1.5 mt-1.5 overflow-hidden">
              <div 
                className="bg-blue-600 h-full rounded-full transition-all duration-500" 
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        </div>

        {/* Tareas Completadas */}
        <div className="bg-white p-4.5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Completadas</p>
            <h3 className="text-2xl font-black text-slate-800">
              {completedTasks} <span className="text-xs text-slate-400 font-medium">de {totalTasks}</span>
            </h3>
            <p className="text-[11px] text-emerald-600 font-medium mt-0.5">
              {totalTasks - completedTasks} pendientes
            </p>
          </div>
        </div>

        {/* En Desarrollo (Progreso + Revisión) */}
        <div className="bg-white p-4.5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-sky-50 flex items-center justify-center text-sky-600 shrink-0">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">En Desarrollo</p>
            <h3 className="text-2xl font-black text-slate-800">{inProgressTasks + reviewTasks}</h3>
            <p className="text-[11px] text-slate-400 font-medium mt-0.5">
              {inProgressTasks} en curso • {reviewTasks} revisión
            </p>
          </div>
        </div>

        {/* Tareas Vencidas / En Riesgo */}
        <div className={`p-4.5 rounded-2xl border shadow-sm flex items-center gap-3.5 transition-colors ${
          overdueTasks.length > 0 
            ? "bg-rose-50/50 border-rose-200 text-rose-900" 
            : "bg-white border-slate-200 text-slate-800"
        }`}>
          <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
            overdueTasks.length > 0 ? "bg-rose-100 text-rose-600" : "bg-slate-100 text-slate-400"
          }`}>
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Vencidas</p>
            <h3 className={`text-2xl font-black ${overdueTasks.length > 0 ? "text-rose-600" : "text-slate-800"}`}>
              {overdueTasks.length}
            </h3>
            <p className="text-[11px] text-slate-400 font-medium mt-0.5">
              {overdueTasks.length > 0 ? "Requieren atención urgente" : "Al día con las fechas"}
            </p>
          </div>
        </div>

        {/* Top Performer / MVP */}
        <div className="bg-gradient-to-br from-[#0b192c] to-[#1e3e62] p-4.5 rounded-2xl shadow-sm flex items-center gap-3.5 text-white sm:col-span-2 lg:col-span-1">
          <div className="w-11 h-11 rounded-xl bg-white/10 flex items-center justify-center text-amber-400 overflow-hidden relative shrink-0">
            {topPerformer?.photoURL ? (
              <img src={topPerformer.photoURL} alt="MVP" className="w-full h-full object-cover" />
            ) : (
              <Trophy className="w-5 h-5" />
            )}
            {topPerformer?.photoURL && (
              <div className="absolute -bottom-1 -right-1 bg-amber-400 rounded-full p-0.5 shadow-sm">
                <Trophy className="w-2.5 h-2.5 text-white" />
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-bold text-sky-300 uppercase tracking-wider">MVP Actual</p>
            <h3 className="text-base font-bold truncate">
              {topPerformer ? topPerformer.name : "Sin datos aún"}
            </h3>
            {topPerformer ? (
              <p className="text-[11px] text-slate-300 mt-0.5 font-medium">
                {topPerformer.completed} completadas de {topPerformer.total}
              </p>
            ) : (
              <p className="text-[11px] text-slate-400 mt-0.5">Completa una tarea</p>
            )}
          </div>
        </div>

      </div>

      {/* ---------------- FILA 2: GRÁFICOS PRINCIPALES ---------------- */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Gráfico de Barras: Productividad por Usuario */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <Activity className="w-4 h-4 text-blue-500" />
              Desempeño y Carga por Usuario
            </h3>
            <span className="text-xs text-slate-400 font-medium">
              {userData.length} usuario{userData.length === 1 ? '' : 's'} activos
            </span>
          </div>

          <div className="h-[280px] w-full">
            {userData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={userData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 11, fill: '#64748b' }} 
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    allowDecimals={false}
                    tick={{ fontSize: 11, fill: '#64748b' }} 
                  />
                  <Tooltip 
                    cursor={{ fill: '#f1f5f9' }} 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: '12px' }}
                  />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                  <Bar dataKey="completed" name="Completadas" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={45} />
                  <Bar dataKey="pending" name="Pendientes" fill="#0ea5e9" radius={[4, 4, 0, 0]} maxBarSize={45} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 text-xs">
                <Users className="w-8 h-8 text-slate-300 mb-2" />
                <p>No hay tareas asignadas a miembros aún.</p>
              </div>
            )}
          </div>
        </div>

        {/* Gráfico Circular: Distribución de Estados */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <ListTodo className="w-4 h-4 text-sky-500" />
              Estado Global de Tareas
            </h3>
            <span className="text-xs text-slate-400 font-medium">{totalTasks} en total</span>
          </div>

          <div className="flex-1 min-h-[280px] flex items-center justify-center relative">
            {pieData.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={75}
                      outerRadius={105}
                      paddingAngle={4}
                      dataKey="value"
                      stroke="none"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: '12px' }}
                      itemStyle={{ color: '#1e293b', fontWeight: 'bold' }}
                    />
                    <Legend 
                      iconType="circle" 
                      wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                {/* Texto central del Donut */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none pb-6">
                  <span className="text-3xl font-black text-slate-800 leading-none">{totalTasks}</span>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-1">Totales</span>
                </div>
              </>
            ) : (
              <p className="text-xs text-slate-400 font-medium">No hay tareas creadas en este proyecto.</p>
            )}
          </div>
        </div>
      </div>

      {/* ---------------- FILA 3: TABLA DE LÍDERES Y DESEMPEÑO DEL EQUIPO ---------------- */}
      {userData.length > 0 && (
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <Trophy className="w-4 h-4 text-amber-500" />
              Ranking y Carga de Trabajo del Equipo
            </h3>
            <span className="text-xs text-slate-400 font-medium">
              Ordenado por mayor cantidad de tareas completadas
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider">
                  <th className="pb-3 pl-2">#</th>
                  <th className="pb-3">Miembro</th>
                  <th className="pb-3 text-center">Completadas</th>
                  <th className="pb-3 text-center">Pendientes</th>
                  <th className="pb-3 text-center">Total</th>
                  <th className="pb-3 text-right pr-2">Efectividad</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {userData.map((user, index) => {
                  const rate = user.total > 0 ? Math.round((user.completed / user.total) * 100) : 0;
                  return (
                    <tr key={user.id || index} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 pl-2 font-bold text-slate-400">
                        {index === 0 && user.completed > 0 ? (
                          <span className="text-base" title="Primer Lugar">🥇</span>
                        ) : index === 1 && user.completed > 0 ? (
                          <span className="text-base" title="Segundo Lugar">🥈</span>
                        ) : index === 2 && user.completed > 0 ? (
                          <span className="text-base" title="Tercer Lugar">🥉</span>
                        ) : (
                          <span>{index + 1}</span>
                        )}
                      </td>
                      <td className="py-3 font-semibold text-slate-800">
                        <div className="flex items-center gap-2.5">
                          {user.photoURL ? (
                            <img 
                              src={user.photoURL} 
                              alt={user.name} 
                              className="w-7 h-7 rounded-full object-cover border border-blue-200 shadow-2xs" 
                            />
                          ) : (
                            <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-blue-600 to-sky-500 flex items-center justify-center font-bold text-white text-[11px] shadow-2xs">
                              {(user.name || 'U').substring(0, 2).toUpperCase()}
                            </div>
                          )}
                          <div>
                            <p className="font-bold text-slate-900 leading-tight">{user.name}</p>
                            {index === 0 && user.completed > 0 && (
                              <span className="text-[10px] text-amber-600 font-bold">Líder del sprint</span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-3 text-center">
                        <span className="inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          {user.completed}
                        </span>
                      </td>
                      <td className="py-3 text-center">
                        <span className="inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-sky-50 text-sky-700 border border-sky-200">
                          {user.pending}
                        </span>
                      </td>
                      <td className="py-3 text-center font-bold text-slate-700">
                        {user.total}
                      </td>
                      <td className="py-3 text-right pr-2">
                        <div className="flex items-center justify-end gap-2">
                          <span className="font-bold text-slate-800 w-9 text-right">{rate}%</span>
                          <div className="w-16 bg-slate-100 rounded-full h-2 overflow-hidden">
                            <div 
                              className={`h-full rounded-full transition-all duration-500 ${
                                rate >= 75 ? "bg-emerald-500" : rate >= 40 ? "bg-blue-500" : "bg-amber-500"
                              }`}
                              style={{ width: `${rate}%` }}
                            />
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ---------------- FILA 4: DESGLOSE POR PRIORIDAD Y TIPOS ---------------- */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        
        {/* Desglose por Prioridad */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            Distribución por Prioridad
          </h3>
          <div className="space-y-3">
            {[
              { key: 'urgent', label: 'Urgente', count: priorityCounts.urgent, color: 'bg-rose-500', text: 'text-rose-600', bg: 'bg-rose-50' },
              { key: 'high', label: 'Alta', count: priorityCounts.high, color: 'bg-amber-500', text: 'text-amber-600', bg: 'bg-amber-50' },
              { key: 'medium', label: 'Media', count: priorityCounts.medium, color: 'bg-sky-500', text: 'text-sky-600', bg: 'bg-sky-50' },
              { key: 'low', label: 'Baja', count: priorityCounts.low, color: 'bg-slate-400', text: 'text-slate-500', bg: 'bg-slate-50' }
            ].map(item => {
              const pct = totalTasks === 0 ? 0 : Math.round((item.count / totalTasks) * 100);
              return (
                <div key={item.key} className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="text-slate-700 flex items-center gap-1.5">
                      <span className={`w-2 h-2 rounded-full ${item.color}`} />
                      {item.label}
                    </span>
                    <span className="text-slate-500 font-mono">
                      {item.count} <span className="text-[10px] text-slate-400 font-normal">({pct}%)</span>
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                    <div 
                      className={`h-full rounded-full ${item.color} transition-all duration-500`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Desglose por Tipo de Tarea */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
            <ListTodo className="w-4 h-4 text-blue-600" />
            Distribución por Tipo de Incidencia
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-xl bg-blue-50/60 border border-blue-100 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-100 text-blue-600">
                <CheckSquare className="w-4 h-4" />
              </div>
              <div>
                <p className="text-[11px] font-semibold text-slate-500">Tareas</p>
                <h4 className="text-lg font-bold text-blue-700">{typeCounts.task}</h4>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-rose-50/60 border border-rose-100 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-rose-100 text-rose-600">
                <Bug className="w-4 h-4" />
              </div>
              <div>
                <p className="text-[11px] font-semibold text-slate-500">Bugs / Errores</p>
                <h4 className="text-lg font-bold text-rose-700">{typeCounts.bug}</h4>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-sky-50/60 border border-sky-100 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-sky-100 text-sky-600">
                <Bookmark className="w-4 h-4" />
              </div>
              <div>
                <p className="text-[11px] font-semibold text-slate-500">Historias</p>
                <h4 className="text-lg font-bold text-sky-700">{typeCounts.story}</h4>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-amber-50/60 border border-amber-100 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-100 text-amber-600">
                <Zap className="w-4 h-4" />
              </div>
              <div>
                <p className="text-[11px] font-semibold text-slate-500">Mejoras</p>
                <h4 className="text-lg font-bold text-amber-700">{typeCounts.improvement}</h4>
              </div>
            </div>
          </div>
        </div>

        {/* Resumen de Salud del Proyecto */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm md:col-span-2 lg:col-span-1 flex flex-col justify-between">
          <h3 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
            <Target className="w-4 h-4 text-emerald-600" />
            Salud Operativa del Proyecto
          </h3>

          <div className="space-y-2.5 my-auto">
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-xs">
              <span className="text-slate-600 font-medium flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-blue-500" />
                Por Hacer (Backlog)
              </span>
              <span className="font-bold text-slate-800">{todoTasks}</span>
            </div>

            <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-xs">
              <span className="text-slate-600 font-medium flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-amber-500" />
                Sin Asignar
              </span>
              <span className={`font-bold ${unassignedTasks.length > 0 ? "text-amber-600" : "text-slate-800"}`}>
                {unassignedTasks.length}
              </span>
            </div>

            <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-xs">
              <span className="text-slate-600 font-medium flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
                Urgentes Pendientes
              </span>
              <span className={`font-bold ${priorityCounts.urgent > 0 ? "text-rose-600" : "text-slate-800"}`}>
                {tasks.filter(t => t.priority === 'urgent' && !isDone(t.status)).length}
              </span>
            </div>
          </div>

          <p className="text-[11px] text-slate-400 mt-3 pt-2 border-t border-slate-100 text-center">
            {progressPercent >= 70 ? "🎉 Gran ritmo de avance hacia la meta." : "💡 Mantén el tablero actualizado para sincronizar el sprint."}
          </p>
        </div>

      </div>

    </div>
  );
}
