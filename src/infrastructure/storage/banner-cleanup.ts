const BANNER_BUCKET = 'banner-images'
const PUBLIC_BANNER_MARKER = `/storage/v1/object/public/${BANNER_BUCKET}/`
const DEFAULT_BATCH_SIZE = 100
const DEFAULT_MAX_DELETES = 100
const MAX_FOLDER_DEPTH = 4
// A banner is uploaded before its announcement is saved, so a young file may not be referenced yet.
const MIN_ORPHAN_AGE_MS = 24 * 60 * 60 * 1000

type StorageEntry = {
  name: string
  id?: string | null
  created_at?: string | null
  metadata?: unknown
}

type StorageBucket = {
  list: (
    path?: string,
    options?: { limit?: number; sortBy?: { column: string; order: 'asc' | 'desc' } }
  ) => Promise<{ data: StorageEntry[] | null; error: unknown }>
  remove: (paths: string[]) => Promise<{ data: unknown; error: unknown }>
}

type BannerStorageFile = {
  path: string
  size: number
  createdAt: number
}

type BannerCleanupClient = {
  from: (table: 'announcements') => {
    select: (columns: string) => {
      not: (
        column: string,
        operator: 'is',
        value: null
      ) => PromiseLike<{ data: Array<{ banner_url: string | null }> | null; error: unknown }>
    }
  }
  storage: {
    from: (bucket: typeof BANNER_BUCKET) => StorageBucket
  }
}

export type BannerCleanupResult = {
  scanned: number
  referenced: number
  orphaned: number
  deleted: number
  dryRun: boolean
  orphanedPaths: string[]
  errors: string[]
}

type BannerCleanupOptions = {
  dryRun?: boolean
  batchSize?: number
  maxDeletes?: number
  now?: number
}

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error)
}

function normalizePositiveInteger(value: number | undefined, fallback: number) {
  if (!Number.isFinite(value) || !value || value < 1) return fallback
  return Math.floor(value)
}

function joinStoragePath(prefix: string, name: string) {
  return prefix ? `${prefix}/${name}` : name
}

function isStorageFile(entry: StorageEntry, depth: number) {
  if (entry.name === '.emptyFolderPlaceholder') return false
  if (entry.id || entry.metadata) return true
  return depth >= 2 && /\.[a-z0-9]+$/i.test(entry.name)
}

// A missing or unreadable timestamp counts as old, so such files are still cleaned up.
function storageFileCreatedAt(entry: StorageEntry) {
  const createdAt = entry.created_at ? Date.parse(entry.created_at) : Number.NaN
  return Number.isFinite(createdAt) ? createdAt : 0
}

function storageFileSize(entry: StorageEntry) {
  if (!entry.metadata || typeof entry.metadata !== 'object') return 0
  const size = (entry.metadata as { size?: unknown }).size
  return typeof size === 'number' && Number.isFinite(size) ? size : 0
}

export function bannerStoragePath(publicUrl: string | null | undefined) {
  if (!publicUrl) return null

  const markerIndex = publicUrl.indexOf(PUBLIC_BANNER_MARKER)
  if (markerIndex === -1) return null

  const path = publicUrl.slice(markerIndex + PUBLIC_BANNER_MARKER.length).split('?')[0]
  if (!path || path.includes('..')) return null

  return decodeURIComponent(path)
}

async function listBannerFiles(
  bucket: StorageBucket,
  prefix = '',
  depth = 0
): Promise<BannerStorageFile[]> {
  const { data, error } = await bucket.list(prefix, {
    limit: 1000,
    sortBy: { column: 'name', order: 'asc' },
  })
  if (error)
    throw new Error(`Could not list banner storage path "${prefix || '/'}": ${errorMessage(error)}`)

  const files: BannerStorageFile[] = []
  const nestedPathPromises: Array<Promise<BannerStorageFile[]>> = []
  for (const entry of data ?? []) {
    if (entry.name === '.emptyFolderPlaceholder') continue

    const path = joinStoragePath(prefix, entry.name)
    if (isStorageFile(entry, depth)) {
      files.push({ path, size: storageFileSize(entry), createdAt: storageFileCreatedAt(entry) })
    } else if (depth < MAX_FOLDER_DEPTH) {
      nestedPathPromises.push(listBannerFiles(bucket, path, depth + 1))
    }
  }

  const nestedPathGroups = await Promise.all(nestedPathPromises)
  return files.concat(nestedPathGroups.flat())
}

export async function listBannerStorageFiles(bucket: StorageBucket) {
  return listBannerFiles(bucket)
}

export async function cleanupOrphanBannerImages(
  client: BannerCleanupClient,
  options: BannerCleanupOptions = {}
): Promise<BannerCleanupResult> {
  const batchSize = normalizePositiveInteger(options.batchSize, DEFAULT_BATCH_SIZE)
  const maxDeletes = normalizePositiveInteger(options.maxDeletes, DEFAULT_MAX_DELETES)
  const dryRun = Boolean(options.dryRun)
  const now = options.now ?? Date.now()
  const bucket = client.storage.from(BANNER_BUCKET)

  const [{ data: announcementRows, error: announcementError }, scannedFiles] = await Promise.all([
    client.from('announcements').select('banner_url').not('banner_url', 'is', null),
    listBannerStorageFiles(bucket),
  ])

  if (announcementError) {
    throw new Error(`Could not read referenced banner URLs: ${errorMessage(announcementError)}`)
  }

  const referencedPaths = new Set(
    (announcementRows ?? [])
      .map((row) => bannerStoragePath(row.banner_url))
      .filter((path): path is string => Boolean(path))
  )
  const scannedPaths = scannedFiles.map((file) => file.path)
  const allOrphanedPaths = scannedFiles.flatMap((file) =>
    !referencedPaths.has(file.path) && now - file.createdAt >= MIN_ORPHAN_AGE_MS ? [file.path] : []
  )
  const orphanedPaths = allOrphanedPaths.slice(0, maxDeletes)
  const errors: string[] = []
  let deleted = 0

  if (!dryRun) {
    const deleteBatches: string[][] = []
    for (let index = 0; index < orphanedPaths.length; index += batchSize) {
      deleteBatches.push(orphanedPaths.slice(index, index + batchSize))
    }

    const deleteResults = await Promise.all(
      deleteBatches.map(async (batch) => {
        const result = await bucket.remove(batch)
        return { batch, error: result.error }
      })
    )

    for (const { batch, error } of deleteResults) {
      if (error) {
        errors.push(errorMessage(error))
      } else {
        deleted += batch.length
      }
    }
  }

  return {
    scanned: scannedPaths.length,
    referenced: referencedPaths.size,
    orphaned: allOrphanedPaths.length,
    deleted,
    dryRun,
    orphanedPaths,
    errors,
  }
}
