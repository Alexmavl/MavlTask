import React, { useState, useEffect } from "react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { 
  Plus, 
  Search, 
  Database, 
  X, 
  Share2, 
  FolderKanban, 
  User, 
  ChevronDown,
  Menu,
  Users,
  FileSpreadsheet,
  BarChart3,
  Download
} from "lucide-react";
import TaskCard from "./components/TaskCard";
import TaskModal from "./components/TaskModal";

import ProjectModal from "./components/ProjectModal";
import ShareProjectModal from "./components/ShareProjectModal";
import UserProfileModal from "./components/UserProfileModal";
import MobileDrawerMenu from "./components/MobileDrawerMenu";
import ExcelImportModal from "./components/ExcelImportModal";
import ProjectStats from "./components/ProjectStats";
import UserSelect from "./components/UserSelect";
import * as XLSX from "xlsx";

import { DEFAULT_COLUMNS, PRIORITIES, ISSUE_TYPES, getInitialTasks } from "./types/constants";
import { 
  getLocalTasksByProject, 
  saveLocalTasksByProject,
  getLocalProjects,
  saveLocalProjects,
  getUserProfile,
  initFirebase,
  subscribeToAuth
} from "./services/storage";
import { 
  collection, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  arrayUnion, 
  query, 
  where 
} from "firebase/firestore";

import LoginScreen from "./components/LoginScreen";

export default function App() {
  const [currentUser, setCurrentUser] = useState(getUserProfile());
  const [projects, setProjects] = useState([]);
  const [currentProject, setCurrentProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [isFirebaseConnected, setIsFirebaseConnected] = useState(false);

  // Estados de Filtros y Búsqueda
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPriority, setSelectedPriority] = useState("all");
  const [selectedType, setSelectedType] = useState("all");
  const [selectedAssignee, setSelectedAssignee] = useState("all");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [viewMode, setViewMode] = useState("kanban"); // "kanban" o "stats"
  
  // Modales
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState(null);

  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  const getUrlProjectId = () => {
    const params = new URLSearchParams(window.location.search);
    return params.get("project");
  };

  const initializeWorkspace = () => {
    const db = initFirebase();
    const targetUrlProjId = getUrlProjectId();

    if (db) {
      setIsFirebaseConnected(true);
      
      const unsubProjects = onSnapshot(collection(db, "projects"), (snapshot) => {
        const remoteProjects = snapshot.docs.map(d => ({
          id: d.id,
          ...d.data()
        }));

        if (remoteProjects.length > 0) {
          let myProjects = remoteProjects.filter(p => 
            p.members?.some(m => m.id === currentUser.id || m.email === currentUser.email) ||
            p.ownerId === currentUser.id
          );

          let sharedProject = null;
          if (targetUrlProjId) {
            sharedProject = remoteProjects.find(p => p.id === targetUrlProjId);
            if (sharedProject) {
                const isMember = sharedProject.members?.some(m => m.id === currentUser.id || m.email === currentUser.email);
              if (!isMember) {
                const projDoc = doc(db, "projects", sharedProject.id);
                updateDoc(projDoc, {
                  members: arrayUnion({
                    id: currentUser.id,
                    name: currentUser.name,
                    email: currentUser.email || "",
                    photoURL: currentUser.photoURL || null
                  })
                }).catch(console.error);
                
                // Agregarlo localmente de inmediato para que renderice
                myProjects.push(sharedProject);
              } else {
                // If member exists but missing photoURL, update it (optional self-healing)
                const existingMember = sharedProject.members.find(m => m.id === currentUser.id);
                if (existingMember && !existingMember.photoURL && currentUser.photoURL) {
                  const updatedMembers = sharedProject.members.map(m => 
                    m.id === currentUser.id ? { ...m, photoURL: currentUser.photoURL } : m
                  );
                  updateDoc(doc(db, "projects", sharedProject.id), { members: updatedMembers }).catch(console.error);
                }
              }
            }
          }

          // Also self-heal myProjects
          myProjects.forEach(proj => {
            const existingMember = proj.members?.find(m => m.id === currentUser.id);
            if (existingMember && !existingMember.photoURL && currentUser.photoURL) {
              const updatedMembers = proj.members.map(m => 
                m.id === currentUser.id ? { ...m, photoURL: currentUser.photoURL } : m
              );
              updateDoc(doc(db, "projects", proj.id), { members: updatedMembers }).catch(console.error);
              proj.members = updatedMembers; // mutate local copy for immediate render
            }
          });

          if (myProjects.length === 0) {
            const defaultP = {
              name: `Proyecto Principal ${currentUser.name}`,
              description: "Tablero colaborativo de tareas y sprints",
              key: "MAVL",
              ownerId: currentUser.id,
              members: [{ id: currentUser.id, name: currentUser.name, email: currentUser.email || "", photoURL: currentUser.photoURL || null }],
              createdAt: new Date().toISOString()
            };
            addDoc(collection(db, "projects"), defaultP);
            return;
          }

          setProjects(myProjects);
          
          const selected = sharedProject 
            ? sharedProject 
            : (currentProject ? myProjects.find(p => p.id === currentProject.id) || myProjects[0] : myProjects[0]);
          
          setCurrentProject(selected);
        } else {
          const defaultP = {
            name: `Proyecto Principal ${currentUser.name}`,
            description: "Tablero colaborativo de tareas y sprints",
            key: "MAVL",
            ownerId: currentUser.id,
            members: [{ id: currentUser.id, name: currentUser.name, email: currentUser.email || "", photoURL: currentUser.photoURL || null }],
            createdAt: new Date().toISOString()
          };
          addDoc(collection(db, "projects"), defaultP);
        }
      });

      return () => unsubProjects();
    } else {
      setIsFirebaseConnected(false);
      let localProjs = getLocalProjects();
      setProjects(localProjs);
      
      const selected = targetUrlProjId 
        ? localProjs.find(p => p.id === targetUrlProjId) || localProjs[0]
        : (currentProject ? localProjs.find(p => p.id === currentProject.id) || localProjs[0] : localProjs[0]);
      
      setCurrentProject(selected);
    }
  };

  useEffect(() => {
    const unsubAuth = subscribeToAuth((authProfile) => {
      if (authProfile) {
        setCurrentUser(authProfile);
      }
    });
    return () => unsubAuth && unsubAuth();
  }, []);

  useEffect(() => {
    const cleanup = initializeWorkspace();
    return () => cleanup && cleanup();
  }, [currentUser]);

  useEffect(() => {
    if (!currentProject) return;

    const db = initFirebase();
    if (db && isFirebaseConnected) {
      const q = query(
        collection(db, "tasks"),
        where("projectId", "==", currentProject.id)
      );

      const unsubTasks = onSnapshot(q, (snapshot) => {
        const remoteTasks = snapshot.docs.map(d => {
          const data = d.data();
          return {
            ...data,
            firestoreId: d.id,
            taskCode: data.taskCode || data.code || data.id || d.id,
            id: d.id
          };
        });
        setTasks(remoteTasks);
        setTaskToEdit(prev => {
          if (!prev || !prev.id) return prev;
          const match = remoteTasks.find(t => t.id === prev.id || t.firestoreId === prev.id || (prev.firestoreId && t.firestoreId === prev.firestoreId));
          return match || prev;
        });
      });

      return () => unsubTasks();
    } else {
      const local = getLocalTasksByProject(currentProject.id);
      if (local.length === 0 && currentProject.id === "proj_demo") {
        const initialWithUser = getInitialTasks(currentUser.name).map(t => ({ 
          ...t, 
          projectId: currentProject.id,
          createdBy: currentUser.id,
          createdByName: currentUser.name
        }));
        setTasks(initialWithUser);
        saveLocalTasksByProject(currentProject.id, initialWithUser);
      } else {
        setTasks(local);
      }
    }
  }, [currentProject, isFirebaseConnected]);

  const updateTasksState = (newTasks) => {
    setTasks(newTasks);
    if (!isFirebaseConnected && currentProject) {
      saveLocalTasksByProject(currentProject.id, newTasks);
    }
  };

  const handleCreateProject = async (projData) => {
    const newProj = {
      ...projData,
      ownerId: currentUser.id,
      members: [{ id: currentUser.id, name: currentUser.name, email: currentUser.email || "", photoURL: currentUser.photoURL || null }],
      createdAt: new Date().toISOString()
    };

    if (isFirebaseConnected) {
      const db = initFirebase();
      if (db) {
        const docRef = await addDoc(collection(db, "projects"), newProj);
        setCurrentProject({ id: docRef.id, ...newProj });
      }
    } else {
      const id = "proj_" + Date.now().toString().slice(-4);
      const fullProj = { id, ...newProj };
      const updated = [...projects, fullProj];
      setProjects(updated);
      saveLocalProjects(updated);
      setCurrentProject(fullProj);
    }
  };

  const handleAddMember = async (newMember) => {
    if (!currentProject) return;

    const existingMemberIndex = (currentProject.members || []).findIndex(m => m.id === newMember.id);
    let updatedMembers = [...(currentProject.members || [])];
    
    if (existingMemberIndex >= 0) {
      // Si ya existe, actualizamos sus datos para no duplicarlo (ej. al actualizar la foto)
      updatedMembers[existingMemberIndex] = { ...updatedMembers[existingMemberIndex], ...newMember };
    } else {
      updatedMembers.push(newMember);
    }

    if (isFirebaseConnected) {
      const db = initFirebase();
      if (db) {
        const projDoc = doc(db, "projects", currentProject.id);
        await updateDoc(projDoc, {
          members: updatedMembers
        });
      }
    } else {
      const updatedProj = { ...currentProject, members: updatedMembers };
      const updatedProjects = projects.map(p => p.id === currentProject.id ? updatedProj : p);
      setProjects(updatedProjects);
      setCurrentProject(updatedProj);
      saveLocalProjects(updatedProjects);
    }
  };

  const handleRemoveMember = async (memberId) => {
    if (!currentProject) return;

    if (isFirebaseConnected) {
      const db = initFirebase();
      if (db) {
        const projDoc = doc(db, "projects", currentProject.id);
        const updatedMembers = currentProject.members.filter(m => m.id !== memberId);
        await updateDoc(projDoc, {
          members: updatedMembers
        });
      }
    } else {
      const updatedMembers = currentProject.members.filter(m => m.id !== memberId);
      const updatedProj = { ...currentProject, members: updatedMembers };
      const updatedProjects = projects.map(p => p.id === currentProject.id ? updatedProj : p);
      setProjects(updatedProjects);
      setCurrentProject(updatedProj);
      saveLocalProjects(updatedProjects);
    }
  };

  const onDragEnd = async (result) => {
    const { destination, source, draggableId } = result;

    if (!destination) return;
    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    const taskIndex = tasks.findIndex(t => t.id === draggableId);
    if (taskIndex === -1) return;

    const targetStatus = destination.droppableId;
    const updatedTask = { ...tasks[taskIndex], status: targetStatus };

    const newTasks = [...tasks];
    newTasks.splice(taskIndex, 1);
    
    const columnTasks = newTasks.filter(t => t.status === targetStatus);
    const insertBeforeTask = columnTasks[destination.index];
    
    let insertGlobalIndex = newTasks.length;
    if (insertBeforeTask) {
      insertGlobalIndex = newTasks.findIndex(t => t.id === insertBeforeTask.id);
    }
    
    newTasks.splice(insertGlobalIndex, 0, updatedTask);
    updateTasksState(newTasks);

    if (isFirebaseConnected) {
      const db = initFirebase();
      if (db) {
        try {
          const taskDoc = doc(db, "tasks", draggableId);
          await updateDoc(taskDoc, { status: targetStatus });
        } catch (e) {
          console.error("Error actualizando status en Firebase:", e);
        }
      }
    }
  };

  const handleSaveTask = async (taskData) => {
    if (!currentProject) return;

    if (taskData.id) {
      // Sincronizar inmediatamente taskToEdit para evitar sobrescrituras si el modal sigue abierto
      setTaskToEdit(prev => {
        if (prev && (prev.id === taskData.id || prev.firestoreId === taskData.id || (taskData.firestoreId && prev.firestoreId === taskData.firestoreId))) {
          return { ...prev, ...taskData };
        }
        return prev;
      });

      if (isFirebaseConnected) {
        const db = initFirebase();
        if (db) {
          try {
            const docId = taskData.firestoreId || taskData.id;
            const taskDoc = doc(db, "tasks", docId);
            const { id, firestoreId, ...cleanData } = taskData;
            
            // Sanitizar para que Firestore no rechace valores undefined en comentarios u otros campos
            const sanitizedData = JSON.parse(JSON.stringify(cleanData, (k, v) => v === undefined ? null : v));
            await updateDoc(taskDoc, sanitizedData);
          } catch (err) {
            console.error("Error actualizando tarea en Firebase:", err);
            alert("No se pudo guardar la tarea en Firebase: " + (err.message || "Error"));
          }
        }
      } else {
        const updated = tasks.map(t => t.id === taskData.id ? taskData : t);
        updateTasksState(updated);
      }
    } else {
      const prefix = currentProject.key || "MAVL";
      const newCode = `${prefix}-${tasks.length + 1}`;
      const newTask = {
        ...taskData,
        taskCode: newCode,
        id: newCode,
        projectId: currentProject.id,
        createdBy: currentUser.id || null,
        createdByName: currentUser.name || "Usuario",
        createdAt: new Date().toISOString()
      };

      if (isFirebaseConnected) {
        const db = initFirebase();
        if (db) {
          try {
            const { id, firestoreId, ...cleanData } = newTask;
            const sanitizedData = JSON.parse(JSON.stringify(cleanData, (k, v) => v === undefined ? null : v));
            await addDoc(collection(db, "tasks"), sanitizedData);
          } catch (err) {
            console.error("Error al crear tarea en Firebase:", err);
            alert("No se pudo crear la tarea en Firebase: " + (err.message || "Error"));
          }
        }
      } else {
        const updated = [newTask, ...tasks];
        updateTasksState(updated);
      }
    }
  };

  const handleDeleteTask = async (taskId) => {
    const taskToDelete = tasks.find(t => t.id === taskId);
    const isCreator = !taskToDelete?.createdBy || taskToDelete?.createdBy === currentUser?.id || taskToDelete?.createdBy === currentUser?.name;

    if (!isCreator) {
      alert("Solo el creador de la tarea puede eliminarla.");
      return;
    }

    if (!window.confirm("¿Seguro que deseas eliminar esta tarea?")) return;

    if (isFirebaseConnected) {
      const db = initFirebase();
      if (db) {
        try {
          const docId = taskToDelete?.firestoreId || taskId;
          await deleteDoc(doc(db, "tasks", docId));
        } catch (e) {
          console.error("Error eliminando tarea en Firebase:", e);
        }
      }
    } else {
      const updated = tasks.filter(t => t.id !== taskId);
      updateTasksState(updated);
    }
  };

  const handleImportTasks = async (newTasksList) => {
    if (!currentProject) return;

    // Detect new assignees from the imported list and auto-add to project members
    const existingMemberNames = new Set((currentProject.members || []).map(m => m.name.toLowerCase()));
    const newMembersToAdd = [];

    newTasksList.forEach(t => {
      if (t.assignee && t.assignee !== "Sin asignar" && !existingMemberNames.has(t.assignee.toLowerCase())) {
        existingMemberNames.add(t.assignee.toLowerCase());
        newMembersToAdd.push({
          id: "usr_" + Math.random().toString(36).substring(2, 8),
          name: t.assignee,
          email: ""
        });
      }
    });

    if (isFirebaseConnected) {
      const db = initFirebase();
      if (db) {
        // Add tasks to Firestore
        for (const task of newTasksList) {
          await addDoc(collection(db, "tasks"), task);
        }

        // Update project members if new members found
        if (newMembersToAdd.length > 0) {
          const projDoc = doc(db, "projects", currentProject.id);
          for (const mem of newMembersToAdd) {
            await updateDoc(projDoc, {
              members: arrayUnion(mem)
            });
          }
        }
      }
    } else {
      const merged = [...newTasksList, ...tasks];
      updateTasksState(merged);

      if (newMembersToAdd.length > 0) {
        const updatedMembers = [...(currentProject.members || []), ...newMembersToAdd];
        const updatedProj = { ...currentProject, members: updatedMembers };
        const updatedProjects = projects.map(p => p.id === currentProject.id ? updatedProj : p);
        setProjects(updatedProjects);
        setCurrentProject(updatedProj);
        saveLocalProjects(updatedProjects);
      }
    }
  };

  const handleExportTasks = () => {
    if (!tasks || tasks.length === 0) {
      alert("No hay tareas para exportar.");
      return;
    }

    const exportData = tasks.map(t => ({
      "ID": t.id,
      "Título": t.title,
      "Descripción": t.description || "",
      "Estado": t.status === "todo" ? "Por Hacer" : t.status === "in_progress" ? "En Progreso" : t.status === "in_review" ? "En Revisión" : "Completado",
      "Prioridad": t.priority === "urgent" ? "Urgente" : t.priority === "high" ? "Alta" : t.priority === "low" ? "Baja" : "Media",
      "Tipo": t.type === "bug" ? "Bug / Error" : t.type === "story" ? "Historia" : t.type === "improvement" ? "Mejora" : "Tarea",
      "Asignado": t.assignee || "Sin asignar",
      "Fecha Límite": t.dueDate || "",
      "Enlace Referencia": t.referenceUrl || "",
      "Etiquetas": (t.tags || []).join(", "),
      "Creado Por": t.createdByName || "",
      "Fecha de Creación": t.createdAt ? new Date(t.createdAt).toLocaleDateString() : ""
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Tareas");
    
    const projectNameClean = (currentProject?.name || "Proyecto").replace(/[^a-zA-Z0-9]/g, "_");
    XLSX.writeFile(wb, `MavlTask_Export_${projectNameClean}.xlsx`);
  };

  const filteredTasks = tasks.filter((task) => {
    const matchesSearch =
      task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (task.description && task.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (task.id && task.id.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (task.tags && task.tags.some(t => t.toLowerCase().includes(searchTerm.toLowerCase())));

    const matchesPriority = selectedPriority === "all" || task.priority === selectedPriority;
    const matchesType = selectedType === "all" || task.type === selectedType;
    const matchesAssignee = selectedAssignee === "all" || task.assignee === selectedAssignee;

    return matchesSearch && matchesPriority && matchesType && matchesAssignee;
  });

  const getTasksByStatus = (statusId) => {
    return filteredTasks.filter(t => t.status === statusId);
  };

  const activeFiltersCount = (selectedPriority !== "all" ? 1 : 0) + 
                             (selectedType !== "all" ? 1 : 0) + 
                             (selectedAssignee !== "all" ? 1 : 0) +
                             (searchTerm ? 1 : 0);

  if (currentUser.isAnonymous) {
    return <LoginScreen onLoginSuccess={setCurrentUser} />;
  }

  return (
    <div className="min-h-screen bg-[#f0f4f9] text-slate-800 flex flex-col selection:bg-blue-600 selection:text-white">
      {/* Header Superior Principal MavlTask en Azul Marino (#0b192c) */}
      <header className="sticky top-0 z-40 bg-[#0b192c] border-b border-[#1e3a5f] px-4 sm:px-6 py-2.5 shadow-md shadow-slate-900/10">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
          
          {/* Logo y Menú Hamburguesa */}
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            {/* Botón Menú Hamburguesa Móvil */}
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="lg:hidden p-2 rounded-xl bg-[#1e3e62]/70 hover:bg-[#1e3e62] text-white border border-blue-400/30 transition-colors focus:outline-none"
              title="Abrir menú de navegación"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Logo */}
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 sm:w-9 sm:h-9 shrink-0 rounded-xl bg-gradient-to-br from-blue-500 via-sky-400 to-cyan-400 p-0.5 shadow-sm shadow-blue-500/30">
                <div className="w-full h-full bg-[#0b192c] rounded-[10px] flex items-center justify-center">
                  <FolderKanban className="w-4 h-4 text-sky-400" />
                </div>
              </div>
              <span className="font-extrabold text-base sm:text-lg tracking-tight text-white block leading-tight">
                Mavl<span className="text-sky-400">Task</span>
              </span>
            </div>

            {/* Selector de Proyecto en Desktop / Tablet */}
            <div className="hidden sm:flex items-center gap-2 pl-2 border-l border-[#1e3a5f]">
              <div className="relative max-w-[200px]">
                <select
                  value={currentProject?.id || ""}
                  onChange={(e) => {
                    const found = projects.find(p => p.id === e.target.value);
                    if (found) {
                      setCurrentProject(found);
                      window.history.replaceState(null, '', `?project=${found.id}`);
                    }
                  }}
                  className="w-full appearance-none font-bold text-xs sm:text-sm bg-[#1e3e62]/70 hover:bg-[#1e3e62] text-white pl-2.5 pr-7 py-1.5 rounded-xl border border-blue-400/30 focus:outline-none focus:ring-2 focus:ring-sky-400 cursor-pointer truncate transition-colors"
                >
                  {projects.map(p => (
                    <option key={p.id} value={p.id} className="bg-[#0b192c] text-white">{p.name}</option>
                  ))}
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-sky-300 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>

              {/* Botón Crear Proyecto */}
              <button
                onClick={() => setIsProjectModalOpen(true)}
                className="p-1.5 rounded-xl bg-[#1e3e62]/70 hover:bg-[#1e3e62] text-sky-200 hover:text-white border border-blue-400/30 shrink-0 transition-colors"
                title="Crear nuevo proyecto"
              >
                <Plus className="w-4 h-4" />
              </button>

              {/* Botón Compartir Proyecto */}
              {currentProject && (
                <button
                  onClick={() => setIsShareModalOpen(true)}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 border border-sky-400/30 text-xs font-semibold shrink-0 transition-colors"
                  title="Compartir enlace con compañeros"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span className="hidden md:inline">Compartir</span>
                </button>
              )}
            </div>
          </div>

          {/* Filtros en Desktop */}
          <div className="hidden lg:flex items-center gap-2 flex-1 max-w-xl justify-end">
            <div className="relative flex-1 max-w-xs">
              <Search className="w-3.5 h-3.5 text-sky-300 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Buscar tareas, tags o #ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-8 pr-7 py-1.5 text-xs bg-[#10243e] border border-[#20436d] rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-400"
              />
              {searchTerm && (
                <button onClick={() => setSearchTerm("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white">
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Filtro Prioridad */}
            <select
              value={selectedPriority}
              onChange={(e) => setSelectedPriority(e.target.value)}
              className="px-2.5 py-1.5 text-xs bg-[#10243e] border border-[#20436d] rounded-xl text-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-400 cursor-pointer"
            >
              <option value="all" className="bg-[#0b192c]">Prioridades</option>
              {Object.entries(PRIORITIES).map(([k, v]) => (
                <option key={k} value={k} className="bg-[#0b192c]">{v.label}</option>
              ))}
            </select>

            {/* Filtro Tipo */}
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="px-2.5 py-1.5 text-xs bg-[#10243e] border border-[#20436d] rounded-xl text-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-400 cursor-pointer"
            >
              <option value="all" className="bg-[#0b192c]">Tipos</option>
              {Object.entries(ISSUE_TYPES).map(([k, v]) => (
                <option key={k} value={k} className="bg-[#0b192c]">{v.label}</option>
              ))}
            </select>
          </div>

          {/* Acciones de Derecha: Firebase y Perfil */}
          <div className="flex items-center gap-2">


            <button
              onClick={() => setIsProfileModalOpen(true)}
              className="flex items-center gap-1.5 pl-1 pr-2.5 py-1 rounded-xl bg-[#1e3e62]/70 hover:bg-[#1e3e62] text-white border border-blue-400/30 text-xs font-semibold shrink-0 transition-colors cursor-pointer"
              title="Configurar mi cuenta / perfil"
            >
              {currentUser.photoURL ? (
                <img
                  src={currentUser.photoURL}
                  alt={currentUser.name}
                  className="w-6 h-6 rounded-full object-cover border border-sky-400"
                />
              ) : (
                <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-blue-500 to-sky-400 flex items-center justify-center text-[10px] font-bold text-white shadow-xs">
                  {(currentUser.name || 'U').substring(0, 2).toUpperCase()}
                </div>
              )}
              <span className="hidden sm:inline max-w-[90px] truncate">{currentUser.name}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Menú Lateral Hamburguesa Móvil (Drawer) */}
      <MobileDrawerMenu
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        projects={projects}
        currentProject={currentProject}
        onSelectProject={(p) => {
          setCurrentProject(p);
          window.history.replaceState(null, '', `?project=${p.id}`);
        }}
        onOpenProjectModal={() => setIsProjectModalOpen(true)}
        onOpenShareModal={() => setIsShareModalOpen(true)}
        onOpenProfileModal={() => setIsProfileModalOpen(true)}
        onOpenImportModal={() => setIsImportModalOpen(true)}
        onExportTasks={handleExportTasks}
        currentUser={currentUser}
        isFirebaseConnected={isFirebaseConnected}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        selectedAssignee={selectedAssignee}
        setSelectedAssignee={setSelectedAssignee}
        selectedPriority={selectedPriority}
        setSelectedPriority={setSelectedPriority}
        selectedType={selectedType}
        setSelectedType={setSelectedType}
        onResetFilters={() => {
          setSelectedPriority("all");
          setSelectedType("all");
          setSelectedAssignee("all");
          setSearchTerm("");
        }}
        activeFiltersCount={activeFiltersCount}
      />

      {/* Barra de Contexto del Tablero + Selector Limpio de Filtro por Usuario */}
      <section className="bg-white border-b border-slate-200/80 px-4 sm:px-6 py-2.5 shadow-2xs">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4 flex-wrap">
          
          {/* Título, Proyecto y Toggle Kanban/Stats */}
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <div>
                <h2 className="text-base sm:text-lg font-bold text-slate-900 leading-tight">
                  {viewMode === "kanban" ? "Tablero Kanban" : "Métricas y Desempeño"}
                </h2>
                <p className="text-xs text-slate-500">
                  {currentProject?.name} • Clave: <span className="font-mono font-bold text-blue-600">{currentProject?.key || 'MAVL'}</span>
                </p>
              </div>

              {/* Botones de Toggle */}
              <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200 ml-2">
                <button
                  onClick={() => setViewMode("kanban")}
                  className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold rounded-md transition-all ${
                    viewMode === "kanban" 
                      ? "bg-white text-blue-600 shadow-sm" 
                      : "text-slate-500 hover:text-slate-700"
                  }`}
                  title="Vista de Tablero"
                >
                  <FolderKanban className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Tablero</span>
                </button>
                <button
                  onClick={() => setViewMode("stats")}
                  className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold rounded-md transition-all ${
                    viewMode === "stats" 
                      ? "bg-white text-emerald-600 shadow-sm" 
                      : "text-slate-500 hover:text-slate-700"
                  }`}
                  title="Estadísticas de Usuario"
                >
                  <BarChart3 className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Métricas</span>
                </button>
              </div>
            </div>

            {/* Selector Limpio de Filtro por Usuario (Select Dropdown) - Solo visible en Kanban */}
            {viewMode === "kanban" && (
              <div className="flex items-center gap-2 pl-0 sm:pl-4 border-t sm:border-t-0 sm:border-l border-slate-200 pt-2 sm:pt-0 w-full sm:w-auto">
              <label className="text-xs font-semibold text-slate-600 flex items-center gap-1.5 shrink-0">
                <Users className="w-3.5 h-3.5 text-blue-600" />
                <span>Asignado a:</span>
              </label>

              <div className="relative min-w-[160px] sm:min-w-[190px]">
                <UserSelect
                  value={selectedAssignee}
                  onChange={setSelectedAssignee}
                  members={currentProject?.members || []}
                  currentUser={currentUser}
                  includeAllOption={true}
                  className="bg-slate-50 hover:bg-slate-100"
                />
              </div>

              {selectedAssignee !== "all" && (
                <button
                  onClick={() => setSelectedAssignee("all")}
                  className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                  title="Ver todos los usuarios"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            )}
          </div>

          {/* Botones de Acción en Desktop */}
          <div className="hidden sm:flex items-center gap-2">
            <button
              onClick={() => setIsImportModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-bold bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-300 shadow-2xs active:scale-95 transition-all cursor-pointer"
              title="Importar o migrar tareas desde Excel / CSV"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              <span className="hidden md:inline">Importar</span>
            </button>

            <button
              onClick={handleExportTasks}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-bold bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-300 shadow-2xs active:scale-95 transition-all cursor-pointer"
              title="Exportar tareas actuales a Excel"
            >
              <Download className="w-4 h-4 text-slate-500" />
              <span className="hidden md:inline">Exportar</span>
            </button>

            <button
              onClick={() => {
                setTaskToEdit(null);
                setIsTaskModalOpen(true);
              }}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/25 active:scale-95 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>Nueva Tarea</span>
            </button>
          </div>
        </div>
      </section>

      {/* Main Content Area */}
      <main className="flex-1 p-3 sm:p-5 md:p-6 max-w-7xl mx-auto w-full overflow-x-auto">
        {viewMode === "stats" ? (
          <ProjectStats 
            tasks={tasks} 
            members={currentProject?.members || []} 
            currentUser={currentUser} 
          />
        ) : (
          <DragDropContext onDragEnd={onDragEnd}>
            <div className="grid grid-flow-row sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 min-w-[280px]">
              {DEFAULT_COLUMNS.map((col) => {
                const colTasks = getTasksByStatus(col.id);

              return (
                <div
                  key={col.id}
                  className="flex flex-col rounded-2xl bg-slate-200/60 border border-slate-200 p-2.5 sm:p-3 min-h-[360px] sm:min-h-[500px]"
                >
                  {/* Encabezado de Columna */}
                  <div className="flex items-center justify-between px-1.5 py-1.5 mb-2">
                    <div className="flex items-center gap-1.5 sm:gap-2">
                      <span className={`px-2.5 py-0.5 rounded-lg text-xs font-bold border ${col.color}`}>
                        {col.title}
                      </span>
                      <span className="text-xs font-mono font-bold text-slate-600 bg-white px-2 py-0.5 rounded-full border border-slate-200 shadow-2xs">
                        {colTasks.length}
                      </span>
                    </div>

                    <button
                      onClick={() => {
                        setTaskToEdit({ status: col.id });
                        setIsTaskModalOpen(true);
                      }}
                      className="p-1 hover:bg-slate-300/60 text-slate-500 hover:text-blue-600 rounded-lg transition-colors"
                      title="Agregar tarea a esta columna"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Lista de Tarjetas */}
                  <Droppable droppableId={col.id}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className={`flex-1 flex flex-col gap-2 p-1 rounded-xl transition-colors duration-200 ${
                          snapshot.isDraggingOver ? "bg-blue-100/50 ring-2 ring-blue-400" : ""
                        }`}
                      >
                        {colTasks.map((task, index) => (
                          <Draggable
                            key={task.id}
                            draggableId={task.id}
                            index={index}
                          >
                            {(provided, snapshot) => (
                              <TaskCard
                                task={task}
                                provided={provided}
                                snapshot={snapshot}
                                currentUser={currentUser}
                                members={currentProject?.members || []}
                                onEdit={(task) => {
                                  setTaskToEdit(task);
                                  setIsTaskModalOpen(true);
                                }}
                                onDelete={handleDeleteTask}
                              />
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}

                        {colTasks.length === 0 && !snapshot.isDraggingOver && (
                          <div className="flex-1 flex flex-col items-center justify-center p-4 sm:p-6 text-center border border-dashed border-slate-300 rounded-xl min-h-[80px]">
                            <p className="text-xs text-slate-400 font-medium">Sin tareas</p>
                          </div>
                        )}
                      </div>
                    )}
                  </Droppable>
                </div>
              );
            })}
          </div>
        </DragDropContext>
        )}
      </main>

      {/* Botón Flotante (FAB) para Móvil */}
      <div className="fixed bottom-6 right-6 z-40 sm:hidden">
        <button
          onClick={() => {
            setTaskToEdit(null);
            setIsTaskModalOpen(true);
          }}
          className="w-13 h-13 rounded-full bg-blue-600 hover:bg-blue-700 text-white shadow-xl shadow-blue-600/40 flex items-center justify-center active:scale-95 transition-all"
          title="Crear Nueva Tarea"
        >
          <Plus className="w-6 h-6 stroke-[2.5]" />
        </button>
      </div>

      {/* Footer MavlTask en Azul Marino (#0b192c) */}
      <footer className="py-2.5 sm:py-3 px-4 sm:px-6 border-t border-[#1e3a5f] bg-[#0b192c] text-center text-[11px] sm:text-xs text-slate-300 shadow-inner">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-1.5 sm:gap-2">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <span className="font-extrabold text-white">Mavl<span className="text-sky-400">Task</span></span>
            <span className="text-slate-500">•</span>
            <span>Proyecto: <strong className="text-sky-300 truncate max-w-[150px] inline-block align-bottom">{currentProject?.name}</strong></span>
          </div>

          <div className="text-slate-400 text-[11px] sm:text-xs font-medium">
            Desarrollado con ❤️ por <span className="text-white font-bold">Marvin Vásquez</span>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 text-slate-300">
            <span>👥 {(currentProject?.members || []).length} miembros</span>
            <span className="text-slate-500">•</span>
            <span className="text-slate-200">{isFirebaseConnected ? "🔥 Sincronizado" : "💾 Local"}</span>
          </div>
        </div>
      </footer>

      {/* Modales */}
      <TaskModal
        isOpen={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
        onSave={handleSaveTask}
        taskToEdit={taskToEdit}
        members={currentProject?.members || []}
        currentUser={currentUser}
      />

      <ProjectModal
        isOpen={isProjectModalOpen}
        onClose={() => setIsProjectModalOpen(false)}
        onCreateProject={handleCreateProject}
      />

      <ShareProjectModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        project={currentProject}
        onAddMember={handleAddMember}
        onRemoveMember={handleRemoveMember}
        currentUser={currentUser}
      />

      <UserProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        currentUser={currentUser}
        isFirebaseConnected={isFirebaseConnected}

        onProfileUpdated={(u) => {
          setCurrentUser(u);
          if (currentProject) {
            handleAddMember(u);
          }
        }}
      />


      <ExcelImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        currentProject={currentProject}
        currentUser={currentUser}
        existingTasksCount={tasks.length}
        onImportTasks={handleImportTasks}
      />
    </div>
  );
}
