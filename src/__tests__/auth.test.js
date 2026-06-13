import { describe, it, expect, beforeEach } from 'vitest'
import { ref, computed, nextTick } from 'vue'

// 模拟 auth 模块的核心逻辑
function createAuthState() {
  const currentUser = ref(null)
  const tokenStore = ref(null)

  const api = {
    getToken: () => tokenStore.value,
    setToken: (t) => { tokenStore.value = t },
    clearToken: () => { tokenStore.value = null },
  }

  const isLoggedIn = computed(() => !!currentUser.value || !!api.getToken())

  function login(user, token) {
    currentUser.value = user
    api.setToken(token)
  }

  function logout() {
    currentUser.value = null
    api.clearToken()
  }

  return { currentUser, isLoggedIn, login, logout, api }
}

describe('isLoggedIn 响应式状态', () => {
  let auth

  beforeEach(() => {
    auth = createAuthState()
  })

  it('初始状态为未登录', () => {
    expect(auth.isLoggedIn.value).toBe(false)
  })

  it('登录后 isLoggedIn 自动变为 true', () => {
    auth.login({ username: 'test' }, 'token-123')
    expect(auth.isLoggedIn.value).toBe(true)
  })

  it('登出后 isLoggedIn 自动变为 false', () => {
    auth.login({ username: 'test' }, 'token-123')
    auth.logout()
    expect(auth.isLoggedIn.value).toBe(false)
  })

  it('只有 token 没有 user 也算已登录', () => {
    auth.api.setToken('token-only')
    expect(auth.isLoggedIn.value).toBe(true)
  })

  it('只有 user 没有 token 也算已登录', () => {
    auth.currentUser.value = { username: 'test' }
    expect(auth.isLoggedIn.value).toBe(true)
  })

  it('响应式：修改 token 后 computed 自动更新', async () => {
    expect(auth.isLoggedIn.value).toBe(false)
    auth.api.setToken('new-token')
    await nextTick()
    expect(auth.isLoggedIn.value).toBe(true)
    auth.api.clearToken()
    await nextTick()
    expect(auth.isLoggedIn.value).toBe(false)
  })
})
