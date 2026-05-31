import { api } from './client.js';

export async function fetchSchedules() {
  const data = await api.get('/schedules');
  return data.schedules;
}

export async function createSchedule(schedule) {
  const data = await api.post('/schedules', schedule);
  return data.schedule;
}

export async function updateSchedule(id, updates) {
  const data = await api.put(`/schedules/${id}`, updates);
  return data.schedule;
}

export async function deleteSchedule(id) {
  await api.delete(`/schedules/${id}`);
}

export async function syncSchedules(schedules) {
  const data = await api.post('/schedules/sync', { schedules });
  return data.schedules;
}
