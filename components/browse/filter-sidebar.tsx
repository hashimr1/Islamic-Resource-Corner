'use client'

import { useMemo, useState } from 'react'
import { usePathname, useRouter, useSearchParams, ReadonlyURLSearchParams } from 'next/navigation'
import { Filter, SlidersHorizontal } from 'lucide-react'

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Separator } from '@/components/ui/separator'
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
type FilterKey = 'grades' | 'types' | 'topics' | 'curriculum'

const topicGroups: { label: string; options: readonly string[]; key?: FilterKey }[] = [
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

function parseSelected(searchParams: ReadonlyURLSearchParams, key: FilterKey) {
  return searchParams.getAll(key)
}

function buildParams(
  searchParams: URLSearchParams | ReadonlyURLSearchParams,
  key: FilterKey,
  values: string[],
  preserveKeys: string[] = []
) {
  const params = new URLSearchParams(searchParams.toString())
  params.delete(key)
  values.forEach(value => params.append(key, value))
  params.delete('page')

  // Keep unrelated keys (like q or sort) automatically, remove non-preserved filter keys when clearing all
  if (!values.length && preserveKeys.length === 0) {
    ;['grades', 'types', 'topics', 'curriculum'].forEach(filterKey => {
      params.delete(filterKey)
    })
  }

  return params
}

function FilterContent({
  selectedGrades,
  selectedTypes,
  selectedTopics,
  selectedCurriculum,
  onToggle,
  onClear,
}: {
  selectedGrades: string[]
  selectedTypes: string[]
  selectedTopics: string[]
  selectedCurriculum: string[]
  onToggle: (key: FilterKey, value: string) => void
  onClear: () => void
}) {
  const renderCheckboxList = (key: FilterKey, options: readonly string[]) => (
    <div className="space-y-3">
      {options.map(option => {
        const selectedArray =
          key === 'grades'
            ? selectedGrades
            : key === 'types'
              ? selectedTypes
              : key === 'curriculum'
                ? selectedCurriculum
                : selectedTopics
        const isChecked = selectedArray.includes(option)

        return (
          <label key={option} className="flex items-center space-x-3 text-sm">
            <Checkbox
              checked={isChecked}
              onCheckedChange={() => onToggle(key, option)}
              id={`${key}-${option}`}
            />
            <span className="capitalize">{option}</span>
          </label>
        )
      })}
    </div>
  )

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-medium">
          <Filter className="h-4 w-4" />
          <span>Filters</span>
        </div>
        <Button variant="ghost" size="sm" onClick={onClear} className="text-xs">
          Clear all
        </Button>
      </div>
      <Separator />

      <Accordion type="multiple" defaultValue={['topics']}>
        <AccordionItem value="grades">
          <AccordionTrigger className="text-sm font-semibold">Grades</AccordionTrigger>
          <AccordionContent className="pt-2">{renderCheckboxList('grades', TARGET_GRADES)}</AccordionContent>
        </AccordionItem>

        <AccordionItem value="types">
          <AccordionTrigger className="text-sm font-semibold">Resource Types</AccordionTrigger>
          <AccordionContent className="pt-2">{renderCheckboxList('types', RESOURCE_TYPES)}</AccordionContent>
        </AccordionItem>

        <AccordionItem value="topics">
          <AccordionTrigger className="text-sm font-semibold">Topics</AccordionTrigger>
          <AccordionContent className="pt-2 space-y-2">
            <Accordion type="multiple" className="border rounded-md divide-y">
              {topicGroups.map(group => (
                <AccordionItem key={group.label} value={group.label}>
                  <AccordionTrigger className="px-3 text-sm font-medium">{group.label}</AccordionTrigger>
                  <AccordionContent className="px-3 pb-3 pt-1">
                    {renderCheckboxList(group.key ?? 'topics', group.options)}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  )
}

export function FilterSidebar() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [open, setOpen] = useState(false)

  const selectedGrades = useMemo(() => parseSelected(searchParams, 'grades'), [searchParams])
  const selectedTypes = useMemo(() => parseSelected(searchParams, 'types'), [searchParams])
  const selectedTopics = useMemo(() => parseSelected(searchParams, 'topics'), [searchParams])
  const selectedCurriculum = useMemo(() => parseSelected(searchParams, 'curriculum'), [searchParams])

  const handleToggle = (key: FilterKey, value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    const current = params.getAll(key)
    const exists = current.includes(value)
    const nextValues = exists ? current.filter(item => item !== value) : [...current, value]
    const nextParams = buildParams(params, key, nextValues, ['q', 'sort'])

    router.push(`${pathname}?${nextParams.toString()}`)
  }

  const handleClear = () => {
    const params = new URLSearchParams(searchParams.toString())
      ;['grades', 'types', 'topics', 'curriculum', 'page'].forEach(key => params.delete(key))
    router.push(`${pathname}?${params.toString()}`)
  }

  const activeFiltersCount =
    selectedGrades.length + selectedTypes.length + selectedTopics.length + selectedCurriculum.length

  return (
    <div className="lg:w-1/4 xl:w-1/5">
      <div className="hidden lg:block sticky top-24 space-y-4">
        <FilterContent
          selectedGrades={selectedGrades}
          selectedTypes={selectedTypes}
          selectedTopics={selectedTopics}
          selectedCurriculum={selectedCurriculum}
          onToggle={handleToggle}
          onClear={handleClear}
        />
      </div>

      <div className="lg:hidden">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" className="w-full">
              <SlidersHorizontal className="mr-2 h-4 w-4" />
              Filters {activeFiltersCount > 0 ? <Badge variant="secondary">{activeFiltersCount}</Badge> : null}
            </Button>
          </DialogTrigger>
          <DialogContent className="fixed right-0 top-0 h-full !w-[90vw] !max-w-none !left-auto sm:!w-full sm:!max-w-md translate-x-0 translate-y-0 rounded-none border-0 border-l flex flex-col">
            <DialogHeader>
              <DialogTitle className="text-left">Refine results</DialogTitle>
            </DialogHeader>
            <div className="flex-1 overflow-y-auto pb-6">
              <FilterContent
                selectedGrades={selectedGrades}
                selectedTypes={selectedTypes}
                selectedTopics={selectedTopics}
                selectedCurriculum={selectedCurriculum}
                onToggle={(key, value) => {
                  handleToggle(key, value)
                }}
                onClear={handleClear}
              />
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}

export default FilterSidebar

