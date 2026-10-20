export function usersHref(basePath: string, { role, page }: { role?: string; page?: number }) {
  const params = new URLSearchParams()
  if (role) params.set('role', role)
  if (page && page > 1) params.set('page', String(page))
  const query = params.toString()
  return query ? `${basePath}?${query}` : basePath
}
