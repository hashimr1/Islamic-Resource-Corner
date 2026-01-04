import Link from 'next/link'
import { redirect } from 'next/navigation'
import {
  Upload,
  FileText,
  Download,
  Clock,
  MoreHorizontal,
  Eye,
  Pencil,
  Trash2,
} from 'lucide-react'
import { getCurrentUser } from '@/lib/actions/auth'
import { getUserResources } from '@/lib/actions/resources'
import { deleteResource } from './actions'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { formatDate } from '@/lib/utils'

export default async function DashboardPage() {
  const userData = (await getCurrentUser()) as any

  if (!userData) {
    redirect('/auth/login')
  }

  const resources = (await getUserResources(userData.user.id)) as any[]

  const profile = userData.profile || {}
  const fullName = [profile.first_name, profile.last_name].filter(Boolean).join(' ').trim()
  const displayName = fullName || profile.first_name || 'Contributor'

  const stats = {
    total: resources.length,
    approved: resources.filter((r: any) => r.status === 'approved').length,
    pending: resources.filter((r: any) => r.status === 'pending').length,
    rejected: resources.filter((r: any) => r.status === 'rejected').length,
    totalDownloads: resources
      .filter((r: any) => r.status === 'approved')
      .reduce((sum: number, r: any) => sum + r.downloads, 0),
  }

  return (
    <div className="container py-8 max-w-6xl">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">
            Welcome back, {displayName}!
          </h1>
          <p className="text-muted-foreground">
            Manage your uploaded resources and track your contributions to the
            community.
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Resources
              </CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
              <p className="text-xs text-muted-foreground">
                {stats.approved} approved
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.pending}</div>
              <p className="text-xs text-muted-foreground">
                Awaiting approval
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Downloads</CardTitle>
              <Download className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalDownloads}</div>
              <p className="text-xs text-muted-foreground">
                From approved resources
              </p>
            </CardContent>
          </Card>

          <Card className="bg-primary/5">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Quick Action
              </CardTitle>
              <Upload className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <Button asChild className="w-full mt-2">
                <Link href="/dashboard/upload">
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Resource
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Resources List */}
        <Card>
          <CardHeader>
            <CardTitle>Your Resources</CardTitle>
            <CardDescription>View and manage all your uploaded resources</CardDescription>
          </CardHeader>
          <CardContent>
            {resources.length === 0 ? (
              <div className="text-center py-12">
                <Upload className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">
                  No resources yet
                </h3>
                <p className="text-muted-foreground mb-4">
                  Start contributing by uploading your first Islamic educational
                  resource.
                </p>
                <Button asChild>
                  <Link href="/dashboard/upload">Upload Your First Resource</Link>
                </Button>
              </div>
            ) : (
              <div className="rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Resource</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {resources.map((resource) => {
                      const statusVariant =
                        resource.status === 'approved'
                          ? 'default'
                          : resource.status === 'pending'
                          ? 'secondary'
                          : 'destructive'

                      const canEdit = resource.status === 'pending'
                      const canDelete =
                        resource.status === 'pending' || resource.status === 'rejected'

                      return (
                        <TableRow key={resource.id}>
                          <TableCell className="space-y-1">
                            <div className="font-semibold leading-tight">{resource.title}</div>
                            <p className="text-sm text-muted-foreground line-clamp-2">
                              {resource.short_description || resource.description || 'No description'}
                            </p>
                            <div className="text-xs text-muted-foreground">
                              Uploaded {formatDate(resource.created_at)}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={statusVariant} className="capitalize">
                              {resource.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreHorizontal className="h-4 w-4" />
                                  <span className="sr-only">Open actions</span>
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                <DropdownMenuItem asChild>
                                  <Link href={`/resource/${resource.id}`} className="flex items-center gap-2">
                                    <Eye className="h-4 w-4" />
                                    View
                                  </Link>
                                </DropdownMenuItem>
                                {canEdit && (
                                  <DropdownMenuItem asChild>
                                    <Link
                                      href={`/dashboard/upload?edit=${resource.id}`}
                                      className="flex items-center gap-2"
                                    >
                                      <Pencil className="h-4 w-4" />
                                      Edit
                                    </Link>
                                  </DropdownMenuItem>
                                )}
                                {canDelete && (
                                  <>
                                    <DropdownMenuSeparator />
                                    <AlertDialog>
                                      <AlertDialogTrigger asChild>
                                        <DropdownMenuItem
                                          className="text-destructive focus:text-destructive flex items-center gap-2"
                                        >
                                          <Trash2 className="h-4 w-4" />
                                          Delete
                                        </DropdownMenuItem>
                                      </AlertDialogTrigger>
                                      <AlertDialogContent>
                                        <AlertDialogHeader>
                                          <AlertDialogTitle>Delete this resource?</AlertDialogTitle>
                                          <AlertDialogDescription>
                                            This action permanently removes the resource. You can only delete
                                            pending or rejected submissions.
                                          </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                                          <form action={deleteResource.bind(null, resource.id)}>
                                            <Button variant="destructive" type="submit">
                                              Confirm Delete
                                            </Button>
                                          </form>
                                        </AlertDialogFooter>
                                      </AlertDialogContent>
                                    </AlertDialog>
                                  </>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
    </div>
  )
}

