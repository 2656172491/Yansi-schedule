import { api } from './client.js';
import { ref, computed } from 'vue';

const currentUser = ref(null);

// 响应式登录状态：currentUser 或 token 存在即为已登录
export const isLoggedIn = computed(() => !!currentUser.value || !!api.getToken());

export async function register(username, password, email) {
  const data = await api.post('/auth/register', { username, password, email });
  // 注册后不自动登录，只返回数据
  return data;
}

export async function login(username, password) {
  const data = await api.post('/auth/login', { username, password });
  api.setToken(data.token);
  currentUser.value = data.user;
  return data;
}

export async function getMe() {
  const data = await api.get('/auth/me');
  currentUser.value = data.user;
  return data;
}

export function logout() {
  api.clearToken();
  currentUser.value = null;
}

export function getCurrentUser() {
  return currentUser.value;
}

// 初始化时尝试获取用户信息
export async function initAuth() {
  if (isLoggedIn()) {
    try {
      await getMe();
    } catch (err) {
      // token 无效，清除
      logout();
    }
  }
}
