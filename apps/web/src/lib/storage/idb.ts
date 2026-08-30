import { MotionStudioError } from '@motion-studio/utils'

/**
 * The whole IndexedDB surface this app uses — STATE_MANAGEMENT.md § Persistence. Hand-rolled rather
 * than `idb-keyval`, because the used API is `open`, `get`, `put`, `delete` and `getAllKeys`, and
 * wrapping five calls is less code than the dependency would be to justify.
 */
export const DB_NAME = 'motion-studio'
export const DB_VERSION = 1

export const STORES = { documents: 'documents', snapshots: 'snapshots' } as const

export type StoreName = (typeof STORES)[keyof typeof STORES]

export const STORAGE_CODES = {
  unavailable: 'STORAGE_UNAVAILABLE',
  readFailed: 'STORAGE_READ_FAILED',
  writeFailed: 'STORAGE_WRITE_FAILED',
} as const

export type StorageCode = (typeof STORAGE_CODES)[keyof typeof STORAGE_CODES]

export class StorageError extends MotionStudioError {
  constructor(code: StorageCode, message: string, cause?: unknown) {
    super(message, code, cause)
  }
}

/** A private window refuses the database outright, and that is a state the studio still opens in. */
export const isQuotaError = (error: unknown): boolean =>
  error instanceof DOMException &&
  (error.name === 'QuotaExceededError' || error.name === 'NS_ERROR_DOM_QUOTA_REACHED')

let connection: Promise<IDBDatabase> | null = null

export function openDatabase(): Promise<IDBDatabase> {
  connection ??= new Promise<IDBDatabase>((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new StorageError(STORAGE_CODES.unavailable, 'This browser has no IndexedDB'))

      return
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onupgradeneeded = () => {
      for (const name of Object.values(STORES)) {
        if (!request.result.objectStoreNames.contains(name)) {
          request.result.createObjectStore(name)
        }
      }
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () =>
      reject(new StorageError(STORAGE_CODES.unavailable, 'Storage is not available', request.error))
  })

  return connection
}

/** Tests and the "clear storage" path need the next `openDatabase` to reconnect rather than reuse. */
export function closeDatabase(): void {
  const open = connection

  connection = null
  void open?.then((database) => database.close()).catch(() => undefined)
}

/**
 * Settles on the **transaction**, not on the request. A quota failure arrives as an abort after the
 * request has already reported success, so resolving early would report a write that did not happen —
 * which is the one failure PRODUCT.md § 10 calls unacceptable.
 */
async function run<T>(
  store: StoreName,
  mode: IDBTransactionMode,
  action: (source: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
  const database = await openDatabase()

  return new Promise<T>((resolve, reject) => {
    const code = mode === 'readonly' ? STORAGE_CODES.readFailed : STORAGE_CODES.writeFailed
    const transaction = database.transaction(store, mode)
    const request = action(transaction.objectStore(store))
    const fail = (cause: unknown): void =>
      reject(new StorageError(code, `Could not ${mode === 'readonly' ? 'read' : 'write'}`, cause))

    request.onerror = () => fail(request.error)
    transaction.onabort = () => fail(transaction.error ?? request.error)
    transaction.oncomplete = () => resolve(request.result)
  })
}

export const get = <T>(store: StoreName, key: string): Promise<T | undefined> =>
  run<T | undefined>(store, 'readonly', (source) => source.get(key) as IDBRequest<T | undefined>)

export const put = (store: StoreName, key: string, value: unknown): Promise<void> =>
  run(store, 'readwrite', (source) => source.put(value, key)).then(() => undefined)

export const remove = (store: StoreName, key: string): Promise<void> =>
  run(store, 'readwrite', (source) => source.delete(key)).then(() => undefined)

export const keys = (store: StoreName): Promise<readonly string[]> =>
  run(store, 'readonly', (source) => source.getAllKeys()).then((found) => found.map(String))
