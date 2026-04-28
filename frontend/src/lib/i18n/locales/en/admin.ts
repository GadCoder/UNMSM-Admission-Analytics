export const adminEn = {
  shell: {
    consoleTag: 'Admin console',
    title: 'Academic and import management',
    sectionsLabel: 'Admin sections',
    sections: {
      processes: 'Processes',
      areas: 'Areas',
      faculties: 'Faculties',
      majors: 'Majors',
      imports: 'Imports',
    },
  },
  areas: {
    title: 'Academic areas',
    placeholders: {
      name: 'Area name',
      slug: 'area-slug',
    },
    form: {
      create: 'Create area',
      update: 'Update area',
    },
    errors: {
      load: 'Could not load areas',
      create: 'Could not create area',
      update: 'Could not update area',
    },
  },
  faculties: {
    title: 'Faculties',
    placeholders: {
      name: 'Faculty name',
      slug: 'faculty-slug',
      selectArea: 'Select academic area',
    },
    form: {
      create: 'Create faculty',
      update: 'Update faculty',
    },
    table: {
      areaId: 'Area ID',
    },
    errors: {
      load: 'Could not load faculties',
      save: 'Could not save faculty',
      areaRequired: 'Academic area is required',
    },
  },
  majors: {
    title: 'Majors',
    placeholders: {
      name: 'Major name',
      slug: 'major-slug',
      selectFaculty: 'Select faculty',
    },
    form: {
      active: 'Active',
      create: 'Create major',
      update: 'Update major',
    },
    table: {
      facultyId: 'Faculty ID',
      active: 'Active',
    },
    errors: {
      load: 'Could not load majors',
      save: 'Could not save major',
      facultyRequired: 'Faculty is required',
    },
  },
  processes: {
    title: 'Admission processes',
    placeholders: {
      year: 'Year',
      selectCycle: 'Select cycle',
    },
    form: {
      label: 'Label',
      published: 'Published',
      create: 'Create process',
      update: 'Update process',
    },
    table: {
      label: 'Label',
      year: 'Year',
      cycle: 'Cycle',
      published: 'Published',
    },
    errors: {
      load: 'Could not load admission processes',
      save: 'Could not save admission process',
      yearRequired: 'Year is required',
      cycleRequired: 'Cycle is required',
    },
  },
  imports: {
    title: 'Bulk results imports',
    dropzone: 'Drag and drop CSV files, or use the picker.',
    form: {
      defaultProcess: 'Default process',
      selectProcess: 'Select process',
      processOverride: 'Process override',
      useDefault: 'Use default',
    },
    batch: {
      title: 'Batch #{{batchId}}',
      loadingStatus: 'Loading batch status...',
      summary:
        'Queued: {{queued}} - Processing: {{processing}} - Completed: {{completed}} - Failed: {{failed}} - Cancelled: {{cancelled}}',
      importedRows: 'Imported/Total',
    },
    errors: {
      selectAtLeastOne: 'Select at least one CSV file',
      maxFiles: 'A batch can include up to {{max}} files',
      maxFileMb: 'File {{name}} exceeds the {{max}}MB limit',
      defaultProcessRequired: 'Default admission process is required',
      submit: 'Could not submit batch import',
      refreshStatus: 'Could not refresh batch status',
    },
  },
} as const
