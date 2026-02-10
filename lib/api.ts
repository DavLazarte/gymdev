const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";
const PROXY_URL = "/api/proxy"; // Ruta relativa a nuestro Next.js

interface ApiError {
  message: string;
  errors?: Record<string, string[]>;
}

class ApiClient {
  private directUrl: string;
  private token: string | null = null;
  private useProxy: boolean = false;
  private readonly MAX_RETRIES = 2; // Intentos extra tras fallo

  constructor(baseUrl: string) {
    this.directUrl = baseUrl;
    if (typeof window !== "undefined") {
      this.token = localStorage.getItem("auth_token");
      // Recuperar estado de ISP problemático
      this.useProxy = localStorage.getItem("force_proxy_mode") === "true";
      if (this.useProxy) {
          console.log("[ApiClient] Modo Proxy activado por defecto (ISP detectado previamente)");
      }
    }
  }

  setToken(token: string) {
    this.token = token;
    if (typeof window !== "undefined") {
      localStorage.setItem("auth_token", token);
    }
  }

  clearToken() {
    this.token = null;
    if (typeof window !== "undefined") {
      localStorage.removeItem("auth_token");
    }
  }

  // Detectar si el error parece ser bloqueo de ISP (CORS, Network Error, 415)
  private isConnectionError(error: any, status?: number): boolean {
    if (status === 415) return true; // Unsupported Media Type (común en firewalls que rompen headers)
    const msg = error.message?.toLowerCase() || "";
    return (
        msg.includes("failed to fetch") || 
        msg.includes("network error") || 
        msg.includes("cors")
    );
  }

  private async sleep(ms: number) {
      return new Promise(resolve => setTimeout(resolve, ms));
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    retryCount = 0
  ): Promise<T> {
    // Determinar URL base
    const baseUrl = this.useProxy ? PROXY_URL : this.directUrl;
    
    // Headers base optimizados
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "Accept": "application/json",
      // Anti-cache headers para atravesar proxies corporativos
      "Cache-Control": "no-cache, no-store, must-revalidate",
      "Pragma": "no-cache",
      "Expires": "0"
    };

    if (options.headers) {
      Object.assign(headers, options.headers);
    }

    if (this.token) {
      headers["Authorization"] = `Bearer ${this.token}`;
    }

    try {
      const response = await fetch(`${baseUrl}${endpoint}`, {
        ...options,
        headers,
      });

      // Si nos da 415 o error de servidor en modo directo, podría ser el firewall
      if (!this.useProxy && (response.status === 415)) {
          throw new Error("Posible bloqueo de ISP (415)");
      }

      if (!response.ok) {
        // Si falló el proxy con 502/504, es fatal
        if (this.useProxy && [502, 504].includes(response.status)) {
            throw new Error("Error de conexión incluso vía Proxy");
        }

        const error: ApiError = await response.json().catch(() => ({ message: "Error desconocido" }));

        // Manejo de errores de validación
        if (error.errors && typeof error.errors === "object") {
          const errorMessages = Object.values(error.errors).flat().join(", ");
          const errorObj = new Error(
            errorMessages || error.message || "Error en la petición"
          );
          (errorObj as any).status = response.status;
          throw errorObj;
        }

        const errorObj = new Error(error.message || "Error en la petición");
        (errorObj as any).status = response.status;
        throw errorObj;
      }

      return response.json();

    } catch (error: any) {
      // Lógica de recuperación
      const isBlock = this.isConnectionError(error, (error as any).status);
      
      // Caso 1: Estábamos en directo y detectamos bloqueo -> Switch a Proxy y reintentar YA
      if (!this.useProxy && isBlock) {
          console.warn(`[ApiClient] Detectado bloqueo de ISP (${error.message}). Activando Proxy Fallback...`);
          this.useProxy = true;
          if (typeof window !== "undefined") {
              localStorage.setItem("force_proxy_mode", "true");
          }
          // Reintentar inmediatamente con proxy
          return this.request<T>(endpoint, options, retryCount);
      }

      // Caso 2: Backoff exponencial para errores transitorios
      if (retryCount < this.MAX_RETRIES) {
          const delay = Math.pow(2, retryCount) * 1000; // 1s, 2s, 4s...
          console.log(`[ApiClient] Reintentando petición (${retryCount + 1}/${this.MAX_RETRIES}) en ${delay}ms...`);
          await this.sleep(delay);
          return this.request<T>(endpoint, options, retryCount + 1);
      }

      throw error;
    }
  }

  // Auth
  async login(email: string, password: string) {
    const data = await this.request<{ user: any; token: string }>("/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });

    this.setToken(data.token);
    return data;
  }

  async logout() {
    await this.request("/logout", { method: "POST" });
    this.clearToken();
  }

  async getUser() {
    return this.request<{ user: any }>("/user");
  }

  // Métodos genéricos
  async get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: "GET" });
  }

  async post<T>(endpoint: string, data: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async put<T>(endpoint: string, data: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: "DELETE" });
  }

  // Socios
  async getSocios(params?: {
    search?: string;
    estado?: string;
    page?: number;
    per_page?: number;
    tipo_persona?: string;
    all?: boolean; // Fetch all records without pagination
  }) {
    const urlParams = new URLSearchParams();
    if (params?.search) urlParams.append("search", params.search);
    if (params?.estado && params.estado !== "todos")
      urlParams.append("estado", params.estado);
    if (params?.page) urlParams.append("page", String(params.page));
    
    // If 'all' is true, set a very high per_page to get all records
    const perPage = params?.all ? 999 : (params?.per_page || 15);
    urlParams.append("per_page", String(perPage));
    
    if (params?.tipo_persona) urlParams.append("tipo_persona", params.tipo_persona);

    const queryString = urlParams.toString();
    return this.get<{ socios: any[]; meta: any }>(
      `/socios${queryString ? `?${queryString}` : ""}`
    );
  }

  async getSocio(id: string) {
    return this.get<{ socio: any }>(`/socios/${id}`);
  }

  async createSocio(data: any) {
    return this.post<{ message: string; socio: any }>("/socios", data);
  }

  async updateSocio(id: string, data: any) {
    return this.put<{ message: string; socio: any }>(`/socios/${id}`, data);
  }

  async deleteSocio(id: string) {
    return this.delete<{ message: string }>(`/socios/${id}`);
  }

  async createUserForSocio(id: string, email: string, password: string) {
    return this.post<{ message: string; user: any }>(
      `/socios/${id}/create-user`,
      {
        email,
        password,
      }
    );
  }

  async getProfile() {
    return this.get<{ socio: any }>("/perfil");
  }

  async updateProfile(data: any) {
    return this.post<{ message: string; socio: any }>("/perfil", data);
  }

  // Instructores (reutiliza endpoints de socios)
  async getInstructores(params?: { search?: string; per_page?: number }) {
    const urlParams = new URLSearchParams();
    urlParams.append("tipo_persona", "instructor");
    if (params?.search) urlParams.append("search", params.search);
    if (params?.per_page) urlParams.append("per_page", String(params.per_page));
    
    // NOTA: Ajusté esto para usar getSocios si es posible, pero mantengo la lógica original
    // para no romper nada, solo asegurando el cast correcto
    const response = await this.get<{ socios: any[]; meta: any }>(
      `/socios?${urlParams.toString()}`
    );
    return response.socios;
  }

  async createInstructor(data: any) {
    return this.post<{ message: string; socio: any }>("/socios", {
      ...data,
      tipo_persona: "instructor",
    });
  }

  async updateInstructor(id: string, data: any) {
    return this.put<{ message: string; socio: any }>(`/socios/${id}`, data);
  }

  async deleteInstructor(id: string) {
    return this.delete<{ message: string }>(`/socios/${id}`);
  }

  // Planes (Servicios)
  async getPlanes(search?: string) {
    const params = new URLSearchParams();
    params.append("tipo_servicio", "plan");
    if (search) params.append("search", search);
    const response = await this.get<{ servicios: any[] }>(
      `/servicios?${params.toString()}`
    );
    return response.servicios;
  }

  async createPlan(data: any) {
    return this.post<{ message: string; servicio: any }>("/servicios", {
      ...data,
      tipo_servicio: "plan",
    });
  }

  async updatePlan(id: string, data: any) {
    return this.put<{ message: string; servicio: any }>(
      `/servicios/${id}`,
      data
    );
  }

  async deletePlan(id: string) {
    return this.delete<{ message: string }>(`/servicios/${id}`);
  }

  // Membresías
  async getMembresias(params?: {
    id_socio?: string;
    estado?: string;
    search?: string;
    page?: number;
  }) {
    const urlParams = new URLSearchParams();
    if (params?.id_socio) urlParams.append("id_socio", params.id_socio);
    if (params?.estado && params.estado !== "todas")
      urlParams.append("estado", params.estado);
    if (params?.search) urlParams.append("search", params.search);
    if (params?.page) urlParams.append("page", String(params.page));

    const queryString = urlParams.toString();
    // Retorna objeto paginado directamente (Laravel standard pagination)
    return this.get<{ data: any[]; current_page: number; last_page: number; total: number }>(
      `/membresias${queryString ? `?${queryString}` : ""}`
    );
  }

  async createMembresia(data: {
    id_socio: string;
    id_plan: string;
    fecha_inicio?: string;
  }) {
    return this.post<{ message: string; membresia: any }>("/membresias", data);
  }

  async updateMembresia(id: string, data: any) {
    return this.put<{ message: string; membresia: any }>(
      `/membresias/${id}`,
      data
    );
  }

  async deleteMembresia(id: string) {
    return this.delete<{ message: string }>(`/membresias/${id}`);
  }

  // Clases
  async getClases() {
    return this.get<{ clases: any[] }>("/clases");
  }

  async createClase(data: any) {
    return this.post<{ message: string; clase: any }>("/clases", data);
  }

  async updateClase(id: string, data: any) {
    return this.put<{ message: string; clase: any }>(`/clases/${id}`, data);
  }

  async deleteClase(id: string) {
    return this.delete<{ message: string }>(`/clases/${id}`);
  }

  async getInstructorStats(instructorId: string, startDate: string, endDate: string) {
    const params = new URLSearchParams({
        instructor_id: instructorId,
        start_date: startDate,
        end_date: endDate
    });
    return this.get<{ total_classes: number, details: any[] }>(`/clases/instructor-stats?${params.toString()}`);
  }

  // Reservas y Disponibilidad
  async getAvailableClasses(startDate?: string, endDate?: string) {
    const params = new URLSearchParams();
    if (startDate) params.append("start_date", startDate);
    if (endDate) params.append("end_date", endDate);
    const response = await this.get<{ instancias: any[] }>(
      `/clases-disponibles?${params.toString()}`
    );
    return response.instancias;
  }

  async createReserva(data: {
    id_clase_gym: string;
    fecha_reserva: string;
    id_persona?: string;
  }) {
    return this.post<{ message: string; reserva: any }>("/reservas", data);
  }

  async getReservas(params?: { id_persona?: string; fecha?: string }) {
    const urlParams = new URLSearchParams();
    if (params?.id_persona) urlParams.append("id_persona", params.id_persona);
    if (params?.fecha) urlParams.append("fecha", params.fecha);
    const response = await this.get<{ reservas: any[] }>(
      `/reservas?${urlParams.toString()}`
    );
    return response.reservas;
  }

  async cancelReserva(id: string) {
    return this.delete<{ message: string }>(`/reservas/${id}`);
  }

  async marcarAsistencia(data: {
    id_persona: string;
    id_clase_gym?: string;
    id_reserva?: string;
  }) {
    return this.post<{ message: string; asistencia: any }>(
      "/asistencias",
      data
    );
  }

  async getAsistencias(params?: { page?: number; per_page?: number }) {
    const urlParams = new URLSearchParams();
    if (params?.page) urlParams.append("page", String(params.page));
    if (params?.per_page) urlParams.append("per_page", String(params.per_page));

    const response = await this.get<{ asistencias: any[]; meta?: any }>(
      `/asistencias${urlParams.toString() ? `?${urlParams.toString()}` : ""}`
    );
    // Corrección para evitar undefined
    return response.asistencias ? response : { asistencias: response as any, meta: undefined };
  }

  // Pagos
  async getPagos(params?: { id_persona?: string; search?: string; page?: number; per_page?: number }) {
    const urlParams = new URLSearchParams();
    if (params?.id_persona) urlParams.append("id_persona", params.id_persona);
    if (params?.search) urlParams.append("search", params.search);
    if (params?.page) urlParams.append("page", String(params.page));
    if (params?.per_page) urlParams.append("per_page", String(params.per_page));

    return this.get<{ pagos: any[]; meta?: any; deuda_total?: number }>(
      `/pagos-gym${urlParams.toString() ? `?${urlParams.toString()}` : ""}`
    );
  }

  async createPago(data: {
    id_persona: string;
    id_membresia: string;
    monto: number;
    metodo_pago: string;
    fecha_pago: string;
    observaciones?: string;
  }) {
    return this.post<{ message: string; pago: any }>("/pagos-gym", data);
  }

  // Salidas (Gastos)
  async getSalidas(params?: {
    tipo?: string;
    fecha_inicio?: string;
    fecha_fin?: string;
    search?: string;
    page?: number;
    per_page?: number;
  }) {
    const urlParams = new URLSearchParams();
    if (params?.tipo && params.tipo !== "todos")
      urlParams.append("tipo", params.tipo);
    if (params?.fecha_inicio)
      urlParams.append("fecha_inicio", params.fecha_inicio);
    if (params?.fecha_fin) urlParams.append("fecha_fin", params.fecha_fin);
    if (params?.search) urlParams.append("search", params.search);
    if (params?.page) urlParams.append("page", String(params.page));
    if (params?.per_page) urlParams.append("per_page", String(params.per_page));

    return this.get<{ salidas: any[]; meta: any; stats: any }>(
      `/salidas-gym?${urlParams.toString()}`
    );
  }

  async createSalida(data: any) {
    return this.post<{ message: string; salida: any }>("/salidas-gym", data);
  }

  async updateSalida(id: string, data: any) {
    return this.put<{ message: string; salida: any }>(
      `/salidas-gym/${id}`,
      data
    );
  }

  async deleteSalida(id: string) {
    return this.delete<{ message: string }>(`/salidas-gym/${id}`);
  }

  async getDashboardStats() {
    return this.get<{
      metrics: {
        sociosActivos: number;
        clasesHoy: number;
        reservasSemana: number;
        ingresosHoy: number;
        salidasHoy: number;
        balanceHoy: number;
      };
      charts: {
        asistenciaSemanal: {
          day: string;
          visits: number;
          percentage: number;
        }[];
        clasesPopulares: {
          name: string;
          reservations: number;
          trend: string;
        }[];
      };
      membershipOverview: {
        activas: number;
        por_vencer: number;
        vencidas: number;
        por_vencer_7_dias?: number; // Agregado para soportar dashboards avanzados
      };
      ocupacion: {
        porcentaje: number;
      };
      instructores: { name: string; classes: number }[];
    }>("/dashboard/stats");
  }
}

export const api = new ApiClient(API_URL);
