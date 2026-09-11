# MavlTask - Collaborative Jira-like Kanban System

Sistema colaborativo de gestión de tareas e incidencias ágiles con soporte para múltiples proyectos, sincronización en tiempo real con Firebase Firestore & Authentication (Google 1-Click + Email), subida de capturas por portapapeles (Ctrl+V) y drag & drop, sección de comentarios y enlaces de referencia.

---

## 🚀 Características Principales

- 📋 **Tablero Kanban con 4 columnas**: Por Hacer, En Progreso, En Revisión y Completado.
- 🖐️ **Drag & Drop interactivo y fluido** con `@hello-pangea/dnd`.
- 📁 **Múltiples Proyectos / Espacios**: Crea proyectos ilimitados con claves personalizadas (`MAVL`, `PROJ`, etc.) y comparte enlaces de invitación directa (`?project=PROJECT_ID`).
- 🔐 **Autenticación Flexible**: Inicio de sesión en 1 clic con Google, Email / Password o Modo Invitado local.
- 💬 **Comentarios y Pruebas Colaborativas**: Discute avances y adjunta capturas de pantalla/evidencias.
- 🖼️ **Subida de Imágenes Avanzada**: Soporte para selector de archivos, arrastrar y soltar, y pegar directo con `Ctrl + V`.
- 🛡️ **Control de Permisos**: Solo el creador de la tarea puede editar el cuerpo/título o eliminarla; el equipo puede comentar y mover de estado.
- 👥 **Filtro Select por Usuario**: Selector limpio para filtrar el tablero por miembros asignados.
- 📱 **Diseño 100% Responsivo**: Menú hamburguesa lateral (Drawer) y botón flotante (FAB) para móviles.
- 🎨 **Paleta Profesional**: Barra superior y pie de página en Azul Marino (`#0b192c`) con tablero claro (`#f0f4f9`).
- 💾 **Persistencia Híbrida**: Funciona offline con `LocalStorage` o en la nube en tiempo real con `Firebase`.

---

## 🛠️ Ejecución Local

1. Instala dependencias:
   ```bash
   npm install
   ```
2. Inicia el entorno de desarrollo:
   ```bash
   npm run dev
   ```
3. Construye para producción:
   ```bash
   npm run build
   ```

---

## 🚢 Despliegue en Vercel

El repositorio incluye `vercel.json` configurado para Single Page Applications (SPA).

1. Conecta tu repositorio de GitHub `https://github.com/Alexmavl/MavlTask.git` a Vercel.
2. Parámetros de compilación:
   - **Framework Preset**: `Vite`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
3. ¡Listo para producción!
