import { keccak256, stringToHex } from 'viem'

export const clamp = (value: number, min: number, max: number): number =>
  Math.max(min, Math.min(max, value))

export const round = (value: number, decimals = 8): number => {
  const factor = 10 ** decimals
  return Math.round(value * factor) / factor
}

const normalizeForHash = (value: unknown): unknown => {
  if (typeof value === 'number') return round(value, 8)
  if (typeof value === 'bigint') return value.toString()
  if (Array.isArray(value)) return value.map(normalizeForHash)

  if (value && typeof value === 'object') {
    const output: Record<string, unknown> = {}
    const entries = Object.entries(value as Record<string, unknown>).sort(([a], [b]) =>
      a.localeCompare(b),
    )

    for (const [key, item] of entries) {
      output[key] = normalizeForHash(item)
    }

    return output
  }

  return value
}

export const stableStringify = (value: unknown): string => JSON.stringify(normalizeForHash(value))

export const digestObject = <T>(value: T): `0x${string}` => keccak256(stringToHex(stableStringify(value)))
