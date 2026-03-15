const configuredApiOrigin = (import.meta.env.VITE_API_URL || '').replace(/\/+$/, '')
const fallbackApiOrigin = import.meta.env.DEV ? 'http://localhost:5001' : ''
const BASE = `${configuredApiOrigin || fallbackApiOrigin}/api`

export async function getChallenges() {
  const res = await fetch(`${BASE}/challenges`)
  if (!res.ok) throw new Error('Failed to fetch challenges')
  return res.json()
}

export async function getChallenge(id) {
  const res = await fetch(`${BASE}/challenges/${id}`)
  if (!res.ok) throw new Error('Failed to fetch challenge')
  return res.json()
}

export async function login(username, password) {
  const res = await fetch(`${BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  })
  if (!res.ok) throw new Error('Invalid credentials')
  return res.json()
}

function authHeaders() {
  const token = localStorage.getItem('admin_token')
  return { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }
}

export async function createChallenge(data) {
  const res = await fetch(`${BASE}/challenges`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error('Failed to create challenge')
  return res.json()
}

export async function updateChallenge(id, data) {
  const res = await fetch(`${BASE}/challenges/${id}`, {
    method: 'PUT',
    headers: authHeaders(),
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error('Failed to update challenge')
  return res.json()
}

export async function deleteChallenge(id) {
  const res = await fetch(`${BASE}/challenges/${id}`, {
    method: 'DELETE',
    headers: authHeaders(),
  })
  if (!res.ok) throw new Error('Failed to delete challenge')
}
