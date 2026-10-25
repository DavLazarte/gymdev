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
    const tenantHost =
      typeof window !== "undefined"
        ? localStorage.getItem("tenant_host") || window.location.hostname
        : "localhost";
    const tenantId =
      typeof window !== "undefined"
        ? localStorage.getItem("tenant_id")
        : null;
    let tenantSlug: string | null = null;
    if (typeof window !== "undefined") {
      const queryBox = new URLSearchParams(window.location.search).get("box");
      const pathMatch = window.location.pathname.match(/^\/box\/([^\/]+)/);
      const pathBox = pathMatch ? pathMatch[1] : null;

      tenantSlug =
        queryBox ||
        pathBox ||
        localStorage.getItem("tenant_slug") ||
        null;

      if (tenantSlug) {
        localStorage.setItem("tenant_slug", tenantSlug);
      }
    }

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "Accept": "application/json",
      "X-Tenant-Host": tenantHost,
      // Anti-cache headers para atravesar proxies corporativos
      "Cache-Control": "no-cache, no-store, must-revalidate",
      "Pragma": "no-cache",
      "Expires": "0"
    };

    if (tenantId) {
      headers["X-Tenant-Id"] = tenantId;
    }
    if (tenantSlug) {
      headers["X-Tenant-Slug"] = tenantSlug;
    }

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
        cache: "no-store",
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
          // Reintentar inmediatamente con proxy SOLO para GETs
          const method = (options.method || "GET").toUpperCase();
          if (method === "GET") {
              console.log("[ApiClient] Reintentando GET vía Proxy...");
              return this.request<T>(endpoint, options, retryCount);
          }
          // Para POST/PUT/DELETE no reintentamos automáticamente aunque hayamos cambiado a modo proxy
          throw error;
      }

      // Caso 2: Backoff exponencial SOLO para GETs — nunca reintentar POST/PUT/DELETE
      // porque si la request llegó al server pero la respuesta se perdió en tránsito,
      // un retry crearía registros duplicados en la BD.
      const method = (options.method || "GET").toUpperCase();
      if (method === "GET" && retryCount < this.MAX_RETRIES) {
          const delay = Math.pow(2, retryCount) * 1000; // 1s, 2s...
          console.log(`[ApiClient] Reintentando GET (${retryCount + 1}/${this.MAX_RETRIES}) en ${delay}ms...`);
          await this.sleep(delay);
          return this.request<T>(endpoint, options, retryCount + 1);
      }

      throw error;
    }
  }

  private syncTenantFromResponse(tenant?: any) {
    if (typeof window === "undefined" || !tenant) return;
    try {
      if (tenant.id) {
        localStorage.setItem("tenant_id", String(tenant.id));
      }
      if (tenant.slug) {
        localStorage.setItem("tenant_slug", String(tenant.slug));
      }
      const cfg = tenant.configuracion || {};
      localStorage.setItem(
        "tenant_branding",
        JSON.stringify({
          nombre: tenant.nombre || "Gimnasio",
          logo_url: cfg.logo_url || tenant.logo_url || null,
          color_primario: tenant.color_primario || cfg.color_primario || "#f97316",
          tema_modo: cfg.tema_modo === "light" ? "light" : "dark",
        })
      );
      window.dispatchEvent(new Event("tenant-config-updated"));
    } catch {}
  }

  // Auth
  async login(email: string, password: string) {
    const data = await this.request<{ user: any; token: string; tenant?: any }>("/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });

    this.setToken(data.token);
    this.syncTenantFromResponse(data.tenant);
    return data;
  }

  async logout() {
    await this.request("/logout", { method: "POST" });
    this.clearToken();
  }

  async getUser() {
    const data = await this.request<{ user: any; tenant?: any }>("/user");
    this.syncTenantFromResponse(data.tenant);
    return data;
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
    const perPage = params?.all ? 100 : (params?.per_page || 15);
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
    return this.put<{ message: string; socio: any }>(`/socios/${id}`, {
      ...data,
      tipo_persona: "instructor",
    });
  }

  async deleteInstructor(id: string) {
    return this.delete<{ message: string }>(
      `/socios/${id}?tipo_persona=instructor`
    );
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

  async getServicios(search?: string) {
    return this.getPlanes(search);
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
    id_clase_fija?: string;
    fecha_inicio?: string;
    registrar_pago?: boolean;
    metodo_pago?: string;
    monto_pago?: string | number;
    observaciones_pago?: string;
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

  async inscribirAlumnoFijo(claseId: string, alumnoId: string) {
    return this.post<{ message: string; clase: any }>(
      `/clases/${claseId}/inscripciones`,
      { alumno_id: alumnoId }
    );
  }

  async desinscribirAlumnoFijo(claseId: string, alumnoId: string) {
    return this.delete<{ message: string; clase: any }>(
      `/clases/${claseId}/inscripciones/${alumnoId}`
    );
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
    id_clase_gym?: string;
    clase_id?: string;
    fecha_reserva: string;
    turno_id?: number | string;
    id_persona?: string;
    socio_id?: string;
    baja_fijo?: boolean;
    accion?: "confirmar" | "no_asisto";
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
    id_persona: string | number;
    socio_id?: string;
    id_clase_gym?: string | number | null;
    clase_id?: string;
    turno_id?: number | string;
    id_reserva?: string;
    fecha?: string;
    fecha_asistencia?: string;
    hora_entrada?: string;
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

  // ─── Módulo 5: Entrenamiento, Planificación (Kanban), Ejercicios y RMs ──────

  async getTableroEntrenamiento() {
    return this.get<{
      planes: any[];
      semanas: any[];
      ejercicios: any[];
    }>("/entrenamiento/tablero");
  }

  async getPlanesEntrenamiento() {
    return this.get<{ planes: any[] }>("/entrenamiento/planes");
  }

  async createPlanEntrenamiento(data: {
    nombre: string;
    tipo: "clase" | "personalizado" | "general";
    grupo_id?: string | null;
    color?: string;
    descripcion?: string;
  }) {
    return this.post<{ message: string; plan: any }>(
      "/entrenamiento/planes",
      data
    );
  }

  async updatePlanEntrenamiento(id: string, data: any) {
    return this.put<{ message: string; plan: any }>(
      `/entrenamiento/planes/${id}`,
      data
    );
  }

  async deletePlanEntrenamiento(id: string) {
    return this.delete<{ message: string }>(`/entrenamiento/planes/${id}`);
  }

  async asignarAlumnoPlan(
    planId: string,
    data: { alumno_id: string; fecha_inicio?: string; fecha_fin?: string }
  ) {
    return this.post<{ message: string; plan: any }>(
      `/entrenamiento/planes/${planId}/alumnos`,
      data
    );
  }

  async desasignarAlumnoPlan(planId: string, alumnoId: string) {
    return this.delete<{ message: string; plan: any }>(
      `/entrenamiento/planes/${planId}/alumnos/${alumnoId}`
    );
  }

  async createSemana(data: {
    plan_id: string;
    titulo: string;
    fecha_inicio?: string;
    estado?: string;
  }) {
    return this.post<{ message: string; semana: any }>(
      "/entrenamiento/semanas",
      data
    );
  }

  async updateSemana(id: string, data: any) {
    return this.put<{ message: string; semana: any }>(
      `/entrenamiento/semanas/${id}`,
      data
    );
  }

  async duplicarSemana(id: string) {
    return this.post<{ message: string; semana: any }>(
      `/entrenamiento/semanas/${id}/duplicar`,
      {}
    );
  }

  async deleteSemana(id: string) {
    return this.delete<{ message: string }>(`/entrenamiento/semanas/${id}`);
  }

  async updateDia(id: string, data: { contenido?: string; descanso?: boolean }) {
    return this.put<{ message: string; dia: any }>(
      `/entrenamiento/dias/${id}`,
      data
    );
  }

  async addLinkDia(diaId: string, data: { titulo: string; url: string }) {
    return this.post<{ message: string; link: any }>(
      `/entrenamiento/dias/${diaId}/links`,
      data
    );
  }

  async deleteLinkDia(linkId: string) {
    return this.delete<{ message: string }>(`/entrenamiento/links/${linkId}`);
  }

  async toggleProgresoDia(diaId: string, alumnoId?: string) {
    return this.post<{ message: string; completado: boolean; dia_id: string }>(
      `/entrenamiento/dias/${diaId}/progreso`,
      alumnoId ? { alumno_id: alumnoId } : {}
    );
  }

  async addComentarioDia(
    diaId: string,
    data: { texto: string; alumno_id?: string }
  ) {
    return this.post<{ message: string; comentario: any }>(
      `/entrenamiento/dias/${diaId}/comentarios`,
      data
    );
  }

  async getEjercicios() {
    return this.get<{ ejercicios: any[] }>("/entrenamiento/ejercicios");
  }

  async createEjercicio(data: {
    nombre: string;
    categoria: string;
    unidad: "kg" | "reps" | "segundos";
    descripcion?: string;
    video_url?: string;
  }) {
    return this.post<{ message: string; ejercicio: any }>(
      "/entrenamiento/ejercicios",
      data
    );
  }

  async deleteEjercicio(id: string) {
    return this.delete<{ message: string }>(`/entrenamiento/ejercicios/${id}`);
  }

  async getRms(alumnoId?: string) {
    const query = alumnoId ? `?alumno_id=${alumnoId}` : "";
    return this.get<{ rms: any[] }>(`/entrenamiento/rms${query}`);
  }

  async createRm(data: {
    alumno_id?: string;
    ejercicio_id?: string;
    ejercicio_nombre?: string;
    ejercicio?: string;
    categoria?: string;
    unidad?: "kg" | "reps" | "segundos";
    kg: number;
    fecha?: string;
  }) {
    return this.post<{ message: string; rm: any }>("/entrenamiento/rms", data);
  }

  async updateRm(
    id: string,
    data: {
      ejercicio_id?: string;
      ejercicio_nombre?: string;
      ejercicio?: string;
      categoria?: string;
      unidad?: "kg" | "reps" | "segundos";
      kg: number;
      fecha?: string;
    }
  ) {
    return this.put<{ message: string; rm: any }>(
      `/entrenamiento/rms/${id}`,
      data
    );
  }

  async deleteRm(id: string) {
    return this.delete<{ message: string }>(`/entrenamiento/rms/${id}`);
  }

  async getMiPlanEntrenamiento(alumnoId?: string) {
    const query = alumnoId ? `?alumno_id=${alumnoId}` : "";
    return this.get<{
      alumno: any;
      planes: any[];
      semanas: any[];
      rms: any[];
      progreso_dias: string[];
    }>(`/entrenamiento/mi-plan${query}`);
  }

  // Configuración del Gimnasio (Tenant)
  async getTenantConfig() {
    return this.get<{ tenant: any }>("/tenant/config");
  }

  async updateTenantConfig(data: {
    nombre?: string;
    logo_url?: string | null;
    color_primario?: string;
    modulos?: Record<string, boolean>;
    configuracion?: Record<string, any>;
  }) {
    return this.put<{ message: string; tenant: any }>("/tenant/config", data);
  }

  // SuperAdmin - Gestión de Boxes / Tenants
  async getSuperAdminTenants(superadminKey: string) {
    return this.request<{ tenants: any[] }>("/superadmin/tenants", {
      method: "GET",
      headers: { "X-Superadmin-Key": superadminKey },
    });
  }

  async createSuperAdminTenant(superadminKey: string, data: Record<string, any>) {
    return this.request<{ message: string; tenant: any; admin: any }>("/superadmin/tenants", {
      method: "POST",
      headers: { "X-Superadmin-Key": superadminKey },
      body: JSON.stringify(data),
    });
  }

  async updateSuperAdminTenant(superadminKey: string, id: string, data: Record<string, any>) {
    return this.request<{ message: string; tenant: any }>(`/superadmin/tenants/${id}`, {
      method: "PUT",
      headers: { "X-Superadmin-Key": superadminKey },
      body: JSON.stringify(data),
    });
  }

  async toggleSuperAdminTenant(superadminKey: string, id: string) {
    return this.request<{ message: string; activo: boolean }>(`/superadmin/tenants/${id}/toggle`, {
      method: "PATCH",
      headers: { "X-Superadmin-Key": superadminKey },
    });
  }

  // Pre-venta, Leads y Lista de Espera (Turnos Fijos)
  async getLeads(params?: {
    estado?: string;
    search?: string;
    grupo_id?: string | number;
    page?: number;
    per_page?: number;
  }) {
    const q = new URLSearchParams();
    if (params?.estado && params.estado !== "todos") q.append("estado", params.estado);
    if (params?.search) q.append("search", params.search);
    if (params?.grupo_id) q.append("grupo_id", String(params.grupo_id));
    if (params?.page) q.append("page", String(params.page));
    if (params?.per_page) q.append("per_page", String(params.per_page));

    const qs = q.toString() ? `?${q.toString()}` : "";
    return this.request<{
      data: any[];
      stats: {
        total: number;
        pendientes: number;
        contactados: number;
        espera: number;
        convertidos: number;
        descartados: number;
      };
      meta: {
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
      };
    }>(`/leads${qs}`);
  }

  async updateLead(id: string | number, data: {
    estado?: string;
    notas_admin?: string;
    grupo_id?: string | number;
    plan_interes_id?: string | number;
  }) {
    return this.request<{ message: string; lead: any }>(`/leads/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  async convertLead(id: string | number, data: {
    tipo_membresia_id?: string | number;
    grupo_id?: string | number;
    fecha_inicio?: string;
    fecha_fin?: string;
    registrar_pago?: boolean;
    metodo_pago?: string;
    monto_pago?: number;
    notas_admin?: string;
  }) {
    return this.request<{ message: string; lead: any; alumno: any; membresia?: any }>(`/leads/${id}/convertir`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async deleteLead(id: string | number) {
    return this.request<{ message: string }>(`/leads/${id}`, {
      method: "DELETE",
    });
  }

  // Rutas Públicas (Landing Page del Box)
  async getPublicBoxData(slug: string) {
    return this.request<{ tenant: any; planes: any[]; clases: any[] }>(`/public/box/${slug}`, {
      method: "GET",
    });
  }

  async registerBoxLead(slug: string, data: {
    nombre: string;
    apellido?: string;
    email: string;
    telefono: string;
    grupo_id?: string | number;
    clase_id?: string | number;
    plan_interes_id?: string | number;
    objetivo?: string;
    plan_interes?: string;
    mensaje?: string;
  }) {
    return this.request<{
      message: string;
      lead_id?: number;
      estado?: string;
      es_lista_espera?: boolean;
      ya_registrado?: boolean;
      prospecto_id?: number;
    }>(`/public/box/${slug}/registro`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  }
}

export const api = new ApiClient(API_URL);

