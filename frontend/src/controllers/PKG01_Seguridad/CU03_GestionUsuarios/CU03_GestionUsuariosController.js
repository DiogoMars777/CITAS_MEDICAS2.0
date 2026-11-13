import { useState, useEffect, useCallback } from 'react';
import { API_ENDPOINTS } from '@/config/api';

const API_BASE = API_ENDPOINTS.usuarios;

/**
 * Controller Hook para CU03 - Gestión de Usuarios Internos, Roles y Permisos
 */
export const useCU03GestionUsuariosController = () => {
  // Pestaña activa: 'usuarios' | 'roles_permisos'
  const [activeTab, setActiveTab] = useState('usuarios');

  // Datos de Usuarios
  const [usuarios, setUsuarios] = useState([]);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    lastPage: 1,
    perPage: 10,
    total: 0,
  });

  // Estadísticas analíticas
  const [stats, setStats] = useState({
    total: 0,
    activos: 0,
    inactivos: 0,
    bloqueados: 0,
    administradores: 0,
    medicos: 0,
    recepcionistas: 0,
    pacientes: 0,
  });

  // Datos de Roles y Permisos
  const [roles, setRoles] = useState([]);
  const [permisosAgrupados, setPermisosAgrupados] = useState({});
  const [totalPermisos, setTotalPermisos] = useState(0);

  // Rol seleccionado en la pestaña de matriz de privilegios
  const [selectedRoleForPermisos, setSelectedRoleForPermisos] = useState(null);
  const [rolePermisosSet, setRolePermisosSet] = useState(new Set());
  const [savingPermisos, setSavingPermisos] = useState(false);

  // Filtros de búsqueda
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRol, setFilterRol] = useState('');
  const [filterEstado, setFilterEstado] = useState('');

  // Estados de carga y mensajes
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  // Modales
  const [modalFormOpen, setModalFormOpen] = useState(false);
  const [userToEdit, setUserToEdit] = useState(null);

  const [modalStatusOpen, setModalStatusOpen] = useState(false);
  const [userForStatus, setUserForStatus] = useState(null);
  const [nextStatusTarget, setNextStatusTarget] = useState('ACTIVO');

  /**
   * 1. Cargar Usuarios desde Backend PostgreSQL
   */
  const fetchUsuarios = useCallback(async (page = 1) => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      params.append('page', String(page));
      params.append('per_page', '10');

      if (searchTerm.trim()) params.append('search', searchTerm.trim());
      if (filterRol) params.append('id_rol', filterRol);
      if (filterEstado) params.append('estado', filterEstado);

      const res = await fetch(`${API_BASE}?${params.toString()}`);
      if (!res.ok) throw new Error(`HTTP error ${res.status}`);

      const data = await res.json();
      setUsuarios(data.data.data || []);
      setPagination({
        currentPage: data.data.current_page || 1,
        lastPage: data.data.last_page || 1,
        perPage: data.data.per_page || 10,
        total: data.data.total || 0,
      });

      if (data.stats) {
        setStats(data.stats);
      }
    } catch (err) {
      console.error('Error fetching usuarios:', err);
      setError('No se pudo cargar la lista de usuarios desde PostgreSQL.');
    } finally {
      setLoading(false);
    }
  }, [searchTerm, filterRol, filterEstado]);

  /**
   * 2. Cargar Roles disponibles con permisos asociados
   */
  const fetchRoles = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/meta/roles`);
      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
      const json = await res.json();
      const rolesList = json.data || [];
      setRoles(rolesList);

      // Si no hay rol seleccionado en matriz de privilegios, seleccionar el primero
      if (rolesList.length > 0) {
        setSelectedRoleForPermisos((current) => {
          if (!current) {
            const first = rolesList[0];
            setRolePermisosSet(new Set(first.permisos_ids || []));
            return first;
          }
          // Actualizar con nuevos datos si ya existía
          const updated = rolesList.find((r) => r.id_rol === current.id_rol) || rolesList[0];
          setRolePermisosSet(new Set(updated.permisos_ids || []));
          return updated;
        });
      }
    } catch (err) {
      console.error('Error fetching roles:', err);
    }
  }, []);

  /**
   * 3. Cargar Permisos agrupados por Módulo
   */
  const fetchPermisos = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/meta/permisos`);
      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
      const json = await res.json();
      setPermisosAgrupados(json.agrupados || {});
      setTotalPermisos(json.total || 0);
    } catch (err) {
      console.error('Error fetching permisos:', err);
    }
  }, []);

  // Cargar datos al montar y al cambiar filtros
  useEffect(() => {
    fetchUsuarios(1);
  }, [fetchUsuarios]);

  useEffect(() => {
    fetchRoles();
    fetchPermisos();
  }, [fetchRoles, fetchPermisos]);

  /**
   * 4. Crear o Actualizar Usuario
   */
  const handleSaveUser = async (formData, userId = null) => {
    setActionLoading(true);
    setError(null);
    setSuccessMsg(null);

    const isEdit = Boolean(userId);
    const url = isEdit ? `${API_BASE}/${userId}` : API_BASE;
    const method = isEdit ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        let msg = data.message || 'Error al procesar la solicitud.';
        if (data.errors) {
          const firstErr = Object.values(data.errors)[0];
          if (Array.isArray(firstErr) && firstErr[0]) msg = firstErr[0];
        }
        return { success: false, message: msg };
      }

      setSuccessMsg(data.message || (isEdit ? 'Usuario actualizado.' : 'Usuario registrado.'));
      setModalFormOpen(false);
      setUserToEdit(null);
      await fetchUsuarios(pagination.currentPage);
      await fetchRoles(); // Refrescar conteo en roles

      return { success: true };
    } catch (err) {
      return { success: false, message: err.message || 'Error de red con el servidor.' };
    } finally {
      setActionLoading(false);
    }
  };

  /**
   * 5. Cambiar Estado de un Usuario (ACTIVO, INACTIVO, BLOQUEADO)
   */
  const handleConfirmChangeStatus = async (user, nextStatus) => {
    setActionLoading(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const res = await fetch(`${API_BASE}/${user.id_usuario}/estado`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({ estado: nextStatus }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'No se pudo actualizar el estado.');
      }

      setSuccessMsg(data.message);
      setModalStatusOpen(false);
      setUserForStatus(null);
      await fetchUsuarios(pagination.currentPage);
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  /**
   * 6. Seleccionar Rol para gestionar privilegios
   */
  const handleSelectRoleForPermisos = (role) => {
    setSelectedRoleForPermisos(role);
    setRolePermisosSet(new Set(role.permisos_ids || []));
    setSuccessMsg(null);
    setError(null);
  };

  /**
   * 7. Alternar un permiso en el Set del rol seleccionado
   */
  const handleTogglePermiso = (idPermiso) => {
    setRolePermisosSet((prev) => {
      const next = new Set(prev);
      if (next.has(idPermiso)) {
        next.delete(idPermiso);
      } else {
        next.add(idPermiso);
      }
      return next;
    });
  };

  /**
   * 8. Guardar Privilegios del Rol en PostgreSQL (rol_permisos)
   */
  const handleSaveRolePermissions = async () => {
    if (!selectedRoleForPermisos) return;

    setSavingPermisos(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const res = await fetch(`${API_BASE}/meta/roles/${selectedRoleForPermisos.id_rol}/permisos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({ permisos: Array.from(rolePermisosSet) }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Error al guardar los permisos del rol.');
      }

      setSuccessMsg(`Privilegios del rol '${selectedRoleForPermisos.nombre_rol}' actualizados en PostgreSQL.`);
      await fetchRoles(); // Recargar datos actualizados
    } catch (err) {
      setError(err.message);
    } finally {
      setSavingPermisos(false);
    }
  };

  /**
   * Abrir modales
   */
  const openCreateModal = () => {
    setUserToEdit(null);
    setModalFormOpen(true);
  };

  const openEditModal = (user) => {
    setUserToEdit(user);
    setModalFormOpen(true);
  };

  const openStatusModal = (user, nextStatus) => {
    setUserForStatus(user);
    setNextStatusTarget(nextStatus);
    setModalStatusOpen(true);
  };

  const closeModals = () => {
    setModalFormOpen(false);
    setUserToEdit(null);
    setModalStatusOpen(false);
    setUserForStatus(null);
  };

  return {
    activeTab,
    setActiveTab,
    usuarios,
    pagination,
    stats,
    roles,
    permisosAgrupados,
    totalPermisos,
    selectedRoleForPermisos,
    rolePermisosSet,
    savingPermisos,
    searchTerm,
    setSearchTerm,
    filterRol,
    setFilterRol,
    filterEstado,
    setFilterEstado,
    loading,
    actionLoading,
    error,
    successMsg,
    modalFormOpen,
    userToEdit,
    modalStatusOpen,
    userForStatus,
    nextStatusTarget,
    // Funciones en Español
    obtenerUsuarios: fetchUsuarios,
    obtenerRoles: fetchRoles,
    obtenerPermisos: fetchPermisos,
    guardarUsuario: handleSaveUser,
    confirmarCambioEstado: handleConfirmChangeStatus,
    seleccionarRolParaPermisos: handleSelectRoleForPermisos,
    alternarPermiso: handleTogglePermiso,
    guardarPermisosRol: handleSaveRolePermissions,
    abrirModalCrear: openCreateModal,
    abrirModalEditar: openEditModal,
    abrirModalEstado: openStatusModal,
    cerrarModales: closeModals,
    limpiarMensajes: () => { setError(null); setSuccessMsg(null); },

    // Funciones originales para compatibilidad
    fetchUsuarios,
    handleSaveUser,
    handleConfirmChangeStatus,
    handleSelectRoleForPermisos,
    handleTogglePermiso,
    handleSaveRolePermissions,
    openCreateModal,
    openEditModal,
    openStatusModal,
    closeModals,
    clearMessages: () => { setError(null); setSuccessMsg(null); },
  };
};

export default useCU03GestionUsuariosController;
