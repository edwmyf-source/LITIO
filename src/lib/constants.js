export const ADMIN_EMAILS = ['edwmyf@gmail.com']

// Cuando esté en true, el código de verificación por WhatsApp será OBLIGATORIO
// en el onboarding. Por ahora el campo se muestra pero es opcional.
export const WHATSAPP_VERIFICATION_ENABLED = false

export const isAdmin = (profile, email = '') =>
  profile?.role === 'admin' || ADMIN_EMAILS.includes(email) || ADMIN_EMAILS.includes(profile?.email)

// Nuevas categorías con subcategorías
export const CATEGORIES = [
  {
    value: 'productos',
    label: 'Productos',
    subcategories: [
      'Materias Primas',
      'Reactivos',
      'Equipos y Consumibles',
      'Mobiliarios',
      'Otros',
    ],
  },
  {
    value: 'servicios',
    label: 'Servicios',
    subcategories: [
      'Análisis de Laboratorio',
      'Mantenimiento/Calibración',
      'Asesoría/Capacitación',
      'Maquila',
      'Otros',
    ],
  },
  {
    value: 'empleos',
    label: 'Empleos',
    subcategories: [
      'Operativo',
      'Técnico',
      'Profesional',
      'Coordinador',
      'Gerencial',
    ],
  },
  {
    value: 'informacion',
    label: 'Información',
    subcategories: [
      'Noticias',
      'Eventos',
      'Recursos',
      'Legal',
      'Novedades',
    ],
  },
]

// Flat lookup
export const CATEGORY_MAP = Object.fromEntries(CATEGORIES.map(c => [c.value, c]))

// Reactions
export const REACTIONS = [
  { type: 'like', icon: 'thumbsup', label: 'Me interesa' },
  { type: 'celebrate', icon: 'partypopper', label: 'Felicitaciones' },
  { type: 'curious', icon: 'eye', label: 'Interesante' },
  { type: 'love', icon: 'heart', label: 'Me encanta' },
  { type: 'surprised', icon: 'sparkles', label: 'Me sorprende' },
]

// Legacy compat
export const CATEGORY_SEED = CATEGORIES.flatMap(c =>
  c.subcategories.map(sub => ({ main_type: c.value, name: sub }))
)

export const DEPARTAMENTOS = [
  'Amazonas','Antioquia','Arauca','Atlántico','Bogotá D.C.','Bolívar','Boyacá',
  'Caldas','Caquetá','Casanare','Cauca','Cesar','Chocó','Córdoba','Cundinamarca',
  'Guainía','Guaviare','Huila','La Guajira','Magdalena','Meta','Nariño',
  'Norte de Santander','Putumayo','Quindío','Risaralda','San Andrés',
  'Santander','Sucre','Tolima','Valle del Cauca','Vaupés','Vichada'
]

// Top 3 que concentran el mayor volumen industrial
export const DEPARTAMENTOS_TOP3 = ['Antioquia', 'Bogotá D.C.', 'Valle del Cauca']

// Para el filtro de Vacantes: top 3 primero, luego el resto alfabético
export const DEPARTAMENTOS_ORDERED = [
  ...DEPARTAMENTOS_TOP3,
  ...DEPARTAMENTOS.filter(d => !DEPARTAMENTOS_TOP3.includes(d)).sort(),
]

// Tabs del marketplace
export const MARKETPLACE_TABS = [
  { value: 'todo',      label: 'TODO',      color: '#7c3aed', bg: '#ede9fe' },
  { value: 'novedades', label: 'INFO',      color: '#16a34a', bg: '#dcfce7', categories: ['informacion'] },
  { value: 'tienda',    label: 'TIENDA',    color: '#0369a1', bg: '#dbeafe', categories: ['productos', 'servicios'] },
  { value: 'vacantes',  label: 'VACANTES',  color: '#ea580c', bg: '#ffedd5', categories: ['empleos'] },
]

export const TAB_COLOR = {
  todo:          { color: '#7c3aed', bg: '#ede9fe' },
  novedades:     { color: '#16a34a', bg: '#dcfce7' },
  tienda:        { color: '#0369a1', bg: '#dbeafe' },
  vacantes:      { color: '#ea580c', bg: '#ffedd5' },
}

// Estructura de Tienda: intent → categoría → subcategorías
export const TIENDA_CATS = [
  {
    value: 'productos',
    label: 'Productos',
    subcategories: ['Materias Primas', 'Reactivos', 'Equipos y Consumibles', 'Mobiliarios', 'Otros'],
  },
  {
    value: 'servicios',
    label: 'Servicios',
    subcategories: ['Análisis de Laboratorio', 'Mantenimiento/Calibración', 'Asesoría/Capacitación', 'Maquila', 'Otros'],
  },
]

// Subcategorías de Novedades
export const NOVEDADES_SUBCATS = ['Novedades', 'Noticias', 'Eventos', 'Normativas', 'Recursos', 'Preguntas']

// Niveles de Vacantes
export const VACANTES_NIVELES = ['Operativo', 'Técnico', 'Profesional', 'Coordinador', 'Gerencial']

export const SEGMENTS = [
  'ACADEMICO','INDUSTRIAL','ALIMENTOS','COSMETICO','FARMACEUTICO',
  'ESTATAL','AMBIENTAL','AGRICOLA','VETERINARIO','CLINICO'
]
