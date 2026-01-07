const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

interface ApiError {
  message: string;
  errors?: Record<string, string[]>;
}

class ApiClient {
  private baseUrl: string;
  private token: string | null = null;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('auth_token');
    }
  }

  setToken(token: string) {
    this.token = token;
    if (typeof window !== 'undefined') {
      localStorage.setItem('auth_token', token);
    }
  }

  clearToken() {
    this.token = null;
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_token');
    }
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    // Cambio aquí: usar Record<string, string> en lugar de HeadersInit
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };

    // Agregar headers personalizados del options
    if (options.headers) {
      Object.assign(headers, options.headers);
    }

    // Ahora sí puedes agregar Authorization sin problemas
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error: ApiError = await response.json();
      
      // Si hay errores de validación (422), formatearlos
      if (error.errors && typeof error.errors === 'object') {
        const errorMessages = Object.values(error.errors)
          .flat()
          .join(', ');
        const errorObj = new Error(errorMessages || error.message || 'Error en la petición');
        (errorObj as any).status = response.status;
        throw errorObj;
      }
      
      const errorObj = new Error(error.message || 'Error en la petición');
      (errorObj as any).status = response.status;
      throw errorObj;
    }

    return response.json();
  }

  // Auth
  async login(email: string, password: string) {
    const data = await this.request<{ user: any; token: string }>('/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    this.setToken(data.token);
    return data;
  }

  async logout() {
    await this.request('/logout', { method: 'POST' });
    this.clearToken();
  }

  async getUser() {
    return this.request<{ user: any }>('/user');
  }

  // Métodos genéricos
  async get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  async post<T>(endpoint: string, data: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async put<T>(endpoint: string, data: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }

  // Socios
  async getSocios(params?: { search?: string, estado?: string, page?: number, per_page?: number }) {
    const urlParams = new URLSearchParams();
    if (params?.search) urlParams.append('search', params.search);
    if (params?.estado && params.estado !== 'todos') urlParams.append('estado', params.estado);
    if (params?.page) urlParams.append('page', String(params.page));
    if (params?.per_page) urlParams.append('per_page', String(params.per_page));
    
    const queryString = urlParams.toString();
    return this.get<{ socios: any[], meta: any }>(`/socios${queryString ? `?${queryString}` : ''}`);
  }

  async getSocio(id: string) {
    return this.get<{ socio: any }>(`/socios/${id}`);
  }

  async createSocio(data: any) {
    return this.post<{ message: string; socio: any }>('/socios', data);
  }

  async updateSocio(id: string, data: any) {
    return this.put<{ message: string; socio: any }>(`/socios/${id}`, data);
  }

  async deleteSocio(id: string) {
    return this.delete<{ message: string }>(`/socios/${id}`);
  }

  async createUserForSocio(id: string, email: string, password: string) {
    return this.post<{ message: string; user: any }>(`/socios/${id}/create-user`, {
      email,
      password,
    });
  }

  async getProfile() {
    return this.get<{ socio: any }>("/perfil")
  }

  async updateProfile(data: any) {
    return this.post<{ message: string; socio: any }>("/perfil", data)
  }

  // Instructores (reutiliza endpoints de socios)
  async getInstructores(search?: string) {
    const params = new URLSearchParams()
    params.append("tipo_persona", "instructor")
    if (search) params.append("search", search)
    const response = await this.get<{ socios: any[], meta: any }>(`/socios?${params.toString()}`)
    return response.socios
  }

  async createInstructor(data: any) {
    return this.post<{ message: string; socio: any }>("/socios", { ...data, tipo_persona: "instructor" })
  }

  async updateInstructor(id: string, data: any) {
    return this.put<{ message: string; socio: any }>(`/socios/${id}`, data)
  }

  async deleteInstructor(id: string) {
    return this.delete<{ message: string }>(`/socios/${id}`)
  }

  // Planes (Servicios)
  async getPlanes(search?: string) {
    const params = new URLSearchParams()
    params.append("tipo_servicio", "plan")
    if (search) params.append("search", search)
    const response = await this.get<{ servicios: any[] }>(`/servicios?${params.toString()}`)
    return response.servicios
  }

  async createPlan(data: any) {
    // Ensure tipo_servicio is set
    return this.post<{ message: string; servicio: any }>("/servicios", { ...data, tipo_servicio: "plan" })
  }

  async updatePlan(id: string, data: any) {
    return this.put<{ message: string; servicio: any }>(`/servicios/${id}`, data)
  }

  async deletePlan(id: string) {
    return this.delete<{ message: string }>(`/servicios/${id}`)
  }

  // Membresías
  async getMembresias(params?: { id_socio?: string; estado?: string; search?: string }) {
    const urlParams = new URLSearchParams()
    if (params?.id_socio) urlParams.append("id_socio", params.id_socio)
    if (params?.estado && params.estado !== "todas") urlParams.append("estado", params.estado)
    if (params?.search) urlParams.append("search", params.search)
    
    const queryString = urlParams.toString()
    const response = await this.get<{ membresias: any[] }>(`/membresias${queryString ? `?${queryString}` : ""}`)
    return response.membresias
  }

  async createMembresia(data: { id_socio: string; id_plan: string; fecha_inicio?: string }) {
    return this.post<{ message: string; membresia: any }>("/membresias", data)
  }

  async updateMembresia(id: string, data: any) {
    return this.put<{ message: string; membresia: any }>(`/membresias/${id}`, data)
  }

  async deleteMembresia(id: string) {
    return this.delete<{ message: string }>(`/membresias/${id}`)
  }

  // Clases
  async getClases() {
    return this.get<{ clases: any[] }>("/clases")
  }

  async createClase(data: any) {
    return this.post<{ message: string; clase: any }>("/clases", data)
  }

  async updateClase(id: string, data: any) {
    return this.put<{ message: string; clase: any }>(`/clases/${id}`, data)
  }

  async deleteClase(id: string) {
    return this.delete<{ message: string }>(`/clases/${id}`)
  }

  // Reservas y Disponibilidad
  async getAvailableClasses(startDate?: string, endDate?: string) {
    const params = new URLSearchParams()
    if (startDate) params.append("start_date", startDate)
    if (endDate) params.append("end_date", endDate)
    const response = await this.get<{ instancias: any[] }>(`/clases-disponibles?${params.toString()}`)
    return response.instancias
  }

  async createReserva(data: { id_clase_gym: string; fecha_reserva: string; id_persona?: string }) {
    return this.post<{ message: string; reserva: any }>("/reservas", data)
  }

  async getReservas(params?: { id_persona?: string; fecha?: string }) {
    const urlParams = new URLSearchParams()
    if (params?.id_persona) urlParams.append("id_persona", params.id_persona)
    if (params?.fecha) urlParams.append("fecha", params.fecha)
    const response = await this.get<{ reservas: any[] }>(`/reservas?${urlParams.toString()}`)
    return response.reservas
  }

  async cancelReserva(id: string) {
    return this.delete<{ message: string }>(`/reservas/${id}`)
  }

  async marcarAsistencia(data: { id_persona: string; id_clase_gym?: string; id_reserva?: string }) {
    return this.post<{ message: string; asistencia: any }>("/asistencias", data)
  }

  async getAsistencias() {
    const response = await this.get<{ asistencias: any[] }>("/asistencias")
    return response.asistencias
  }

  // Pagos
  async getPagos(params?: { id_persona?: string; search?: string }) {
    const urlParams = new URLSearchParams()
    if (params?.id_persona) urlParams.append("id_persona", params.id_persona)
    if (params?.search) urlParams.append("search", params.search)
    
    return this.get<{ pagos: any[]; deuda_total?: number }>(
      `/pagos-gym${urlParams.toString() ? `?${urlParams.toString()}` : ""}`
    )
  }

  async createPago(data: { 
    id_persona: string; 
    id_membresia: string; 
    monto: number; 
    metodo_pago: string; 
    fecha_pago: string;
    observaciones?: string;
  }) {
    return this.post<{ message: string; pago: any }>("/pagos-gym", data)
  }

  async getDashboardStats() {
    return this.get<{
      metrics: {
        sociosActivos: number;
        clasesHoy: number;
        reservasSemana: number;
        ingresosHoy: number;
      };
      charts: {
        asistenciaSemanal: { day: string; visits: number; percentage: number }[];
        clasesPopulares: { name: string; reservations: number; trend: string }[];
      };
      membershipOverview: {
        activas: number;
        por_vencer: number;
        vencidas: number;
      };
      ocupacion: {
        porcentaje: number;
      };
      instructores: { name: string; classes: number }[];
    }>("/dashboard/stats");
  }
}

export const api = new ApiClient(API_URL);