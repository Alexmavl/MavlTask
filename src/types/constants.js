export const DEFAULT_COLUMNS = [
  { id: 'todo', title: 'Por Hacer', color: 'border-blue-300 bg-blue-50 text-blue-700' },
  { id: 'in_progress', title: 'En Progreso', color: 'border-sky-300 bg-sky-50 text-sky-700' },
  { id: 'review', title: 'En Revisión', color: 'border-indigo-300 bg-indigo-50 text-indigo-700' },
  { id: 'done', title: 'Completado', color: 'border-emerald-300 bg-emerald-50 text-emerald-700' }
];

export const PRIORITIES = {
  urgent: { label: 'Urgente', color: 'bg-rose-50 text-rose-700 border-rose-200', dot: 'bg-rose-500' },
  high: { label: 'Alta', color: 'bg-amber-50 text-amber-700 border-amber-200', dot: 'bg-amber-500' },
  medium: { label: 'Media', color: 'bg-sky-50 text-sky-700 border-sky-200', dot: 'bg-sky-500' },
  low: { label: 'Baja', color: 'bg-blue-50 text-blue-700 border-blue-200', dot: 'bg-blue-500' }
};

export const ISSUE_TYPES = {
  task: { label: 'Tarea', icon: 'CheckSquare', color: 'text-blue-600' },
  bug: { label: 'Bug / Error', icon: 'Bug', color: 'text-rose-600' },
  story: { label: 'Historia', icon: 'Bookmark', color: 'text-sky-600' },
  improvement: { label: 'Mejora', icon: 'Zap', color: 'text-amber-600' }
};

export const getInitialTasks = (userName = 'Sin asignar') => [
  {
    id: 'MAVL-1',
    title: 'Configurar despliegue automático en Vercel',
    description: 'Vincular el repositorio de GitHub con el proyecto en Vercel para CI/CD automático.',
    status: 'done',
    priority: 'high',
    type: 'task',
    tags: ['DevOps', 'Vercel'],
    assignee: userName,
    dueDate: '2026-09-15',
    createdAt: new Date().toISOString()
  },
  {
    id: 'MAVL-2',
    title: 'Conectar base de datos Firebase / Firestore',
    description: 'Ingresar las credenciales en la configuración para sincronización en la nube o usar almacenamiento local.',
    status: 'in_progress',
    priority: 'medium',
    type: 'story',
    tags: ['Backend', 'Firebase'],
    assignee: userName,
    dueDate: '2026-09-18',
    createdAt: new Date().toISOString()
  },
  {
    id: 'MAVL-3',
    title: 'Diseñar interfaz Kanban MavlTask con tonos Azul Marino',
    description: 'Tablero nítido, fondos claros suaves (#f0f4f9) y navbar azul marino (#0b192c).',
    status: 'in_progress',
    priority: 'urgent',
    type: 'improvement',
    tags: ['UI/UX', 'Frontend'],
    assignee: userName,
    dueDate: '2026-09-12',
    createdAt: new Date().toISOString()
  },
  {
    id: 'MAVL-4',
    title: 'Añadir filtros avanzados por prioridad y búsqueda',
    description: 'Permitir filtrar por etiquetas, tipo de incidencia, prioridad y texto de búsqueda en vivo.',
    status: 'todo',
    priority: 'low',
    type: 'task',
    tags: ['Frontend'],
    assignee: userName,
    dueDate: '2026-09-20',
    createdAt: new Date().toISOString()
  }
];
