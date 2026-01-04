'use client'

import { ReactNode, useCallback, useEffect, useMemo, useState, useTransition } from 'react'
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  type DragEndEvent,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical } from 'lucide-react'
import {
  RESOURCE_TYPES,
  TARGET_GRADES,
  TOPICS_AQAID,
  TOPICS_AKHLAQ,
  TOPICS_DUAS_ZIYARAT,
  TOPICS_FIQH,
  TOPICS_ISLAMIC_MONTHS,
  TOPICS_LANGUAGES,
  TOPICS_PERSONALITIES,
  TOPICS_QURAN,
  TOPICS_TARIKH,
  TOPICS_CURRICULUM,
  TOPICS_OTHER,
} from '@/lib/constants/upload-options-refined'
import { createSupabaseBrowserClient } from '@/lib/supabase/client'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

type FilterCriteria = {
  grades?: string[]
  topics?: string[]
  curriculum?: string[]
  types?: string[]
}

type FeaturedList = {
  id: string
  title: string
  filter_criteria: FilterCriteria | null
  is_active: boolean
  display_order: number | null
  created_at: string | null
}

type FormState = {
  id: string | null
  title: string
  grades: string[]
  topics: string[]
  curriculum: string[]
  types: string[]
  isActive: boolean
}

type ReorderItem = { id: string; display_order: number }

const topicGroups: { label: string; options: readonly string[]; key?: 'topics' | 'curriculum' }[] = [
  { label: 'Quran', options: TOPICS_QURAN },
  { label: "Du'as & Ziyarat", options: TOPICS_DUAS_ZIYARAT },
  { label: 'Aqaid', options: TOPICS_AQAID },
  { label: 'Fiqh', options: TOPICS_FIQH },
  { label: 'Akhlaq', options: TOPICS_AKHLAQ },
  { label: 'Tarikh', options: TOPICS_TARIKH },
  { label: 'Personalities', options: TOPICS_PERSONALITIES },
  { label: 'Islamic Months', options: TOPICS_ISLAMIC_MONTHS },
  { label: 'Languages', options: TOPICS_LANGUAGES },
  { label: 'Curriculum', options: TOPICS_CURRICULUM, key: 'curriculum' },
  { label: 'Other Topics', options: TOPICS_OTHER },
]

const initialFormState: FormState = {
  id: null,
  title: '',
  grades: [],
  topics: [],
  curriculum: [],
  types: [],
  isActive: false,
}

function normalizeCriteria(criteria: FilterCriteria | null | undefined): Required<FilterCriteria> {
  return {
    grades: Array.isArray(criteria?.grades) ? criteria?.grades : [],
    topics: Array.isArray(criteria?.topics) ? criteria?.topics : [],
    curriculum: Array.isArray(criteria?.curriculum) ? criteria?.curriculum : [],
    types: Array.isArray(criteria?.types) ? criteria?.types : [],
  }
}

function ScrollableFilterList({
  title,
  children,
}: {
  title?: string
  children: ReactNode
}) {
  return (
    <div className="space-y-2">
      {title ? <p className="text-sm font-medium">{title}</p> : null}
      <div className="border rounded-md p-3 max-h-56 overflow-y-auto">{children}</div>
    </div>
  )
}

function renderBadgeGroup(label: string, values: string[]) {
  return values.length > 0 ? (
    <div className="flex flex-wrap gap-2">
      {values.map(value => (
        <Badge key={`${label}-${value}`} variant="secondary">
          {label}: {value}
        </Badge>
      ))}
    </div>
  ) : null
}

function SortableRow({
  item,
  onEdit,
  onToggleActive,
  onDelete,
  disabled,
}: {
  item: FeaturedList
  onEdit: (item: FeaturedList) => void
  onToggleActive: (item: FeaturedList, next: boolean) => void
  onDelete: (item: FeaturedList) => void
  disabled?: boolean
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.id,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
  }

  const criteria = normalizeCriteria(item.filter_criteria)

  return (
    <TableRow ref={setNodeRef} style={style} className={isDragging ? 'bg-muted/60' : ''}>
      <TableCell className="w-[48px]">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="cursor-grab"
          disabled={disabled}
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-4 w-4" />
        </Button>
      </TableCell>
      <TableCell className="font-medium">{item.title}</TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
          <Checkbox
            checked={item.is_active}
            onCheckedChange={value => onToggleActive(item, Boolean(value))}
            aria-label="Active status"
            disabled={disabled}
          />
          <span className="text-xs text-muted-foreground">Active</span>
        </div>
      </TableCell>
      <TableCell>
        <div className="space-y-2">
          {renderBadgeGroup('Grade', criteria.grades)}
          {renderBadgeGroup('Type', criteria.types)}
          {renderBadgeGroup('Topic', criteria.topics)}
          {renderBadgeGroup('Curriculum', criteria.curriculum)}
        </div>
      </TableCell>
      <TableCell className="text-right">
        <div className="flex justify-end gap-2">
          <Button variant="ghost" size="sm" onClick={() => onEdit(item)}>
            Edit
          </Button>
          <Button variant="destructive" size="sm" onClick={() => onDelete(item)} disabled={disabled}>
            Delete
          </Button>
        </div>
      </TableCell>
    </TableRow>
  )
}

export default function FeaturedListsManager({
  onReorder,
  onDelete,
}: {
  onReorder: (items: ReorderItem[]) => Promise<void>
  onDelete: (id: string) => Promise<void>
}) {
  const supabase = useMemo(() => createSupabaseBrowserClient(), [])

  const [lists, setLists] = useState<FeaturedList[]>([])
  const [form, setForm] = useState<FormState>(initialFormState)
  const [loading, setLoading] = useState<boolean>(true)
  const [saving, setSaving] = useState<boolean>(false)
  const [status, setStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const [isPending, startTransition] = useTransition()

  const fetchLists = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('home_featured_lists')
      .select('id,title,filter_criteria,is_active,display_order,created_at')
      .order('display_order', { ascending: true })

    if (error) {
      console.error('Failed to load featured lists', error)
      setStatus({ type: 'error', message: 'Failed to load featured lists.' })
    } else {
      setLists(data ?? [])
    }
    setLoading(false)
  }, [supabase])

  useEffect(() => {
    fetchLists()
  }, [fetchLists])

  const resetForm = () => {
    setForm(initialFormState)
  }

  const handleEdit = (list: FeaturedList) => {
    const criteria = normalizeCriteria(list.filter_criteria)
    setForm({
      id: list.id,
      title: list.title,
      grades: criteria.grades,
      topics: criteria.topics,
      curriculum: criteria.curriculum,
      types: criteria.types,
      isActive: list.is_active,
    })
    setStatus(null)
  }

  const toggleValue = (arr: string[], value: string) => {
    const set = new Set(arr)
    if (set.has(value)) set.delete(value)
    else set.add(value)
    return Array.from(set)
  }

  const handleToggleActive = async (list: FeaturedList, nextState: boolean) => {
    if (nextState) {
      const activeCount = lists.filter(item => item.is_active && item.id !== list.id).length
      if (activeCount >= 3) {
        setStatus({ type: 'error', message: 'Only 3 lists can be active at once.' })
        return
      }
    }

    setSaving(true)
    const { error } = await supabase
      .from('home_featured_lists')
      .update({ is_active: nextState })
      .eq('id', list.id)

    if (error) {
      console.error('Failed to toggle list', error)
      setStatus({ type: 'error', message: 'Failed to update list status.' })
    } else {
      setStatus({ type: 'success', message: 'List updated.' })
      fetchLists()
    }
    setSaving(false)
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setSaving(true)
    setStatus(null)

    const activeCount = lists.filter(item => item.is_active && item.id !== form.id).length
    if (form.isActive && activeCount >= 3) {
      setStatus({ type: 'error', message: 'Only 3 lists can be active at once.' })
      setSaving(false)
      return
    }

    const payload = {
      title: form.title.trim(),
      filter_criteria: {
        grades: form.grades,
        topics: form.topics,
        curriculum: form.curriculum,
        types: form.types,
      },
      is_active: form.isActive,
    }

    if (!payload.title) {
      setStatus({ type: 'error', message: 'Title is required.' })
      setSaving(false)
      return
    }

    const query = form.id
      ? supabase.from('home_featured_lists').update(payload).eq('id', form.id)
      : supabase.from('home_featured_lists').insert(payload)

    const { error } = await query

    if (error) {
      console.error('Failed to save featured list', error)
      setStatus({ type: 'error', message: 'Failed to save list.' })
    } else {
      setStatus({ type: 'success', message: 'List saved.' })
      resetForm()
      fetchLists()
    }

    setSaving(false)
  }

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return

    setLists(prev => {
      const oldIndex = prev.findIndex(item => item.id === active.id)
      const newIndex = prev.findIndex(item => item.id === over.id)
      if (oldIndex === -1 || newIndex === -1) return prev

      const reordered = arrayMove(prev, oldIndex, newIndex)
      const withOrder = reordered.map((item, index) => ({
        ...item,
        display_order: index,
      }))

      // Optimistic update to server
      startTransition(() => {
        onReorder(withOrder.map(item => ({ id: item.id, display_order: item.display_order ?? 0 }))).catch(
          err => {
            console.error('Reorder failed', err)
            setStatus({ type: 'error', message: 'Failed to save new order.' })
            fetchLists()
          }
        )
      })

      return withOrder
    })
  }

  const handleDelete = (list: FeaturedList) => {
    const confirmed = window.confirm(`Delete "${list.title}"? This cannot be undone.`)
    if (!confirmed) return

    setSaving(true)
    startTransition(() => {
      onDelete(list.id)
        .then(() => {
          setStatus({ type: 'success', message: 'List deleted.' })
          fetchLists()
        })
        .catch(err => {
          console.error('Delete failed', err)
          setStatus({ type: 'error', message: 'Failed to delete list.' })
        })
        .finally(() => setSaving(false))
    })
  }

  const renderOptions = (key: keyof Pick<FormState, 'grades' | 'topics' | 'curriculum' | 'types'>, options: readonly string[]) => (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
      {options.map(option => {
        const selectedArray = form[key]
        const isChecked = selectedArray.includes(option)
        return (
          <label key={`${key}-${option}`} className="flex items-center gap-2 text-sm">
            <Checkbox
              id={`${key}-${option}`}
              checked={isChecked}
              onCheckedChange={() =>
                setForm(prev => ({
                  ...prev,
                  [key]: toggleValue(prev[key], option),
                }))
              }
            />
            <span>{option}</span>
          </label>
        )
      })}
    </div>
  )

  return (
    <Card>
      <CardHeader>
        <CardTitle>Homepage Featured Lists</CardTitle>
        <CardDescription>
          Curate up to three highlighted collections that appear above the standard grade sections on the homepage.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-8">
        {status ? (
          <div
            className={`rounded-md border px-3 py-2 text-sm ${
              status.type === 'error' ? 'border-destructive/50 text-destructive' : 'border-green-500/50 text-green-700'
            }`}
          >
            {status.message}
          </div>
        ) : null}

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Existing Lists</h3>
            <Button variant="outline" size="sm" onClick={resetForm}>
              New List
            </Button>
          </div>

          {loading ? (
            <p className="text-sm text-muted-foreground">Loading lists...</p>
          ) : (
            <div className="overflow-x-auto">
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext
                  items={lists.map(list => list.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[60px]">Order</TableHead>
                        <TableHead>Title</TableHead>
                        <TableHead className="w-28">Active</TableHead>
                        <TableHead>Filters</TableHead>
                        <TableHead className="w-32 text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {lists.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center text-muted-foreground">
                            No featured lists yet.
                          </TableCell>
                        </TableRow>
                      ) : (
                        lists.map(list => (
                          <SortableRow
                            key={list.id}
                            item={list}
                            onEdit={handleEdit}
                            onToggleActive={handleToggleActive}
                          onDelete={handleDelete}
                            disabled={saving || isPending}
                          />
                        ))
                      )}
                    </TableBody>
                  </Table>
                </SortableContext>
              </DndContext>
            </div>
          )}
        </div>

        <Separator />

        <form className="space-y-6" onSubmit={handleSubmit}>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">{form.id ? 'Edit Featured List' : 'Create Featured List'}</h3>
              <p className="text-sm text-muted-foreground">
                Set the title and filters to define what appears in this curated section.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="is-active"
                  checked={form.isActive}
                  onCheckedChange={value => setForm(prev => ({ ...prev, isActive: Boolean(value) }))}
                />
                <Label htmlFor="is-active">Active</Label>
              </div>
              <Button type="submit" disabled={saving}>
                {saving ? 'Saving...' : form.id ? 'Update List' : 'Create List'}
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={form.title}
                onChange={event => setForm(prev => ({ ...prev, title: event.target.value }))}
                placeholder="e.g., Ramadan Specials"
              />
            </div>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Grades</Label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-xs"
                    onClick={() => setForm(prev => ({ ...prev, grades: [] }))}
                  >
                    Clear
                  </Button>
                </div>
                <ScrollableFilterList>
                  {renderOptions('grades', TARGET_GRADES)}
                </ScrollableFilterList>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Resource Types</Label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-xs"
                    onClick={() => setForm(prev => ({ ...prev, types: [] }))}
                  >
                    Clear
                  </Button>
                </div>
                <ScrollableFilterList>
                  {renderOptions('types', RESOURCE_TYPES)}
                </ScrollableFilterList>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Topics</Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="text-xs"
                  onClick={() => setForm(prev => ({ ...prev, topics: [], curriculum: [] }))}
                >
                  Clear
                </Button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {topicGroups.map(group => (
                  <ScrollableFilterList key={group.label} title={group.label}>
                    <div className="space-y-2">
                      {group.options.map(option => {
                        const key = group.key === 'curriculum' ? 'curriculum' : 'topics'
                        const selected = form[key].includes(option)
                        return (
                          <label key={`${group.label}-${option}`} className="flex items-center gap-2 text-sm">
                            <Checkbox
                              checked={selected}
                              onCheckedChange={() =>
                                setForm(prev => ({
                                  ...prev,
                                  [key]: toggleValue(prev[key], option),
                                }))
                              }
                            />
                            <span>{option}</span>
                          </label>
                        )
                      })}
                    </div>
                  </ScrollableFilterList>
                ))}
              </div>
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}


