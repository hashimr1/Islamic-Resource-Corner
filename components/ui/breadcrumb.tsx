'use client'

import * as React from 'react'
import { ChevronRight } from 'lucide-react'

import { cn } from '@/lib/utils'

const Breadcrumb = ({ className, ...props }: React.ComponentProps<'nav'>) => (
  <nav
    aria-label="breadcrumb"
    className={cn('w-full overflow-hidden text-sm text-muted-foreground', className)}
    {...props}
  />
)
Breadcrumb.displayName = 'Breadcrumb'

const BreadcrumbList = ({ className, ...props }: React.ComponentProps<'ol'>) => (
  <ol className={cn('flex items-center space-x-1 md:space-x-2', className)} {...props} />
)
BreadcrumbList.displayName = 'BreadcrumbList'

const BreadcrumbItem = ({ className, ...props }: React.ComponentProps<'li'>) => (
  <li className={cn('inline-flex items-center', className)} {...props} />
)
BreadcrumbItem.displayName = 'BreadcrumbItem'

const BreadcrumbLink = ({
  className,
  ...props
}: React.ComponentProps<'a'> & { asChild?: boolean }) => (
  <a
    className={cn(
      'transition-colors hover:text-foreground text-muted-foreground inline-flex items-center',
      className
    )}
    {...props}
  />
)
BreadcrumbLink.displayName = 'BreadcrumbLink'

const BreadcrumbPage = ({ className, ...props }: React.ComponentProps<'span'>) => (
  <span className={cn('font-semibold text-foreground', className)} aria-current="page" {...props} />
)
BreadcrumbPage.displayName = 'BreadcrumbPage'

const BreadcrumbSeparator = ({
  className,
  children,
  ...props
}: React.ComponentProps<'li'> & { children?: React.ReactNode }) => (
  <li role="presentation" className={cn('flex items-center text-muted-foreground', className)} {...props}>
    {children ?? <ChevronRight className="h-4 w-4" />}
  </li>
)
BreadcrumbSeparator.displayName = 'BreadcrumbSeparator'

export {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
}

