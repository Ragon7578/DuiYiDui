const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number
  ) {
    super(message)
  }
}

function getToken(): string | null {
  if (typeof window === "undefined") return null
  return localStorage.getItem("cs_token")
}

export function setToken(token: string): void {
  localStorage.setItem("cs_token", token)
}

export function clearToken(): void {
  localStorage.removeItem("cs_token")
}

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken()
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  }
  if (token) headers.Authorization = `Bearer ${token}`

  const res = await fetch(`${API_URL}${path}`, { ...options, headers })

  if (res.status === 204) return undefined as T

  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new ApiError(data.error || "Request failed", res.status)
  }
  return data as T
}
