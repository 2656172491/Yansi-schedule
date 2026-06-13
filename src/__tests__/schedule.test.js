import { describe, it, expect, beforeEach } from 'vitest'

// 提取 generateId 逻辑用于测试
function generateId() {
  if (crypto.randomUUID) return crypto.randomUUID()
  console.warn('[schedule] crypto.randomUUID 不可用，使用 Math.random 回退')
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = Math.random() * 16 | 0
    return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16)
  })
}

describe('generateId', () => {
  it('生成合法的 UUID v4 格式', () => {
    const id = generateId()
    // UUID v4 格式: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
    expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/)
  })

  it('每次生成不同的 ID', () => {
    const ids = new Set()
    for (let i = 0; i < 100; i++) {
      ids.add(generateId())
    }
    expect(ids.size).toBe(100)
  })
})
