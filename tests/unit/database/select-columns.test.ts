import { expectTypeOf, it } from 'vitest'
import type {
  ANNOUNCEMENT_REVIEW_COLUMNS,
  NOTIFICATION_COLUMNS,
  ORGANIZATION_COLUMNS,
  USER_PROFILE_COLUMNS,
} from '@/infrastructure/database/columns'
import type { Tables } from '@/infrastructure/database/database.types'

type Trim<S extends string> = S extends ` ${infer Rest}` ? Trim<Rest> : S
type ColumnsOf<S extends string> = S extends `${infer Head},${infer Rest}`
  ? Trim<Head> | ColumnsOf<Rest>
  : Trim<S>

// These are checked by `tsc --noEmit`: a column added to a table but missing from its list (or
// listed but removed from the table) fails the type check instead of reading as `undefined`.
it('keeps every shared select list equal to its table row type', () => {
  expectTypeOf<ColumnsOf<typeof USER_PROFILE_COLUMNS>>().toEqualTypeOf<keyof Tables<'users'>>()
  expectTypeOf<ColumnsOf<typeof ORGANIZATION_COLUMNS>>().toEqualTypeOf<
    keyof Tables<'organizations'>
  >()
  expectTypeOf<ColumnsOf<typeof NOTIFICATION_COLUMNS>>().toEqualTypeOf<
    keyof Tables<'notifications'>
  >()
  expectTypeOf<ColumnsOf<typeof ANNOUNCEMENT_REVIEW_COLUMNS>>().toEqualTypeOf<
    keyof Tables<'announcements'>
  >()
})
