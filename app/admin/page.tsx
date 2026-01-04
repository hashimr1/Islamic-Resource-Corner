import { redirect } from 'next/navigation'
import { format } from 'date-fns'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { approveResource, rejectResource } from './actions'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { Eye, Check, X } from 'lucide-react'
import FeaturedListsManager from '@/components/admin/featured-lists-manager'
import { updateListOrder, deleteFeaturedList } from './actions'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function AdminPage() {
  const supabase = createSupabaseServerClient()

  // Check auth
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/')

  // Check admin role
  const { data: profile } = (await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()) as { data: any; error: any }

  if (!profile || profile.role !== 'admin') {
    redirect('/')
  }

  // Fetch pending resources with uploader info
  const { data: resources } = (await supabase
    .from('resources')
    .select(
      `
        id,
        title,
        status,
        resource_types,
        created_at,
        user_id,
        profiles:user_id (
          email,
          username,
          full_name
        )
      `
    )
    .eq('status', 'pending')
    .order('created_at', { ascending: false })) as { data: any[]; error: any }

  // Counts for stats cards
  const [{ count: pendingCount }, { count: approvedCount }] = await Promise.all([
    supabase.from('resources').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
    supabase.from('resources').select('*', { count: 'exact', head: true }).eq('status', 'approved'),
  ])

  const { count: usersCount } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })

  return (
    <div className="container max-w-7xl mx-auto px-4 py-10 space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <p className="text-muted-foreground">
          Overview of pending resources waiting for approval.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Total Pending</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold">{pendingCount ?? 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Total Approved</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold">{approvedCount ?? 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Total Users</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold">{usersCount ?? 0}</p>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Pending Resources</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[140px]">Date</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Uploader</TableHead>
                <TableHead>Category/Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[200px] text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {resources && resources.length > 0 ? (
                resources.map(resource => (
                  <TableRow key={resource.id}>
                    <TableCell className="text-muted-foreground text-sm">
                      {format(new Date(resource.created_at), 'MMM d, yyyy')}
                    </TableCell>
                    <TableCell className="font-medium">{resource.title}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {resource.profiles?.username ||
                        resource.profiles?.full_name ||
                        resource.profiles?.email ||
                        'Unknown'}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {resource.resource_types?.join(', ') || '—'}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="bg-amber-100 text-amber-800">
                        Pending
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button asChild variant="outline" size="sm">
                          <Link href={`/resource/${resource.id}`}>
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Link>
                        </Button>
                        <form action={approveResource}>
                          <input type="hidden" name="id" value={resource.id} />
                          <Button
                            type="submit"
                            size="sm"
                            className="bg-green-600 text-white hover:bg-green-700"
                          >
                            <Check className="h-4 w-4 mr-1" />
                            Approve
                          </Button>
                        </form>
                        <form action={rejectResource}>
                          <input type="hidden" name="id" value={resource.id} />
                          <Button variant="destructive" type="submit" size="sm">
                            <X className="h-4 w-4 mr-1" />
                            Reject
                          </Button>
                        </form>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    No pending resources.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <FeaturedListsManager onReorder={updateListOrder} onDelete={deleteFeaturedList} />
    </div>
  )
}

