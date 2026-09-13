import React from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import { 
  Trophy, Activity, Target, CheckCircle2, ListTodo, 
  AlertTriangle, Users, Bug, Zap, Bookmark, CheckSquare, Clock
} from 'lucide-react';
import { PRIORITIES, ISSUE_TYPES } from '../types/constants';

export default function ProjectStats({ tasks = [], members = [] }) {
  // 1. Resumen General y Normalización de Estados (corrige bug 'review' vs 'in_review')
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.status === 'done').length;
  const inProgressTasks = tasks.filter(t => t.status === 'in_progress').length;
  const reviewTasks = tasks.filter(t => t.status === 'review' || t.status === 'in_review').length;
  const todoTasks = tasks.filter(t => t.status === 'todo' || !t.status).length;
  const progressPercent = totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100);

  // Tareas vencidas / fuera de plazo (DueDate anterior a hoy y no completada)
  const now = new Date();
  const overdueTasks = tasks.filter(t => {
    if (!t.dueDate || t.status === 'done') return false;
    const due = new Date(t.dueDate);
    // Comparar fecha de fin de día
    due.setHours(23, 59, 59, 999);
    return due < now;
  });

  // Tareas sin asignar
  const unassignedTasks = tasks.filter(t => !t.assignee || t.assignee === 'Sin asignar');

  // 2. Datos para Gráfico Circular de Estados (Donut Chart)
  const statusCounts = {
    todo: 0,
    in_progress: 0,
    review: 0,
    done: 0
  };
  tasks.forEach(t => { 
    const s = (t.status === 'in_review') ? 'review' : (t.status || 'todo');
    if (statusCounts[s] !== undefined) {
      statusCounts[s]++; 
    } else {
      statusCounts.todo++;
    }
  });
  
  const pieData = [
    { name: 'Por Hacer', value: statusCounts.todo, color: '#94a3b8' },
    { name: 'En Progreso', value: statusCounts.in_progress, color: '#0ea5e9' },
    { name: 'En Revisión', value: statusCounts.review, color: '#6366f1' },
    { name: 'Completado', value: statusCounts.done, color: '#10b981' }
  ].filter(d => d.value > 0);

  // 3. Desempeño y Carga de Trabajo por Usuario
  const userStatsMap = {};
  
  // Inicializar mapa con miembros del proyecto
  (members || []).forEach(m => {
    if (m.name) {
      userStatsMap[m.name.toLowerCase()] = { 
        name: m.name, 
        completed: 0, 
        pending: 0, 
        total: 0, 
        photoURL: m.photoURL || null 
      };
    }
  });

  // Contabilizar tareas por usuario asignado
  tasks.forEach(t => {
    const assignee = t.assignee;
    if (!assignee || assignee === 'Sin asignar') return;
    
    const key = assignee.toLowerCase();
    if (!userStatsMap[key]) {
      const memberInfo = (members || []).find(m => m.name?.toLowerCase() === key || m.email?.toLowerCase() === key);
      userStatsMap[key] = { 
        name: assignee, 
        completed: 0, 
        pending: 0, 
        total: 0, 
        photoURL: memberInfo?.photoURL || null 
      };
    }

    userStatsMap[key].total++;
    if (t.status === 'done') {
      userStatsMap[key].completed++;
    } else {
      userStatsMap[key].pending++;
    }
  });

  const userData = Object.values(userStatsMap)
    .filter(u => u.total > 0)
    .sort((a, b) => b.completed - a.completed || b.total - a.total);

  const topPerformer = userData.length > 0 && userData[0].completed > 0 ? userData[0] : null;

  // 4. Distribución por Prioridad
  const priorityCounts = { urgent: 0, high: 0, medium: 0, low: 0 };
  tasks.forEach(t => {
    const p = t.priority || 'medium';
    if (priorityCounts[p] !== undefined) priorityCounts[p]++;
    else priorityCounts.medium++;
  });

  // 5. Distribución por Tipo de Tarea
  const typeCounts = { task: 0, bug: 0, story: 0, improvement: 0 };
  tasks.forEach(t => {
    const tp = t.type || 'task';
    if (typeCounts[tp] !== undefined) typeCounts[tp]++;
    else typeCounts.task++;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-12">
      
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
              <p className="text-[11px] text-slate-300 mt-0.5">{topPerformer.completed} terminadas</p>
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

      {/* ---------------- FILA 3: DESGLOSE POR PRIORIDAD Y TIPOS ---------------- */}
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
                {tasks.filter(t => t.priority === 'urgent' && t.status !== 'done').length}
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
