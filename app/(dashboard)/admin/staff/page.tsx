'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useClinic } from '@/hooks/use-clinic'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

type StaffMember = {
  id: string
  user_id: string
  role: 'admin' | 'doctor' | 'receptionist'
  created_at: string
  profile: {
    full_name: string
    email: string
    phone: string | null
  }
}

export default function StaffManagementPage() {
  const router = useRouter()
  const { clinic, loading: clinicLoading } = useClinic()
  const [staff, setStaff] = useState<StaffMember[]>([])
  const [loading, setLoading] = useState(true)
  const [isInviteOpen, setIsInviteOpen] = useState(false)
  const [inviteLoading, setInviteLoading] = useState(false)
  const [inviteError, setInviteError] = useState<string | null>(null)

  // Invite form state
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteName, setInviteName] = useState('')
  const [invitePhone, setInvitePhone] = useState('')
  const [inviteRole, setInviteRole] = useState<'doctor' | 'receptionist'>('doctor')
  const [invitePassword, setInvitePassword] = useState('')

  const fetchStaff = async () => {
    if (!clinic) return

    try {
      const response = await fetch(`/api/staff?clinic_id=${clinic.id}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch staff')
      }

      // Map staff data to match expected structure
      const staffData = (data.staff || []).map((member: any) => ({
        id: member.id,
        user_id: member.user_id,
        role: member.role,
        created_at: member.created_at,
        profile: {
          full_name: member.full_name || 'N/A',
          email: member.email || 'N/A',
          phone: member.phone || null,
        },
      }))

      setStaff(staffData as StaffMember[])
    } catch (error) {
      console.error('Error fetching staff:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (clinic) {
      fetchStaff()
    }
  }, [clinic])

  const handleInviteStaff = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!clinic) return

    setInviteLoading(true)
    setInviteError(null)

    try {
      // Call API route to invite staff
      const response = await fetch('/api/staff/invite', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: inviteEmail,
          password: invitePassword,
          full_name: inviteName,
          phone: invitePhone,
          role: inviteRole,
          clinic_id: clinic.id,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to invite staff')
      }

      // Success - close dialog and refresh
      setIsInviteOpen(false)
      setInviteEmail('')
      setInviteName('')
      setInvitePhone('')
      setInvitePassword('')
      setInviteRole('doctor')
      fetchStaff()
    } catch (err: any) {
      setInviteError(err.message || 'An error occurred while inviting staff')
    } finally {
      setInviteLoading(false)
    }
  }

  const handleRemoveStaff = async (staffId: string, userId: string) => {
    if (!confirm('Are you sure you want to remove this staff member?')) return

    try {
      const response = await fetch(`/api/staff/${staffId}`, {
        method: 'DELETE',
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to remove staff member')
      }

      // Refresh list
      fetchStaff()
    } catch (error: any) {
      alert(error.message || 'Failed to remove staff member')
    }
  }

  if (clinicLoading || !clinic) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-neutral-600">Loading...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Staff Management</h2>
            <p className="text-neutral-600">Manage your clinic staff members</p>
          </div>
          <div className="flex gap-2">
            <Dialog open={isInviteOpen} onOpenChange={setIsInviteOpen}>
              <DialogTrigger asChild>
                <Button>Invite Staff</Button>
              </DialogTrigger>
              <DialogContent>
                <form onSubmit={handleInviteStaff}>
                  <DialogHeader>
                    <DialogTitle>Invite Staff Member</DialogTitle>
                    <DialogDescription>
                      Add a new staff member to your clinic
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label htmlFor="name">Full Name</Label>
                      <Input
                        id="name"
                        value={inviteName}
                        onChange={(e) => setInviteName(e.target.value)}
                        required
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={inviteEmail}
                        onChange={(e) => setInviteEmail(e.target.value)}
                        required
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="phone">Phone</Label>
                      <Input
                        id="phone"
                        type="tel"
                        value={invitePhone}
                        onChange={(e) => setInvitePhone(e.target.value)}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="password">Temporary Password</Label>
                      <Input
                        id="password"
                        type="password"
                        value={invitePassword}
                        onChange={(e) => setInvitePassword(e.target.value)}
                        required
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="role">Role</Label>
                      <Select value={inviteRole} onValueChange={(value: any) => setInviteRole(value)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="doctor">Doctor</SelectItem>
                          <SelectItem value="receptionist">Receptionist</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    {inviteError && (
                      <div className="text-sm text-red-500 bg-red-50 p-3 rounded-md">
                        {inviteError}
                      </div>
                    )}
                  </div>
                  <DialogFooter>
                    <Button type="submit" disabled={inviteLoading}>
                      {inviteLoading ? 'Inviting...' : 'Invite Staff'}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
            <Button variant="outline" onClick={() => router.back()}>
              Back
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Staff Members</CardTitle>
            <CardDescription>
              View and manage all staff members in your clinic
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8 text-neutral-600">Loading staff...</div>
            ) : staff.length === 0 ? (
              <div className="text-center py-8 text-neutral-600">
                No staff members yet. Invite your first staff member!
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {staff.map((member) => (
                    <TableRow key={member.id}>
                      <TableCell className="font-medium">
                        {member.profile.full_name}
                      </TableCell>
                      <TableCell>{member.profile.email}</TableCell>
                      <TableCell>{member.profile.phone || 'N/A'}</TableCell>
                      <TableCell>
                        <Badge variant={member.role === 'admin' ? 'default' : 'secondary'}>
                          {member.role}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {member.role !== 'admin' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveStaff(member.id, member.user_id)}
                          >
                            Remove
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
  )
}
