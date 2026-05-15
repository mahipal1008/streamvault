const store = new Map<string, Buffer>()

export function setKey(jobId: string, key: Buffer): void {
  store.set(jobId, key)
}

export function getKey(jobId: string): Buffer | undefined {
  return store.get(jobId)
}

export function deleteKey(jobId: string): void {
  store.delete(jobId)
}
