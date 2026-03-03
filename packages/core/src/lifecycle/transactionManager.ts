import type { WiqaayaAdapter } from "../adapters/AdapterTypes"

export async function beginTransaction(adapter: WiqaayaAdapter) {
  return adapter.transaction.begin()
}

export async function commitTransaction(
  adapter: WiqaayaAdapter,
  tx: unknown
) {
  await adapter.transaction.commit(tx)
}

export async function rollbackTransaction(
  adapter: WiqaayaAdapter,
  tx: unknown
) {
  await adapter.transaction.rollback(tx)
}