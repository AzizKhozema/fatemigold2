'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from './supabase_client'

type QueuedAction = {
  id: string
  action_type: 'task_start' | 'task_done' | 'task_note'
  payload: Record<string, unknown>
  created_at: string
}

const DB_NAME    = 'fatemi_offline'
const STORE_NAME = 'sync_queue'

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1)
    req.onupgradeneeded = () => {
      req.result.createObjectStore(STORE_NAME, { keyPath: 'id' })
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror   = () => reject(req.error)
  })
}

async function saveToQueue(action: QueuedAction) {
  const db    = await openDB()
  const tx    = db.transaction(STORE_NAME, 'readwrite')
  const store = tx.objectStore(STORE_NAME)
  store.put(action)
}

async function getAllQueued(): Promise<QueuedAction[]> {
  const db    = await openDB()
  const tx    = db.transaction(STORE_NAME, 'readonly')
  const store = tx.objectStore(STORE_NAME)
  return new Promise((resolve, reject) => {
    const req = store.getAll()
    req.onsuccess = () => resolve(req.result)
    req.onerror   = () => reject(req.error)
  })
}

async function removeFromQueue(id: string) {
  const db    = await openDB()
  const tx    = db.transaction(STORE_NAME, 'readwrite')
  const store = tx.objectStore(STORE_NAME)
  store.delete(id)
}

export function useOfflineSync() {
  const [isOnline, setIsOnline]   = useState(true)
  const [syncing, setSyncing]     = useState(false)
  const [queueSize, setQueueSize] = useState(0)

  useEffect(() => {
    setIsOnline(navigator.onLine)
    const onOnline  = () => setIsOnline(true)
    const onOffline = () => setIsOnline(false)
    window.addEventListener('online',  onOnline)
    window.addEventListener('offline', onOffline)
    return () => {
      window.removeEventListener('online',  onOnline)
      window.removeEventListener('offline', onOffline)
    }
  }, [])

  const checkQueue = useCallback(async () => {
    try {
      const items = await getAllQueued()
      setQueueSize(items.length)
    } catch {}
  }, [])

  useEffect(() => { checkQueue() }, [checkQueue])

  const queueAction = useCallback(async (
    action_type: QueuedAction['action_type'],
    payload: Record<string, unknown>
  ) => {
    const action: QueuedAction = {
      id:          crypto.randomUUID(),
      action_type,
      payload,
      created_at:  new Date().toISOString(),
    }
    await saveToQueue(action)
    await checkQueue()
    return action
  }, [checkQueue])

  const syncNow = useCallback(async () => {
    if (!isOnline || syncing) return
    setSyncing(true)
    try {
      const items = await getAllQueued()
      for (const item of items) {
        try {
          if (item.action_type === 'task_start') {
            await supabase
              .from('production_tasks')
              .update({ status: 'in_progress', started_at: item.payload.started_at })
              .eq('id', item.payload.task_id)
          } else if (item.action_type === 'task_done') {
            await supabase
              .from('production_tasks')
              .update({ status: 'done', done_at: item.payload.done_at })
              .eq('id', item.payload.task_id)
          }
          await removeFromQueue(item.id)
        } catch {}
      }
      await checkQueue()
    } finally {
      setSyncing(false)
    }
  }, [isOnline, syncing, checkQueue])

  useEffect(() => {
    if (isOnline && queueSize > 0) syncNow()
  }, [isOnline, queueSize])

  return { isOnline, syncing, queueSize, queueAction, syncNow }
}