'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useClinic } from '@/hooks/use-clinic'
import { useAuth } from '@/lib/auth/auth-context'
import {
  Calendar,
  Clock,
  Users,
  FileText,
  TrendingUp,
  CalendarDays,
  Stethoscope,
  ArrowRight,
} from 'lucide-react'
import { format } from 'date-fns'

type AnalyticsData = {
  stats: {
    total_patients: number
    todays_appointments: number
    week_appointments: number
    total_consultations: number
  }
  status_breakdown: {
    scheduled: number
    confirmed: number
    completed: number
    cancelled: number
  }
  upcoming_appointments: Array<{
    id: string
    appointment_date: string
    start_time: string
    end_time: string
    status: string
    patient: { first_name: string; last_name: string; phone: string }
    service: { name: string; duration_minutes: number }
  }>
}

export default function DoctorDashboard() {
  const { clinic, loading: clinicLoading } = useClinic()
  const { profile } = useAuth()
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [analyticsLoading, setAnalyticsLoading] = useState(true)

  useEffect(() => {
    if (clinic?.id && profile?.id) {
      loadAnalytics()
    }
  }, [clinic?.id, profile?.id])

  const loadAnalytics = async () => {
    if (!clinic?.id || !profile?.id) return

    try {
      const response = await fetch(`/api/analytics/doctor?clinic_id=${clinic.id}&doctor_id=${profile.id}`)
      const data = await response.json()

      if (response.ok) {
        setAnalytics(data)
      }
    } catch (error) {
      console.error('Error loading analytics:', error)
    } finally {
      setAnalyticsLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled':
        return 'bg-blue-100 text-blue-800'
      case 'confirmed':
        return 'bg-green-100 text-green-800'
      case 'completed':
        return 'bg-neutral-100 text-neutral-800'
      case 'cancelled':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-neutral-100 text-neutral-800'
    }
  }

  if (clinicLoading || !clinic || !profile) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-neutral-600">Loading...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        <p className="text-neutral-600">Welcome back, Dr. {profile.full_name}</p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-blue-900">Patients Seen</CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-900">
              {analyticsLoading ? '...' : analytics?.stats.total_patients || 0}
            </div>
            <p className="text-xs text-blue-700 mt-1">Unique patients</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-green-900">Today's Schedule</CardTitle>
            <Calendar className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-900">
              {analyticsLoading ? '...' : analytics?.stats.todays_appointments || 0}
            </div>
            <p className="text-xs text-green-700 mt-1">Appointments today</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-purple-900">This Week</CardTitle>
            <CalendarDays className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-900">
              {analyticsLoading ? '...' : analytics?.stats.week_appointments || 0}
            </div>
            <p className="text-xs text-purple-700 mt-1">Appointments this week</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-orange-900">Consultations</CardTitle>
            <FileText className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-900">
              {analyticsLoading ? '...' : analytics?.stats.total_consultations || 0}
            </div>
            <p className="text-xs text-orange-700 mt-1">Total consultations</p>
          </CardContent>
        </Card>
      </div>

      {/* Status Breakdown & Upcoming Appointments */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Appointment Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Appointment Status
            </CardTitle>
            <CardDescription>Your upcoming appointments breakdown</CardDescription>
          </CardHeader>
          <CardContent>
            {analyticsLoading ? (
              <div className="text-sm text-neutral-600">Loading...</div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-blue-500" />
                    <span className="text-sm">Scheduled</span>
                  </div>
                  <span className="text-sm font-semibold">
                    {analytics?.status_breakdown.scheduled || 0}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-green-500" />
                    <span className="text-sm">Confirmed</span>
                  </div>
                  <span className="text-sm font-semibold">
                    {analytics?.status_breakdown.confirmed || 0}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-neutral-500" />
                    <span className="text-sm">Completed</span>
                  </div>
                  <span className="text-sm font-semibold">
                    {analytics?.status_breakdown.completed || 0}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-red-500" />
                    <span className="text-sm">Cancelled</span>
                  </div>
                  <span className="text-sm font-semibold">
                    {analytics?.status_breakdown.cancelled || 0}
                  </span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Upcoming Appointments */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Upcoming Appointments
            </CardTitle>
            <CardDescription>Your next scheduled appointments</CardDescription>
          </CardHeader>
          <CardContent>
            {analyticsLoading ? (
              <div className="text-sm text-neutral-600">Loading...</div>
            ) : analytics?.upcoming_appointments.length === 0 ? (
              <div className="text-sm text-neutral-600">No upcoming appointments</div>
            ) : (
              <div className="space-y-3">
                {analytics?.upcoming_appointments.map((apt) => (
                  <div key={apt.id} className="flex items-center justify-between text-sm">
                    <div>
                      <div className="font-medium">
                        {apt.patient.first_name} {apt.patient.last_name}
                      </div>
                      <div className="text-xs text-neutral-500">
                        {format(new Date(apt.appointment_date), 'MMM dd')} •{' '}
                        {format(new Date(`2000-01-01T${apt.start_time}`), 'h:mm a')}
                      </div>
                    </div>
                    <Badge className={getStatusColor(apt.status)} variant="secondary">
                      {apt.status}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Access your key workflows</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-3">
            <Link href="/doctor/schedule">
              <Button variant="outline" className="w-full justify-start h-auto py-4">
                <Calendar className="h-5 w-5 mr-3" />
                <div className="text-left">
                  <div className="font-medium">My Schedule</div>
                  <div className="text-xs text-neutral-500">View appointments</div>
                </div>
                <ArrowRight className="h-4 w-4 ml-auto" />
              </Button>
            </Link>

            <Link href="/doctor/patients">
              <Button variant="outline" className="w-full justify-start h-auto py-4">
                <Users className="h-5 w-5 mr-3" />
                <div className="text-left">
                  <div className="font-medium">Patients</div>
                  <div className="text-xs text-neutral-500">Manage patient records</div>
                </div>
                <ArrowRight className="h-4 w-4 ml-auto" />
              </Button>
            </Link>

            <Link href="/doctor/consultations">
              <Button variant="outline" className="w-full justify-start h-auto py-4">
                <Stethoscope className="h-5 w-5 mr-3" />
                <div className="text-left">
                  <div className="font-medium">Consultations</div>
                  <div className="text-xs text-neutral-500">View medical notes</div>
                </div>
                <ArrowRight className="h-4 w-4 ml-auto" />
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
