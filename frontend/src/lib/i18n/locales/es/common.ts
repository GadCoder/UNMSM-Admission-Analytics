export const commonEs = {
  actions: {
    cancel: 'Cancelar',
    edit: 'Editar',
    create: 'Crear',
    update: 'Actualizar',
    logout: 'Cerrar sesion',
    retryFailed: 'Reintentar fallidos',
    cancelQueued: 'Cancelar en cola',
    createBatch: 'Crear lote',
    resetFilters: 'Restablecer filtros',
  },
  states: {
    yes: 'Si',
    no: 'No',
    loading: 'Cargando...',
  },
  table: {
    id: 'ID',
    name: 'Nombre',
    slug: 'Slug',
    actions: 'Acciones',
    file: 'Archivo',
    size: 'Tamano',
    status: 'Estado',
    error: 'Error',
  },
} as const
