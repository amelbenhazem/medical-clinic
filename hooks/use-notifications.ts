import { useState, useEffect, useCallback } from 'react'

type Notification = {
  id: string
  user_id: string
  title: string
  message: string
  type: string
  related_id: string | null
  is_read: boolean
  created_at: string
  read_at: string | null
}

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)

  const fetchNotifications = useCallback(async () => {
    try {
      const response = await fetch('/api/notifications?limit=20')
      const data = await response.json()
      if (response.ok) {
        setNotifications(data.notifications || [])
      }
    } catch (error) {
      console.error('Error fetching notifications:', error)
    }
  }, [])

  const fetchUnreadCount = useCallback(async () => {
    try {
      const response = await fetch('/api/notifications/unread-count')
      const data = await response.json()
      if (response.ok) {
        setUnreadCount(data.count || 0)
      }
    } catch (error) {
      console.error('Error fetching unread count:', error)
    }
  }, [])

  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      const response = await fetch(`/api/notifications/${notificationId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ is_read: true }),
      })

      if (response.ok) {
        // Update local state
        setNotifications(prev =>
          prev.map(n =>
            n.id === notificationId ? { ...n, is_read: true, read_at: new Date().toISOString() } : n
          )
        )
        setUnreadCount(prev => Math.max(0, prev - 1))
      }
    } catch (error) {
      console.error('Error marking notification as read:', error)
    }
  }, [])

  const markAllAsRead = useCallback(async () => {
    try {
      const response = await fetch('/api/notifications/mark-all-read', {
        method: 'POST',
      })

      if (response.ok) {
        // Update local state
        setNotifications(prev =>
          prev.map(n => ({ ...n, is_read: true, read_at: new Date().toISOString() }))
        )
        setUnreadCount(0)
      }
    } catch (error) {
      console.error('Error marking all as read:', error)
    }
  }, [])

  const deleteNotification = useCallback(async (notificationId: string) => {
    try {
      const response = await fetch(`/api/notifications/${notificationId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        // Update local state
        const notification = notifications.find(n => n.id === notificationId)
        setNotifications(prev => prev.filter(n => n.id !== notificationId))
        if (notification && !notification.is_read) {
          setUnreadCount(prev => Math.max(0, prev - 1))
        }
      }
    } catch (error) {
      console.error('Error deleting notification:', error)
    }
  }, [notifications])

  const refresh = useCallback(async () => {
    await Promise.all([fetchNotifications(), fetchUnreadCount()])
  }, [fetchNotifications, fetchUnreadCount])

  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      await Promise.all([fetchNotifications(), fetchUnreadCount()])
      setLoading(false)
    }

    loadData()

    // Refresh every 30 seconds
    const interval = setInterval(fetchUnreadCount, 30000)

    return () => clearInterval(interval)
  }, [fetchNotifications, fetchUnreadCount])

  return {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    refresh,
  }
}
