'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useFieldArray, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import {
  Loader2,
  Upload,
  AlertCircle,
  Image,
  FileText,
  ExternalLink,
  Trash2,
  Plus,
  Link2,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import {
  TARGET_GRADES,
  RESOURCE_TYPES,
  TOPICS_QURAN,
  TOPICS_DUAS_ZIYARAT,
  TOPICS_AQAID,
  TOPICS_FIQH,
  TOPICS_AKHLAQ,
  TOPICS_TARIKH,
  TOPICS_PERSONALITIES,
  TOPICS_ISLAMIC_MONTHS,
  TOPICS_LANGUAGES,
  TOPICS_CURRICULUM,
  CREDIT_ORGANIZATIONS,
  TOPICS_OTHER,
} from '@/lib/constants/upload-options-refined'
import { updateResource } from '@/lib/actions/resources'

type UploadFormClientProps = {
  initialData?: any | null
}

type AttachmentPayload = {
  id: string
  name: string
  url: string
  size?: string
  type?: string
}

type ExternalLinkPayload = {
  title: string
  url: string
}

export default function UploadFormClient({ initialData }: UploadFormClientProps) {
  const router = useRouter()
  const isEdit = Boolean(initialData)
  const existingAttachments: AttachmentPayload[] = initialData?.attachments || []
  const existingExternalLinks: ExternalLinkPayload[] = initialData?.external_links || []

  const uploadFormSchema = useMemo(
    () =>
      z.object({
        title: z.string().min(3, 'Title must be at least 3 characters').max(200, 'Title is too long'),
        shortDescription: z
          .string()
          .min(10, 'Short description must be at least 10 characters')
          .max(500, 'Short description is too long'),
        detailedDescription: z.string().max(5000, 'Detailed description is too long').optional(),
        targetGrades: z.array(z.string()).min(1, 'Select at least one grade level'),
        resourceTypes: z.array(z.string()).min(1, 'Select at least one resource type'),
        topicsQuran: z.array(z.string()).default([]),
        topicsDuasZiyarat: z.array(z.string()).default([]),
        topicsAqaid: z.array(z.string()).default([]),
        topicsFiqh: z.array(z.string()).default([]),
        topicsAkhlaq: z.array(z.string()).default([]),
        topicsTarikh: z.array(z.string()).default([]),
        topicsPersonalities: z.array(z.string()).default([]),
        topicsIslamicMonths: z.array(z.string()).default([]),
        topicsLanguages: z.array(z.string()).default([]),
        topicsCurriculum: z.array(z.string()).default([]),
        topicsOther: z.array(z.string()).default([]),
        featuredImage: (isEdit
          ? z.instanceof(File).optional()
          : z.instanceof(File, { message: 'Please upload a featured image' })) as z.ZodTypeAny,
        additionalImages: z.array(z.instanceof(File)).default([]),
        attachments: z.array(z.instanceof(File) as z.ZodType<File>).default([]),
        externalLinks: z
          .array(
            z.object({
              title: z.string().trim().min(1, 'Link title is required'),
              url: z.string().trim().url('Enter a valid URL'),
            })
          )
          .default([]),
        creditOrganization: z.string().optional(),
        creditOther: z.string().max(200, 'Credit text is too long').optional(),
        copyrightVerified: z.boolean().refine(val => val === true, {
          message: 'You must certify that you have the right to distribute this content',
        }),
      }).refine(
        data =>
          data.attachments.length + existingAttachments.length > 0 ||
          data.externalLinks.length + existingExternalLinks.length > 0,
        {
          message: 'Add at least one file or link',
          path: ['attachments'],
        }
      ),
    [isEdit, existingAttachments.length, existingExternalLinks.length]
  )

  type UploadFormValues = z.infer<typeof uploadFormSchema>

  const [isUploading, setIsUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [uploadProgress, setUploadProgress] = useState<string>('')
  const [pendingFiles, setPendingFiles] = useState<File[]>([])

  const form = useForm<UploadFormValues>({
    resolver: zodResolver(uploadFormSchema),
    defaultValues: initialData
      ? {
        title: initialData.title || '',
        shortDescription: initialData.short_description || '',
        detailedDescription: initialData.description || '',
        targetGrades: initialData.target_grades || [],
        resourceTypes: initialData.resource_types || [],
        topicsQuran: initialData.topics_quran || [],
        topicsDuasZiyarat: initialData.topics_duas_ziyarat || [],
        topicsAqaid: initialData.topics_aqaid || [],
        topicsFiqh: initialData.topics_fiqh || [],
        topicsAkhlaq: initialData.topics_akhlaq || [],
        topicsTarikh: initialData.topics_tarikh || [],
        topicsPersonalities: initialData.topics_personalities || [],
        topicsIslamicMonths: initialData.topics_islamic_months || [],
        topicsLanguages: initialData.topics_languages || [],
        topicsCurriculum: initialData.topics_curriculum || [],
        topicsOther: initialData.topics_other || [],
        attachments: [],
        externalLinks: existingExternalLinks,
        additionalImages: [],
        creditOrganization: initialData.credit_organization || '',
        creditOther: initialData.credit_other || '',
        copyrightVerified: initialData.copyright_verified ?? false,
        featuredImage: undefined as any,
      }
      : {
        title: '',
        shortDescription: '',
        detailedDescription: '',
        targetGrades: [],
        resourceTypes: [],
        topicsQuran: [],
        topicsDuasZiyarat: [],
        topicsAqaid: [],
        topicsFiqh: [],
        topicsAkhlaq: [],
        topicsTarikh: [],
        topicsPersonalities: [],
        topicsIslamicMonths: [],
        topicsLanguages: [],
        topicsCurriculum: [],
        topicsOther: [],
        attachments: [],
        externalLinks: [],
        additionalImages: [],
        creditOrganization: '',
        creditOther: '',
        copyrightVerified: false,
        featuredImage: undefined as any,
      },
  })

  const {
    fields: externalLinkFields,
    append: appendExternalLink,
    remove: removeExternalLink,
  } = useFieldArray({
    control: form.control,
    name: 'externalLinks',
  })

  async function uploadSingleFile(file: File, bucket: 'resource-files' | 'resource-thumbnails') {
    const data = new FormData()
    data.append('file', file)
    data.append('bucket', bucket)
    const resp = await fetch('/api/upload/file', { method: 'POST', body: data })
    const result = await resp.json()
    if (!resp.ok || result.error || !result.url) {
      throw new Error(result.error || 'Upload failed')
    }
    return result.url as string
  }

  const syncAttachmentsValue = (files: File[]) => {
    setPendingFiles(files)
    form.setValue('attachments', files, { shouldValidate: true })
  }

  const handleFilesSelected = (fileList: FileList | null) => {
    if (!fileList?.length) return
    const nextFiles = [...pendingFiles, ...Array.from(fileList)]
    syncAttachmentsValue(nextFiles)
  }

  const handleRemovePendingFile = (index: number) => {
    const nextFiles = pendingFiles.filter((_, i) => i !== index)
    syncAttachmentsValue(nextFiles)
  }

  async function onSubmit(values: UploadFormValues) {
    setIsUploading(true)
    setUploadError(null)
    setUploadProgress(isEdit ? 'Preparing update...' : 'Preparing upload...')

    try {
      const additionalImageUrls: string[] = []
      let previewImageUrl = initialData?.preview_image_url || ''
      const uploadedAttachments: AttachmentPayload[] = []
      const preservedAttachments: AttachmentPayload[] = existingAttachments || []
      const externalLinksPayload: ExternalLinkPayload[] = values.externalLinks.map(link => ({
        title: link.title.trim(),
        url: link.url.trim(),
      }))

      if (values.featuredImage) {
        setUploadProgress('Uploading featured image...')
        previewImageUrl = await uploadSingleFile(values.featuredImage, 'resource-thumbnails')
      }

      if (values.additionalImages?.length) {
        setUploadProgress(`Uploading additional images (0/${values.additionalImages.length})...`)
        for (let i = 0; i < values.additionalImages.length; i++) {
          const url = await uploadSingleFile(values.additionalImages[i], 'resource-thumbnails')
          additionalImageUrls.push(url)
          setUploadProgress(
            `Uploading additional images (${i + 1}/${values.additionalImages.length})...`
          )
        }
      }

      if (pendingFiles.length) {
        setUploadProgress(`Uploading files (0/${pendingFiles.length})...`)
        for (let i = 0; i < pendingFiles.length; i++) {
          const file = pendingFiles[i]
          const url = await uploadSingleFile(file, 'resource-files')
          uploadedAttachments.push({
            id:
              typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
                ? crypto.randomUUID()
                : `${Date.now()}-${i}-${file.name}`,
            name: file.name,
            url,
            size: String(file.size),
            type: file.type,
          })
          setUploadProgress(`Uploading files (${i + 1}/${pendingFiles.length})...`)
        }
      }

      const mergedAttachments = [...preservedAttachments, ...uploadedAttachments]
      const fallbackLegacyAttachment =
        initialData?.file_url && mergedAttachments.length === 0
          ? [
            {
              id: 'legacy-file',
              name: initialData.file_url?.split('/')?.pop?.() || 'Resource file',
              url: initialData.file_url,
              size: initialData.file_size?.toString?.() || '',
              type: initialData.file_type || '',
            } satisfies AttachmentPayload,
          ]
          : []

      const allAttachments = mergedAttachments.length ? mergedAttachments : fallbackLegacyAttachment
      const primaryAttachment = allAttachments[0]
      const primarySize = primaryAttachment?.size ? Number(primaryAttachment.size) || 0 : 0

      if (isEdit && initialData?.id) {
        setUploadProgress('Updating resource...')
        const result = await updateResource({
          id: initialData.id,
          title: values.title,
          shortDescription: values.shortDescription,
          description: values.detailedDescription || '',
          targetGrades: values.targetGrades,
          resourceTypes: values.resourceTypes,
          topicsQuran: values.topicsQuran,
          topicsDuasZiyarat: values.topicsDuasZiyarat,
          topicsAqaid: values.topicsAqaid,
          topicsFiqh: values.topicsFiqh,
          topicsAkhlaq: values.topicsAkhlaq,
          topicsTarikh: values.topicsTarikh,
          topicsPersonalities: values.topicsPersonalities,
          topicsIslamicMonths: values.topicsIslamicMonths,
          topicsLanguages: values.topicsLanguages,
          topicsCurriculum: values.topicsCurriculum,
          topicsOther: values.topicsOther,
          previewImageUrl,
          additionalImages: additionalImageUrls.length
            ? additionalImageUrls
            : initialData.additional_images || [],
          attachments: allAttachments,
          externalLinks: externalLinksPayload,
          fileUrl: primaryAttachment?.url || '',
          fileSize: primarySize,
          fileType: primaryAttachment?.type || '',
          creditOrganization: values.creditOrganization || null,
          creditOther: values.creditOther || null,
          copyrightVerified: values.copyrightVerified,
        })

        if (result?.error) {
          throw new Error(result.error)
        }

        setUploadProgress('Updated! Redirecting...')
        router.push(`/resource/${result.slug || initialData.slug || initialData.id}`)
        return
      }

      // Create flow (existing)
      setUploadProgress('Creating resource...')
      const createResponse = await fetch('/api/upload/resource-refined', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: values.title,
          shortDescription: values.shortDescription,
          detailedDescription: values.detailedDescription || '',
          targetGrades: values.targetGrades,
          resourceTypes: values.resourceTypes,
          topicsQuran: values.topicsQuran,
          topicsDuasZiyarat: values.topicsDuasZiyarat,
          topicsAqaid: values.topicsAqaid,
          topicsFiqh: values.topicsFiqh,
          topicsAkhlaq: values.topicsAkhlaq,
          topicsTarikh: values.topicsTarikh,
          topicsPersonalities: values.topicsPersonalities,
          topicsIslamicMonths: values.topicsIslamicMonths,
          topicsLanguages: values.topicsLanguages,
          topicsCurriculum: values.topicsCurriculum,
          topicsOther: values.topicsOther,
          previewImageUrl,
          additionalImages: additionalImageUrls,
          attachments: allAttachments,
          externalLinks: externalLinksPayload,
          fileUrl: primaryAttachment?.url || '',
          fileSize: primarySize,
          fileType: primaryAttachment?.type || '',
          creditOrganization: values.creditOrganization || null,
          creditOther: values.creditOther || null,
          copyrightVerified: values.copyrightVerified,
        }),
      })

      const createResult = await createResponse.json()
      if (!createResponse.ok || createResult.error) {
        throw new Error(createResult.error || 'Failed to create resource')
      }

      setUploadProgress('Success! Redirecting...')
      router.push('/dashboard')
    } catch (error: any) {
      console.error('Upload error:', error)
      setUploadError(error?.message || 'An unexpected error occurred. Please try again.')
      setIsUploading(false)
    }
  }

  return (
    <div className="bg-muted/30">
      <div className="container max-w-5xl mx-auto py-8 px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">{isEdit ? 'Edit Resource' : 'Upload New Resource'}</h1>
          <p className="text-muted-foreground">
            {isEdit
              ? 'Update your Islamic educational resource. You can keep existing files or upload new ones.'
              : 'Share your Islamic educational resource with the community. All uploads are reviewed by our admin team before publication.'}
          </p>
        </div>

        {/* Upload Form */}
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Error Alert */}
            {uploadError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Save Failed</AlertTitle>
                <AlertDescription>{uploadError}</AlertDescription>
              </Alert>
            )}

            {/* Progress Alert */}
            {isUploading && (
              <Alert>
                <Loader2 className="h-4 w-4 animate-spin" />
                <AlertTitle>{isEdit ? 'Updating...' : 'Uploading...'}</AlertTitle>
                <AlertDescription>{uploadProgress}</AlertDescription>
              </Alert>
            )}

            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
                <CardDescription>Provide the title and descriptions for your resource</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Resource Title *</FormLabel>
                      <FormControl>
                        <Input {...field} disabled={isUploading} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="shortDescription"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Short Description *</FormLabel>
                      <FormControl>
                        <Textarea
                          className="resize-none"
                          rows={3}
                          {...field}
                          disabled={isUploading}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="detailedDescription"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Detailed Description</FormLabel>
                      <FormControl>
                        <Textarea
                          className="resize-none"
                          rows={6}
                          {...field}
                          disabled={isUploading}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Categorization */}
            <Card>
              <CardHeader>
                <CardTitle>Categorization *</CardTitle>
                <CardDescription>Select all applicable grades and resource types</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <FormField
                  control={form.control}
                  name="targetGrades"
                  render={() => (
                    <FormItem>
                      <FormLabel>Target Grades *</FormLabel>
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 mt-2">
                        {TARGET_GRADES.map(grade => (
                          <FormField
                            key={grade}
                            control={form.control}
                            name="targetGrades"
                            render={({ field }) => (
                              <FormItem className="flex items-center space-x-2 space-y-0">
                                <FormControl>
                                  <Checkbox
                                    checked={field.value?.includes(grade)}
                                    onCheckedChange={checked => {
                                      const updatedValue = checked
                                        ? [...(field.value || []), grade]
                                        : field.value?.filter(value => value !== grade) || []
                                      field.onChange(updatedValue)
                                    }}
                                    disabled={isUploading}
                                  />
                                </FormControl>
                                <FormLabel className="font-normal cursor-pointer text-sm">
                                  {grade}
                                </FormLabel>
                              </FormItem>
                            )}
                          />
                        ))}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="resourceTypes"
                  render={() => (
                    <FormItem>
                      <FormLabel>Resource Types *</FormLabel>
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 mt-2">
                        {RESOURCE_TYPES.map(type => (
                          <FormField
                            key={type}
                            control={form.control}
                            name="resourceTypes"
                            render={({ field }) => (
                              <FormItem className="flex items-center space-x-2 space-y-0">
                                <FormControl>
                                  <Checkbox
                                    checked={field.value?.includes(type)}
                                    onCheckedChange={checked => {
                                      const updatedValue = checked
                                        ? [...(field.value || []), type]
                                        : field.value?.filter(value => value !== type) || []
                                      field.onChange(updatedValue)
                                    }}
                                    disabled={isUploading}
                                  />
                                </FormControl>
                                <FormLabel className="font-normal cursor-pointer text-sm">
                                  {type}
                                </FormLabel>
                              </FormItem>
                            )}
                          />
                        ))}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Topics */}
            <Card>
              <CardHeader>
                <CardTitle>Topic Tags</CardTitle>
                <CardDescription>Select relevant topics (all optional)</CardDescription>
              </CardHeader>
              <CardContent>
                <Accordion type="multiple" className="w-full">
                  {[
                    { label: 'Noble Qurʾān', name: 'topicsQuran', options: TOPICS_QURAN },
                    { label: 'Duʿās & Ziyārāt', name: 'topicsDuasZiyarat', options: TOPICS_DUAS_ZIYARAT },
                    { label: 'ʿAqāʾid (Beliefs)', name: 'topicsAqaid', options: TOPICS_AQAID },
                    { label: 'Fiqh (Islamic Laws)', name: 'topicsFiqh', options: TOPICS_FIQH },
                    { label: 'Akhlāq (Etiquette)', name: 'topicsAkhlaq', options: TOPICS_AKHLAQ },
                    { label: 'Tārīkh (Events & Occasions)', name: 'topicsTarikh', options: TOPICS_TARIKH },
                    { label: 'Curriculum', name: 'topicsCurriculum', options: TOPICS_CURRICULUM },
                    { label: 'Personalities', name: 'topicsPersonalities', options: TOPICS_PERSONALITIES },
                    { label: 'Islamic Months', name: 'topicsIslamicMonths', options: TOPICS_ISLAMIC_MONTHS },
                    { label: 'Languages', name: 'topicsLanguages', options: TOPICS_LANGUAGES },
                    { label: 'Other', name: 'topicsOther', options: TOPICS_OTHER },
                  ].map(section => (
                    <AccordionItem key={section.name} value={section.name}>
                      <AccordionTrigger>{section.label}</AccordionTrigger>
                      <AccordionContent>
                        <FormField
                          control={form.control}
                          name={section.name as any}
                          render={() => (
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                              {section.options.map(option => (
                                <FormField
                                  key={option}
                                  control={form.control}
                                  name={section.name as any}
                                  render={({ field }) => (
                                    <FormItem className="flex items-center space-x-2 space-y-0">
                                      <FormControl>
                                        <Checkbox
                                          checked={field.value?.includes(option)}
                                          onCheckedChange={checked => {
                                            const updatedValue = checked
                                              ? [...(field.value || []), option]
                                              : field.value?.filter((v: string) => v !== option) || []
                                            field.onChange(updatedValue)
                                          }}
                                          disabled={isUploading}
                                        />
                                      </FormControl>
                                      <FormLabel className="font-normal cursor-pointer text-sm">
                                        {option}
                                      </FormLabel>
                                    </FormItem>
                                  )}
                                />
                              ))}
                            </div>
                          )}
                        />
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </CardContent>
            </Card>

            {/* Media */}
            <Card>
              <CardHeader>
                <CardTitle>Media</CardTitle>
                <CardDescription>Upload preview and gallery images</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {isEdit && initialData?.preview_image_url && (
                  <div className="text-sm text-muted-foreground flex items-center gap-2">
                    <Image className="h-4 w-4" />
                    <span>Current Image:</span>
                    <a
                      href={initialData.preview_image_url}
                      target="_blank"
                      rel="noreferrer"
                      className="underline text-primary inline-flex items-center gap-1"
                    >
                      View <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                )}
                <FormField
                  control={form.control}
                  name="featuredImage"
                  render={({ field: { value, onChange, ...fieldProps } }) => (
                    <FormItem>
                      <FormLabel>
                        <div className="flex items-center gap-2">
                          <Image className="h-4 w-4" />
                          Featured Image {isEdit ? '(optional)' : '*'}
                        </div>
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="file"
                          accept="image/jpeg,image/jpg,image/png,image/webp"
                          onChange={e => onChange(e.target.files?.[0])}
                          disabled={isUploading}
                          {...fieldProps}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="additionalImages"
                  render={({ field: { value, onChange, ...fieldProps } }) => (
                    <FormItem>
                      <FormLabel>
                        <div className="flex items-center gap-2">
                          <Image className="h-4 w-4" />
                          Additional Images
                        </div>
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="file"
                          accept="image/jpeg,image/jpg,image/png,image/webp"
                          multiple
                          onChange={e => onChange(e.target.files ? Array.from(e.target.files) : [])}
                          disabled={isUploading}
                          {...fieldProps}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Files & Links</CardTitle>
                <CardDescription>Upload files and add external resources</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <FormField
                  control={form.control}
                  name="attachments"
                  render={() => (
                    <FormItem className="space-y-3">
                      <FormLabel>
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4" />
                          Files
                        </div>
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="file"
                          multiple
                          onChange={e => handleFilesSelected(e.target.files)}
                          disabled={isUploading}
                        />
                      </FormControl>
                      <div className="space-y-2">
                        {pendingFiles.length ? (
                          pendingFiles.map((file, index) => (
                            <div
                              key={`${file.name}-${index}`}
                              className="flex items-center justify-between rounded border px-3 py-2 text-sm"
                            >
                              <div className="flex items-center gap-2">
                                <FileText className="h-4 w-4 text-muted-foreground" />
                                <span className="font-medium">{file.name}</span>
                                <span className="text-xs text-muted-foreground">
                                  {(file.size / 1024 / 1024).toFixed(1)} MB
                                </span>
                              </div>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => handleRemovePendingFile(index)}
                                disabled={isUploading}
                              >
                                <Trash2 className="h-4 w-4" />
                                <span className="sr-only">Remove file</span>
                              </Button>
                            </div>
                          ))
                        ) : (
                          <p className="text-sm text-muted-foreground">No files selected yet.</p>
                        )}
                      </div>
                      {existingAttachments?.length ? (
                        <div className="space-y-2 rounded-md bg-muted/50 p-3">
                          <p className="text-sm font-medium">Existing files</p>
                          <div className="space-y-1">
                            {existingAttachments.map(attachment => (
                              <a
                                key={attachment.id}
                                href={attachment.url}
                                target="_blank"
                                rel="noreferrer"
                                className="flex items-center gap-2 text-sm text-primary hover:underline"
                              >
                                <FileText className="h-4 w-4" />
                                <span>{attachment.name || 'Attachment'}</span>
                                {attachment.type && (
                                  <span className="text-muted-foreground text-xs uppercase">
                                    {attachment.type}
                                  </span>
                                )}
                              </a>
                            ))}
                          </div>
                        </div>
                      ) : null}
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <FormLabel className="flex items-center gap-2">
                      <Link2 className="h-4 w-4" />
                      External Links
                    </FormLabel>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => appendExternalLink({ title: '', url: '' })}
                      disabled={isUploading}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Link
                    </Button>
                  </div>

                  <div className="space-y-3">
                    {externalLinkFields.length === 0 ? (
                      <p className="text-sm text-muted-foreground">
                        No external links yet. Add YouTube, Spotify, or article URLs.
                      </p>
                    ) : null}

                    {externalLinkFields.map((field, index) => (
                      <div
                        key={field.id}
                        className="grid gap-2 md:grid-cols-[1fr,1fr,auto] md:items-start"
                      >
                        <FormField
                          control={form.control}
                          name={`externalLinks.${index}.title`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-sm">Title</FormLabel>
                              <FormControl>
                                <Input
                                  {...field}
                                  placeholder="Watch on YouTube"
                                  disabled={isUploading}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name={`externalLinks.${index}.url`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-sm">URL</FormLabel>
                              <FormControl>
                                <Input
                                  {...field}
                                  placeholder="https://youtube.com/..."
                                  disabled={isUploading}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <div className="flex items-center md:justify-end">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => removeExternalLink(index)}
                            disabled={isUploading}
                          >
                            <Trash2 className="h-4 w-4" />
                            <span className="sr-only">Remove link</span>
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Credits & Legal */}
            <Card>
              <CardHeader>
                <CardTitle>Credits & Legal</CardTitle>
                <CardDescription>Attribution and copyright verification</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="creditOrganization"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Credit To</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isUploading}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select an organization (optional)" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {CREDIT_ORGANIZATIONS.map(org => (
                            <SelectItem key={org} value={org}>
                              {org}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="creditOther"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Other</FormLabel>
                      <FormControl>
                        <Input {...field} disabled={isUploading} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="copyrightVerified"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          disabled={isUploading}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel className="font-semibold">
                          I certify that I have the right to distribute this content *
                        </FormLabel>
                        <FormMessage />
                      </div>
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Submit */}
            <div className="flex gap-4 justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push('/dashboard')}
                disabled={isUploading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isUploading} size="lg">
                {isUploading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {isEdit ? 'Saving...' : 'Uploading...'}
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    {isEdit ? 'Update Resource' : 'Upload Resource'}
                  </>
                )}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  )
}

