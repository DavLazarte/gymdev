export interface Socio {
  id: string
  nombre: string
  email: string
  telefono: string
  direccion?: string
  fechaNacimiento?: string
  foto?: string
  dni?: string
  planId?: string
  planNombre: string
  estado: "activo" | "inactivo" | "vencido"
  fechaVencimiento?: string
  fechaInicio?: string
  tieneUsuario?: boolean
  userId?: string
  tipo_membresia?: string
  creditos_restantes?: number
  tipo_persona?: "cliente" | "instructor"
  role?: string
}

export interface Membresia {
  id: string
  idpersona: string
  idservicio: string
  id_local: string
  tipo: "fecha" | "creditos"
  fecha_inicio: string
  fecha_fin?: string
  creditos_totales?: number
  creditos_restantes?: number
  estado: "activa" | "vencida" | "por_vencer" | "cancelada"
  monto_total?: number
  total_pagado?: number
  saldo_pendiente?: number
  socio?: Socio
  plan?: Plan
}

export interface Plan {
  id: string
  nombre: string
  descripcion: string
  precio: number
  tipo_servicio: "plan" | "clase" | "servicio_general"
  duracion_dias?: number
  creditos?: number
  estado: boolean
  // Helper for UI
  tipo_plan?: "fecha" | "creditos" 
}

export interface Clase {
  id: string
  nombre: string
  idservicio?: string
  id_coach: string
  dias_semana: string // Comma separated: "Lunes,Miércoles"
  hora_inicio: string
  hora_fin: string
  duracion_minutos: number
  cupo_maximo: number
  estado: "activa" | "cancelada"
  inscritos_hoy?: number
  // Relational data for UI
  tipo_clase?: {
    nombre: string
  }
  coach?: {
    nombre: string
  }
}

export interface Instructor {
  id: string
  nombre: string
  email: string
  telefono: string
  direccion?: string
  foto?: string
  especialidades: string[]
  biografia: string
  estado: "activo" | "inactivo"
  clasesAsignadas: number
  tieneUsuario?: boolean
  userId?: string
}

export interface Asistencia {
  id: string
  socioId: string
  socioNombre: string
  claseId?: string
  claseNombre?: string
  fecha: string
  horaEntrada: string
  horaSalida?: string
  tipo: "clase" | "libre"
}

export interface Pago {
  id: string
  socioId: string
  socioNombre: string
  id_membresia: string
  concepto?: string // No longer strictly required if derived or optional
  monto: number
  metodoPago: string
  estado?: "pagado" | "pendiente" | "vencido"
  fecha: string
  observaciones?: string
  comprobante?: string
}
export interface ClassSlot {
  id: string
  clase_id: string
  reserva_id: string | null
  nombre: string
  instructor: string
  fecha: string
  hora: string
  duracion: number
  capacidad: number
  inscritos: number
  alumnos: { nombre: string; foto?: string }[]
  disponibles: number
  reservada: boolean
  estado_clase: string
}

export interface Reserva {
  id: string
  id_persona: string
  id_clase_gym: string
  fecha_reserva: string
  id_membresia: string
  estado: "reservada" | "asistio" | "cancelada" | "ausente"
  clase?: {
    nombre: string
    hora_inicio: string
  }
  persona?: {
    nombre: string
  }
}
