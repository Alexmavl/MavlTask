import React, { useMemo } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import { Trophy, Activity, Target, CheckCircle2, ListTodo, Clock } from 'lucide-react';

export default function ProjectStats({ tasks, members }) {
  // 1. Calcular Resumen General
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.status === 'done').length;
  const inProgressTasks = tasks.filter(t => t.status === 'in_progress').length;
  const reviewTasks = tasks.filter(t => t.status === 'in_review').length;
  const progressPercent = totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100);

  // 2. Datos para Gráfico de Tareas por Estado (PieChart)
  const statusCounts = {
    todo: 0,
    in_progress: 0,
    in_review: 0,
    done: 0
  };
  tasks.forEach(t => { 
    if (statusCounts[t.status] !== undefined) statusCounts[t.status]++; 
  });
  
  const pieData = [
    { name: 'Por Hacer', value: statusCounts.todo, color: '#94a3b8' },
    { name: 'En Progreso', value: statusCounts.in_progress, color: '#3b82f6' },
    { name: 'En Revisión', value: statusCounts.in_review, color: '#f59e0b' },
    { name: 'Completado', value: statusCounts.done, color: '#10b981' }
  ].filter(d => d.value > 0);

  // 3. Desempeño y Carga de Trabajo por Usuario (BarChart y Tabla)
  const userStatsMap = {};
  
  // Inicializar mapa con miembros del proyecto
  (members || []).forEach(m => {
    userStatsMap[m.name] = { name: m.name, completed: 0, pending: 0, photoURL: m.photoURL };
  });

  // Contabilizar las tareas por asignado
  tasks.forEach(t => {
    const assignee = t.assignee;
    if (!assignee || assignee === 'Sin asignar') return;
    
    if (!userStatsMap[assignee]) {
      userStatsMap[assignee] = { name: assignee, completed: 0, pending: 0 };
    }

    if (t.status === 'done') {
      userStatsMap[assignee].completed++;
    } else {
      userStatsMap[assignee].pending++;
    }
  });

  const userData = Object.values(userStatsMap)
    .filter(u => u.completed > 0 || u.pending > 0)
    .sort((a, b) => b.completed - a.completed); // Ordenar por mayor completado

  const topPerformer = userData.length > 0 && userData[0].completed > 0 ? userData[0] : null;

  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-10">
      
      {/* ---------------- FILA 1: TARJETAS DE RESUMEN ---------------- */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Progreso Total */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
            <Target className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Progreso</p>
            <div className="flex items-baseline gap-2">
              <h3 className="text-2xl font-black text-slate-800">{progressPercent}%</h3>
            </div>
          </div>
        </div>

        {/* Tareas Completadas */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Completadas</p>
            <h3 className="text-2xl font-black text-slate-800">{completedTasks} <span className="text-sm text-slate-400 font-medium">de {totalTasks}</span></h3>
          </div>
        </div>

        {/* En Progreso */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-sky-50 flex items-center justify-center text-sky-600">
            <Activity className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">En Desarrollo</p>
            <h3 className="text-2xl font-black text-slate-800">{inProgressTasks + reviewTasks}</h3>
          </div>
        </div>

        {/* Top Performer */}
        <div className="bg-gradient-to-br from-[#0b192c] to-[#1e3e62] p-5 rounded-2xl shadow-sm flex items-center gap-4 text-white">
          <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center text-amber-400 overflow-hidden relative">
            {topPerformer?.photoURL ? (
              <img src={topPerformer.photoURL} alt="MVP" className="w-full h-full object-cover" />
            ) : (
              <Trophy className="w-6 h-6" />
            )}
            {topPerformer?.photoURL && (
              <div className="absolute -bottom-1 -right-1 bg-amber-400 rounded-full p-0.5 shadow-sm">
                <Trophy className="w-3 h-3 text-white" />
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold text-sky-300 uppercase tracking-wider">MVP Actual</p>
            <h3 className="text-lg font-bold truncate">
              {topPerformer ? topPerformer.name : "Sin datos aún"}
            </h3>
            {topPerformer && (
              <p className="text-xs text-slate-300 mt-0.5">{topPerformer.completed} tareas terminadas</p>
            )}
          </div>
        </div>

      </div>

      {/* ---------------- FILA 2: GRÁFICOS ---------------- */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Gráfico de Barras: Productividad por Usuario */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <h3 className="text-sm font-bold text-slate-800 mb-6 flex items-center gap-2">
            <Activity className="w-4 h-4 text-blue-500" />
            Desempeño y Carga por Usuario
          </h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={userData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                <Tooltip 
                  cursor={{ fill: '#f1f5f9' }} 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
                <Bar dataKey="completed" name="Completadas" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={50} />
                <Bar dataKey="pending" name="Pendientes" fill="#3b82f6" radius={[4, 4, 0, 0]} maxBarSize={50} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Gráfico Circular: Distribución de Estados */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col">
          <h3 className="text-sm font-bold text-slate-800 mb-2 flex items-center gap-2">
            <ListTodo className="w-4 h-4 text-sky-500" />
            Estado Global de Tareas
          </h3>
          <div className="flex-1 min-h-[300px] flex items-center justify-center relative">
            {pieData.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={80}
                      outerRadius={110}
                      paddingAngle={5}
                      dataKey="value"
                      stroke="none"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                      itemStyle={{ color: '#1e293b', fontWeight: 'bold' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                {/* Texto central del Donut */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-3xl font-black text-slate-800">{totalTasks}</span>
                  <span className="text-xs font-bold text-slate-400 uppercase">Totales</span>
                </div>
              </>
            ) : (
              <p className="text-sm text-slate-400 font-medium">No hay tareas suficientes para graficar.</p>
            )}
          </div>
        </div>
      </div>

    </div>
  );
}
