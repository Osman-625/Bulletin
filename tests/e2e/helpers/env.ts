export function requireEnv(name: string): string {
  const value = process.env[name]
  if (!value) {
    throw new Error(`${name} must be set in the dedicated E2E test environment`)
  }
  return value
}

export function hasEnv(...names: string[]): boolean {
  return names.every((name) => Boolean(process.env[name]))
}
