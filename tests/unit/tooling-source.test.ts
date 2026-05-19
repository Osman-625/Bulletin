import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

function source(path: string) {
  return readFileSync(path, 'utf8')
}

describe('tooling source guards', () => {
  it('declares dotenv directly because Playwright imports it', () => {
    const pkg = JSON.parse(source('package.json')) as {
      dependencies?: Record<string, string>
      devDependencies?: Record<string, string>
    }

    expect(pkg.dependencies?.dotenv ?? pkg.devDependencies?.dotenv).toBeDefined()
  })

  it('checks generated Supabase types against the committed type file', () => {
    const workflow = source('.github/workflows/test.yml')

    expect(workflow).toContain('diff src/lib/database.types.ts /tmp/database.types.generated.ts')
    expect(workflow).toContain('> src/lib/database.types.ts')
  })

  it('keeps shadcn out of production dependencies', () => {
    const pkg = JSON.parse(source('package.json')) as {
      dependencies?: Record<string, string>
      devDependencies?: Record<string, string>
    }

    expect(pkg.dependencies?.shadcn).toBeUndefined()
    expect(pkg.devDependencies?.shadcn).toBeDefined()
  })

  it('provides owner credentials to CI because owner E2E specs require them', () => {
    const workflow = source('.github/workflows/test.yml')

    expect(workflow).toContain('TEST_OWNER_EMAIL: ${{ secrets.TEST_OWNER_EMAIL }}')
    expect(workflow).toContain('TEST_OWNER_PASSWORD: ${{ secrets.TEST_OWNER_PASSWORD }}')
  })

  it('keeps Next generated type roots in the TypeScript project', () => {
    const tsconfig = source('tsconfig.json')

    expect(tsconfig).toContain('.next/types/**/*.ts')
    expect(tsconfig).toContain('.next/dev/types/**/*.ts')
  })
})
