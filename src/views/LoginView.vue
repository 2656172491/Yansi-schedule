<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { login, register } from '../api/auth.js'

const router = useRouter()
const isLogin = ref(true)
const loading = ref(false)
const error = ref('')

const form = reactive({
  username: '',
  password: '',
  email: '',
})

async function handleSubmit() {
  if (!form.username || !form.password) {
    error.value = '请填写用户名和密码'
    return
  }

  loading.value = true
  error.value = ''

  try {
    if (isLogin.value) {
      await login(form.username, form.password)
      router.push('/')
    } else {
      await register(form.username, form.password, form.email || undefined)
      // 注册成功后切换到登录模式，不自动登录
      isLogin.value = true
      form.password = ''
      error.value = ''
      alert('注册成功，请登录')
    }
  } catch (err) {
    error.value = err.message
  } finally {
    loading.value = false
  }
}

function toggleMode() {
  isLogin.value = !isLogin.value
  error.value = ''
}
</script>

<template>
  <div class="login-page min-h-screen flex items-center justify-center px-4">
    <div class="login-card w-full max-w-sm rounded-[32px] border border-[var(--line)] bg-white/80 p-8 shadow-lg backdrop-blur">
      <div class="text-center mb-8">
        <h1 class="display-serif text-3xl text-[var(--ink)]">言寺日程</h1>
        <p class="mt-2 text-sm text-[var(--muted)]">
          {{ isLogin ? '登录以同步您的日程' : '注册新账号' }}
        </p>
      </div>

      <form @submit.prevent="handleSubmit" class="space-y-4">
        <div>
          <input
            v-model="form.username"
            type="text"
            placeholder="用户名"
            class="w-full rounded-[20px] border border-[var(--line)] px-4 py-3 text-sm outline-none transition focus:border-[var(--accent)] focus:bg-white"
            :disabled="loading"
          />
        </div>

        <div v-if="!isLogin">
          <input
            v-model="form.email"
            type="email"
            placeholder="邮箱（可选）"
            class="w-full rounded-[20px] border border-[var(--line)] px-4 py-3 text-sm outline-none transition focus:border-[var(--accent)] focus:bg-white"
            :disabled="loading"
          />
        </div>

        <div>
          <input
            v-model="form.password"
            type="password"
            placeholder="密码"
            class="w-full rounded-[20px] border border-[var(--line)] px-4 py-3 text-sm outline-none transition focus:border-[var(--accent)] focus:bg-white"
            :disabled="loading"
          />
        </div>

        <div v-if="error" class="rounded-[16px] border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-600">
          {{ error }}
        </div>

        <button
          type="submit"
          class="w-full rounded-full bg-[var(--accent-deep)] py-3 text-sm font-semibold text-[#fff6ef] transition hover:bg-[var(--accent)] disabled:opacity-50"
          :disabled="loading"
        >
          {{ loading ? '处理中...' : (isLogin ? '登录' : '注册') }}
        </button>
      </form>

      <div class="mt-6 text-center">
        <button
          type="button"
          class="text-sm text-[var(--muted)] hover:text-[var(--accent-deep)]"
          @click="toggleMode"
        >
          {{ isLogin ? '没有账号？点击注册' : '已有账号？点击登录' }}
        </button>
      </div>

      <div class="mt-4 text-center">
        <button
          type="button"
          class="text-xs text-[var(--muted)] hover:text-[var(--accent-deep)]"
          @click="router.push('/')"
        >
          跳过，使用本地模式
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.login-page {
  background: linear-gradient(135deg, var(--bg) 0%, var(--bg-alt) 100%);
}
</style>
