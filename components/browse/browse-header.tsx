'use client'

import { FormEvent, useEffect, useState } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { Search } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

type SortOption = 'newest' | 'oldest' | 'popular'

interface BrowseHeaderProps {
  totalCount: number
  initialQuery?: string
  sort?: SortOption
}

const sortOptions: { value: SortOption; label: string }[] = [
  { value: 'newest', label: 'Newest' },
  { value: 'oldest', label: 'Oldest' },
  { value: 'popular', label: 'Most Popular' },
]

export function BrowseHeader({ totalCount, initialQuery = '', sort = 'newest' }: BrowseHeaderProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const [query, setQuery] = useState(initialQuery)
  const currentSort = (searchParams.get('sort') as SortOption | null) || sort

  useEffect(() => {
    const latest = searchParams.get('q') || ''
    setQuery(latest)
  }, [searchParams])

  const submitSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const params = new URLSearchParams(searchParams.toString())
    const trimmed = query.trim()

    if (trimmed) {
      params.set('q', trimmed)
    } else {
      params.delete('q')
    }

    params.delete('page')
    router.push(`${pathname}?${params.toString()}`)
  }

  const updateSort = (value: SortOption) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('sort', value)
    params.delete('page')
    router.push(`${pathname}?${params.toString()}`)
  }

  return (
    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <span>Showing</span>
        <span className="font-semibold text-foreground">{totalCount}</span>
        <span>results</span>
      </div>

      <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
        <form onSubmit={submitSearch} className="w-full sm:max-w-xl">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={event => setQuery(event.target.value)}
                placeholder="Search by title or description"
                className="pl-9"
              />
            </div>
            <Button type="submit">Search</Button>
          </div>
        </form>

        <div className="w-full sm:w-48">
          <Select value={currentSort} onValueChange={value => updateSort(value as SortOption)}>
            <SelectTrigger>
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              {sortOptions.map(option => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  )
}

export default BrowseHeader

