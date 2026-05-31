import dayjs from 'dayjs'

function isTauri() {
  return window.__TAURI_INTERNALS__ !== undefined
}

async function saveFileInTauri(json, filename) {
  try {
    const { save } = await import('@tauri-apps/plugin-dialog')
    const { writeTextFile } = await import('@tauri-apps/plugin-fs')

    const defaultFilename = filename || `schedules-${dayjs().format('YYYY-MM-DD')}.json`

    const filePath = await save({
      defaultPath: defaultFilename,
      filters: [{
        name: 'JSON',
        extensions: ['json']
      }]
    })

    if (filePath) {
      await writeTextFile(filePath, json)
      return { ok: true, json, path: filePath }
    }

    return { ok: false, error: '用户取消' }
  } catch (err) {
    return { ok: false, error: err.message || '导出失败' }
  }
}

function saveFileInBrowser(json, filename) {
  try {
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename || `schedules-${dayjs().format('YYYY-MM-DD')}.json`

    let triggered = false
    const cleanup = () => URL.revokeObjectURL(url)

    a.addEventListener('click', () => { triggered = true }, { once: true })
    a.click()

    setTimeout(() => {
      cleanup()
      if (!triggered) {
        console.warn('[export] download trigger may have been blocked')
      }
    }, 3000)

    return { ok: true, json }
  } catch (err) {
    return { ok: false, error: err.message || '导出失败' }
  }
}

export async function exportSchedules(items, filename) {
  const json = JSON.stringify(items, null, 2)

  if (isTauri()) {
    return await saveFileInTauri(json, filename)
  }

  return saveFileInBrowser(json, filename)
}
