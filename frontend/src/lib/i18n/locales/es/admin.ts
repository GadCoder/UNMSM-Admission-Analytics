export const adminEs = {
  shell: {
    consoleTag: 'Consola administrativa',
    title: 'Gestion academica e importaciones',
    sectionsLabel: 'Secciones administrativas',
    sections: {
      processes: 'Procesos',
      areas: 'Areas',
      faculties: 'Facultades',
      majors: 'Carreras',
      imports: 'Importaciones',
    },
  },
  areas: {
    title: 'Areas academicas',
    placeholders: {
      name: 'Nombre del area',
      slug: 'slug-del-area',
    },
    form: {
      create: 'Crear area',
      update: 'Actualizar area',
    },
    errors: {
      load: 'No se pudieron cargar las areas',
      create: 'No se pudo crear el area',
      update: 'No se pudo actualizar el area',
    },
  },
  faculties: {
    title: 'Facultades',
    placeholders: {
      name: 'Nombre de la facultad',
      slug: 'slug-de-la-facultad',
      selectArea: 'Seleccionar area academica',
    },
    form: {
      create: 'Crear facultad',
      update: 'Actualizar facultad',
    },
    table: {
      areaId: 'ID de area',
    },
    errors: {
      load: 'No se pudieron cargar las facultades',
      save: 'No se pudo guardar la facultad',
      areaRequired: 'El area academica es obligatoria',
    },
  },
  majors: {
    title: 'Carreras',
    placeholders: {
      name: 'Nombre de la carrera',
      slug: 'slug-de-la-carrera',
      selectFaculty: 'Seleccionar facultad',
    },
    form: {
      active: 'Activa',
      create: 'Crear carrera',
      update: 'Actualizar carrera',
    },
    table: {
      facultyId: 'ID de facultad',
      active: 'Activa',
    },
    errors: {
      load: 'No se pudieron cargar las carreras',
      save: 'No se pudo guardar la carrera',
      facultyRequired: 'La facultad es obligatoria',
    },
  },
  processes: {
    title: 'Procesos de admision',
    placeholders: {
      year: 'Anio',
      selectCycle: 'Seleccionar ciclo',
    },
    form: {
      label: 'Etiqueta',
      published: 'Publicado',
      create: 'Crear proceso',
      update: 'Actualizar proceso',
    },
    table: {
      label: 'Etiqueta',
      year: 'Anio',
      cycle: 'Ciclo',
      published: 'Publicado',
    },
    errors: {
      load: 'No se pudieron cargar los procesos de admision',
      save: 'No se pudo guardar el proceso de admision',
      yearRequired: 'El anio es obligatorio',
      cycleRequired: 'El ciclo es obligatorio',
    },
  },
  imports: {
    title: 'Importaciones masivas de resultados',
    dropzone: 'Arrastra y suelta archivos CSV o usa el selector.',
    form: {
      defaultProcess: 'Proceso predeterminado',
      selectProcess: 'Seleccionar proceso',
      processOverride: 'Sobrescribir proceso',
      useDefault: 'Usar predeterminado',
    },
    batch: {
      title: 'Lote #{{batchId}}',
      loadingStatus: 'Cargando estado del lote...',
      summary:
        'En cola: {{queued}} - Procesando: {{processing}} - Completados: {{completed}} - Fallidos: {{failed}} - Cancelados: {{cancelled}}',
      importedRows: 'Importados/Total',
    },
    errors: {
      selectAtLeastOne: 'Selecciona al menos un archivo CSV',
      maxFiles: 'Un lote puede incluir hasta {{max}} archivos',
      maxFileMb: 'El archivo {{name}} supera el limite de {{max}}MB',
      defaultProcessRequired: 'El proceso de admision predeterminado es obligatorio',
      submit: 'No se pudo enviar la importacion por lote',
      refreshStatus: 'No se pudo actualizar el estado del lote',
    },
  },
} as const
