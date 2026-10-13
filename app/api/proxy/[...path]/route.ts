import { NextRequest, NextResponse } from "next/server";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

async function proxyRequest(request: NextRequest, { params }: { params: { path: string[] } }) {
  const path = (await params).path.join("/");
  const url = `${API_URL}/${path}`;
  const searchParams = request.nextUrl.searchParams.toString();
  const finalUrl = searchParams ? `${url}?${searchParams}` : url;

  console.log(`[Proxy] Forwarding ${request.method} to: ${finalUrl}`);

  try {
    const headers = new Headers(request.headers);
    
    const incomingHost =
      request.headers.get("x-tenant-host") ||
      request.headers.get("host")?.split(":")[0] ||
      "localhost";

    // Limpiar headers problemáticos que podrían revelar el proxy o causar bloqueos
    headers.delete("host");
    headers.delete("connection");
    headers.delete("referer");
    headers.delete("origin");

    // Inyectar host del tenant
    headers.set("X-Tenant-Host", incomingHost);
    
    // Asegurar que aceptamos JSON
    headers.set("Accept", "application/json"); 
    
    // Evitar cache en proxies intermedios
    headers.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
    headers.set("Pragma", "no-cache");
    headers.set("Expires", "0");

    const body = ['GET', 'HEAD'].includes(request.method) ? undefined : await request.text();

    const response = await fetch(finalUrl, {
      method: request.method,
      headers: headers,
      body: body,
      cache: "no-store",
    });

    const data = await response.text();
    
    // Crear respuesta manteniendo status y headers relevantes
    const resHeaders = new Headers(response.headers);
    resHeaders.delete("content-encoding"); // Evitar problemas de doble compresión
    resHeaders.delete("content-length");

    // Asegurar CORS permisivo en la respuesta del proxy
    resHeaders.set("Access-Control-Allow-Origin", "*");
    resHeaders.set("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS");
    resHeaders.set("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With, X-Tenant-Host, X-Tenant-Id, X-Tenant-Slug, X-Superadmin-Key");

    // Intentar parsear JSON si es posible para asegurar validez
    try {
        const jsonData = JSON.parse(data);
        return NextResponse.json(jsonData, {
            status: response.status,
            headers: resHeaders,
        });
    } catch {
        // Si no es JSON, devolver texto crudo (ej: errores de html de laravel)
        return new NextResponse(data, {
            status: response.status,
            headers: resHeaders,
        });
    }

  } catch (error) {
    console.error(`[Proxy Error] ${error}`);
    return NextResponse.json(
      { message: "Error de conexión con el servidor (Proxy Fallback)" },
      { status: 502 }
    );
  }
}

export async function GET(request: NextRequest, context: any) {
  return proxyRequest(request, context);
}

export async function POST(request: NextRequest, context: any) {
  return proxyRequest(request, context);
}

export async function PUT(request: NextRequest, context: any) {
  return proxyRequest(request, context);
}

export async function PATCH(request: NextRequest, context: any) {
  return proxyRequest(request, context);
}

export async function DELETE(request: NextRequest, context: any) {
  return proxyRequest(request, context);
}

export async function OPTIONS(request: NextRequest) {
    return NextResponse.json({}, {
        headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Requested-With, X-Tenant-Host, X-Tenant-Id, X-Tenant-Slug, X-Superadmin-Key",
        },
    });
}
