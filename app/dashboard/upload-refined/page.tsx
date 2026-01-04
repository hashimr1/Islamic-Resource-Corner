'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
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
  CREDIT_ORGANIZATIONS,
} from '@/lib/constants/upload-options-refined'
import { Loader2, Upload, AlertCircle, Image, FileText } from 'lucide-react'

// Zod validation schema
const uploadFormSchema = z.object({
  // Basic Information
  title: z.string().min(3, 'Title must be at least 3 characters').max(200, 'Title is too long'),
  shortDescription: z
    .string()
    .min(10, 'Short description must be at least 10 characters')
    .max(500, 'Short description is too long'),
  detailedDescription: z.string().max(5000, 'Detailed description is too long').optional(),

  // Categorization (Required)
  targetGrades: z.array(z.string()).min(1, 'Select at least one grade level'),
  resourceTypes: z.array(z.string()).min(1, 'Select at least one resource type'),

  // Topic Tags (All Optional)
  topicsQuran: z.array(z.string()).default([]),
  topicsDuasZiyarat: z.array(z.string()).default([]),
  topicsAqaid: z.array(z.string()).default([]),
  topicsFiqh: z.array(z.string()).default([]),
  topicsAkhlaq: z.array(z.string()).default([]),
  topicsTarikh: z.array(z.string()).default([]),
  topicsPersonalities: z.array(z.string()).default([]),
  topicsIslamicMonths: z.array(z.string()).default([]),
  topicsLanguages: z.array(z.string()).default([]),

  // Media (Files)
  featuredImage: z.instanceof(File, { message: 'Please upload a featured image' }),
  additionalImages: z.array(z.instanceof(File)).default([]),
  resourceFile: z.instanceof(File, { message: 'Please upload a resource file (PDF)' }),

  // Credits & Legal
  creditOrganization: z.string().optional(),
  creditOther: z.string().max(200, 'Credit text is too long').optional(),
  copyrightVerified: z.boolean().refine(val => val === true, {
    message: 'You must certify that you have the right to distribute this content',
  }),
})

type UploadFormValues = z.infer<typeof uploadFormSchema>

export default function UploadRefinedPage() {
  const router = useRouter()
  const [isUploading, setIsUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [uploadProgress, setUploadProgress] = useState<string>('')

  const form = useForm<UploadFormValues>({
    resolver: zodResolver(uploadFormSchema),
    defaultValues: {
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
      additionalImages: [],
      creditOrganization: '',
      creditOther: '',
      copyrightVerified: false,
    },
  })

  async function onSubmit(values: UploadFormValues) {
    setIsUploading(true)
    setUploadError(null)
    setUploadProgress('Preparing upload...')

    try {
      // Step 1: Upload featured image
      setUploadProgress('Uploading featured image...')
      const featuredImageFormData = new FormData()
      featuredImageFormData.append('file', values.featuredImage)
      featuredImageFormData.append('bucket', 'resource-thumbnails')

      const featuredImageResponse = await fetch('/api/upload/file', {
        method: 'POST',
        body: featuredImageFormData,
      })

      const featuredImageResult = await featuredImageResponse.json()

      if (!featuredImageResponse.ok || featuredImageResult.error || !featuredImageResult.url) {
        setUploadError(featuredImageResult.error || 'Failed to upload featured image')
        setIsUploading(false)
        return
      }

      // Step 2: Upload additional images (if any)
      const additionalImageUrls: string[] = []
      if (values.additionalImages.length > 0) {
        setUploadProgress(`Uploading additional images (0/${values.additionalImages.length})...`)
        for (let i = 0; i < values.additionalImages.length; i++) {
          const imageFormData = new FormData()
          imageFormData.append('file', values.additionalImages[i])
          imageFormData.append('bucket', 'resource-thumbnails')

          const imageResponse = await fetch('/api/upload/file', {
            method: 'POST',
            body: imageFormData,
          })

          const imageResult = await imageResponse.json()

          if (imageResponse.ok && imageResult.url) {
            additionalImageUrls.push(imageResult.url)
            setUploadProgress(
              `Uploading additional images (${i + 1}/${values.additionalImages.length})...`
            )
          } else {
            console.warn(`Failed to upload image ${i + 1}:`, imageResult.error)
          }
        }
      }

      // Step 3: Upload resource file (PDF)
      setUploadProgress('Uploading resource file...')
      const resourceFileFormData = new FormData()
      resourceFileFormData.append('file', values.resourceFile)
      resourceFileFormData.append('bucket', 'resource-files')

      const resourceFileResponse = await fetch('/api/upload/file', {
        method: 'POST',
        body: resourceFileFormData,
      })

      const resourceFileResult = await resourceFileResponse.json()

      if (!resourceFileResponse.ok || resourceFileResult.error || !resourceFileResult.url) {
        setUploadError(resourceFileResult.error || 'Failed to upload resource file')
        setIsUploading(false)
        return
      }

      // Step 4: Create resource record in database
      setUploadProgress('Creating resource...')

      const createResourceResponse = await fetch('/api/upload/resource-refined', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
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
          previewImageUrl: featuredImageResult.url,
          additionalImages: additionalImageUrls,
          fileUrl: resourceFileResult.url,
          fileSize: values.resourceFile.size,
          fileType: values.resourceFile.type,
          creditOrganization: values.creditOrganization || null,
          creditOther: values.creditOther || null,
          copyrightVerified: values.copyrightVerified,
        }),
      })

      const createResourceResult = await createResourceResponse.json()

      if (!createResourceResponse.ok || createResourceResult.error) {
        setUploadError(createResourceResult.error || 'Failed to create resource')
        setIsUploading(false)
        return
      }

      // Success! Redirect to the resource page
      setUploadProgress('Success! Redirecting...')
      router.push(`/resource/${createResourceResult.resourceId}`)
    } catch (error) {
      console.error('Upload error:', error)
      setUploadError('An unexpected error occurred. Please try again.')
      setIsUploading(false)
    }
  }

  return (
    <div className="bg-muted/30">
      <div className="container max-w-5xl mx-auto py-8 px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Upload New Resource</h1>
          <p className="text-muted-foreground">
            Share your Islamic educational resource with the community. All uploads are reviewed by
            our admin team before publication.
          </p>
        </div>

        {/* Upload Form */}
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Error Alert */}
            {uploadError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Upload Failed</AlertTitle>
                <AlertDescription>{uploadError}</AlertDescription>
              </Alert>
            )}

            {/* Progress Alert */}
            {isUploading && (
              <Alert>
                <Loader2 className="h-4 w-4 animate-spin" />
                <AlertTitle>Uploading...</AlertTitle>
                <AlertDescription>{uploadProgress}</AlertDescription>
              </Alert>
            )}

            {/* Section 1: Basic Information */}
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

            {/* Section 2: Categorization (Required) */}
            <Card>
              <CardHeader>
                <CardTitle>Categorization *</CardTitle>
                <CardDescription>
                  Select all applicable grades and resource types
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Target Grades */}
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

                {/* Resource Types */}
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

            {/* Section 3: Topic Tags (Optional - Accordions) */}
            <Card>
              <CardHeader>
                <CardTitle>Topic Tags</CardTitle>
                <CardDescription>
                  Select relevant topics (all optional - expand sections as needed)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Accordion type="multiple" className="w-full">
                  {/* Noble Qurʾān */}
                  <AccordionItem value="quran">
                    <AccordionTrigger>Noble Qurʾān</AccordionTrigger>
                    <AccordionContent>
                      <FormField
                        control={form.control}
                        name="topicsQuran"
                        render={() => (
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                            {TOPICS_QURAN.map(topic => (
                              <FormField
                                key={topic}
                                control={form.control}
                                name="topicsQuran"
                                render={({ field }) => (
                                  <FormItem className="flex items-center space-x-2 space-y-0">
                                    <FormControl>
                                      <Checkbox
                                        checked={field.value?.includes(topic)}
                                        onCheckedChange={checked => {
                                          const updatedValue = checked
                                            ? [...(field.value || []), topic]
                                            : field.value?.filter(value => value !== topic) || []
                                          field.onChange(updatedValue)
                                        }}
                                        disabled={isUploading}
                                      />
                                    </FormControl>
                                    <FormLabel className="font-normal cursor-pointer text-sm">
                                      {topic}
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

                  {/* Duʿās & Ziyārāt */}
                  <AccordionItem value="duas">
                    <AccordionTrigger>Duʿās & Ziyārāt</AccordionTrigger>
                    <AccordionContent>
                      <FormField
                        control={form.control}
                        name="topicsDuasZiyarat"
                        render={() => (
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                            {TOPICS_DUAS_ZIYARAT.map(topic => (
                              <FormField
                                key={topic}
                                control={form.control}
                                name="topicsDuasZiyarat"
                                render={({ field }) => (
                                  <FormItem className="flex items-center space-x-2 space-y-0">
                                    <FormControl>
                                      <Checkbox
                                        checked={field.value?.includes(topic)}
                                        onCheckedChange={checked => {
                                          const updatedValue = checked
                                            ? [...(field.value || []), topic]
                                            : field.value?.filter(value => value !== topic) || []
                                          field.onChange(updatedValue)
                                        }}
                                        disabled={isUploading}
                                      />
                                    </FormControl>
                                    <FormLabel className="font-normal cursor-pointer text-sm">
                                      {topic}
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

                  {/* ʿAqāʾid (Beliefs) */}
                  <AccordionItem value="aqaid">
                    <AccordionTrigger>ʿAqāʾid (Beliefs)</AccordionTrigger>
                    <AccordionContent>
                      <FormField
                        control={form.control}
                        name="topicsAqaid"
                        render={() => (
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                            {TOPICS_AQAID.map(topic => (
                              <FormField
                                key={topic}
                                control={form.control}
                                name="topicsAqaid"
                                render={({ field }) => (
                                  <FormItem className="flex items-center space-x-2 space-y-0">
                                    <FormControl>
                                      <Checkbox
                                        checked={field.value?.includes(topic)}
                                        onCheckedChange={checked => {
                                          const updatedValue = checked
                                            ? [...(field.value || []), topic]
                                            : field.value?.filter(value => value !== topic) || []
                                          field.onChange(updatedValue)
                                        }}
                                        disabled={isUploading}
                                      />
                                    </FormControl>
                                    <FormLabel className="font-normal cursor-pointer text-sm">
                                      {topic}
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

                  {/* Fiqh (Islamic Laws) */}
                  <AccordionItem value="fiqh">
                    <AccordionTrigger>Fiqh (Islamic Laws)</AccordionTrigger>
                    <AccordionContent>
                      <FormField
                        control={form.control}
                        name="topicsFiqh"
                        render={() => (
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                            {TOPICS_FIQH.map(topic => (
                              <FormField
                                key={topic}
                                control={form.control}
                                name="topicsFiqh"
                                render={({ field }) => (
                                  <FormItem className="flex items-center space-x-2 space-y-0">
                                    <FormControl>
                                      <Checkbox
                                        checked={field.value?.includes(topic)}
                                        onCheckedChange={checked => {
                                          const updatedValue = checked
                                            ? [...(field.value || []), topic]
                                            : field.value?.filter(value => value !== topic) || []
                                          field.onChange(updatedValue)
                                        }}
                                        disabled={isUploading}
                                      />
                                    </FormControl>
                                    <FormLabel className="font-normal cursor-pointer text-sm">
                                      {topic}
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

                  {/* Akhlāq (Etiquette) */}
                  <AccordionItem value="akhlaq">
                    <AccordionTrigger>Akhlāq (Etiquette)</AccordionTrigger>
                    <AccordionContent>
                      <FormField
                        control={form.control}
                        name="topicsAkhlaq"
                        render={() => (
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                            {TOPICS_AKHLAQ.map(topic => (
                              <FormField
                                key={topic}
                                control={form.control}
                                name="topicsAkhlaq"
                                render={({ field }) => (
                                  <FormItem className="flex items-center space-x-2 space-y-0">
                                    <FormControl>
                                      <Checkbox
                                        checked={field.value?.includes(topic)}
                                        onCheckedChange={checked => {
                                          const updatedValue = checked
                                            ? [...(field.value || []), topic]
                                            : field.value?.filter(value => value !== topic) || []
                                          field.onChange(updatedValue)
                                        }}
                                        disabled={isUploading}
                                      />
                                    </FormControl>
                                    <FormLabel className="font-normal cursor-pointer text-sm">
                                      {topic}
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

                  {/* Tārīkh (Events & Occasions) */}
                  <AccordionItem value="tarikh">
                    <AccordionTrigger>Tārīkh (Events & Occasions)</AccordionTrigger>
                    <AccordionContent>
                      <FormField
                        control={form.control}
                        name="topicsTarikh"
                        render={() => (
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                            {TOPICS_TARIKH.map(topic => (
                              <FormField
                                key={topic}
                                control={form.control}
                                name="topicsTarikh"
                                render={({ field }) => (
                                  <FormItem className="flex items-center space-x-2 space-y-0">
                                    <FormControl>
                                      <Checkbox
                                        checked={field.value?.includes(topic)}
                                        onCheckedChange={checked => {
                                          const updatedValue = checked
                                            ? [...(field.value || []), topic]
                                            : field.value?.filter(value => value !== topic) || []
                                          field.onChange(updatedValue)
                                        }}
                                        disabled={isUploading}
                                      />
                                    </FormControl>
                                    <FormLabel className="font-normal cursor-pointer text-sm">
                                      {topic}
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

                  {/* Personalities */}
                  <AccordionItem value="personalities">
                    <AccordionTrigger>Personalities</AccordionTrigger>
                    <AccordionContent>
                      <FormField
                        control={form.control}
                        name="topicsPersonalities"
                        render={() => (
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                            {TOPICS_PERSONALITIES.map(topic => (
                              <FormField
                                key={topic}
                                control={form.control}
                                name="topicsPersonalities"
                                render={({ field }) => (
                                  <FormItem className="flex items-center space-x-2 space-y-0">
                                    <FormControl>
                                      <Checkbox
                                        checked={field.value?.includes(topic)}
                                        onCheckedChange={checked => {
                                          const updatedValue = checked
                                            ? [...(field.value || []), topic]
                                            : field.value?.filter(value => value !== topic) || []
                                          field.onChange(updatedValue)
                                        }}
                                        disabled={isUploading}
                                      />
                                    </FormControl>
                                    <FormLabel className="font-normal cursor-pointer text-sm">
                                      {topic}
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

                  {/* Islamic Months */}
                  <AccordionItem value="months">
                    <AccordionTrigger>Islamic Months</AccordionTrigger>
                    <AccordionContent>
                      <FormField
                        control={form.control}
                        name="topicsIslamicMonths"
                        render={() => (
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                            {TOPICS_ISLAMIC_MONTHS.map(topic => (
                              <FormField
                                key={topic}
                                control={form.control}
                                name="topicsIslamicMonths"
                                render={({ field }) => (
                                  <FormItem className="flex items-center space-x-2 space-y-0">
                                    <FormControl>
                                      <Checkbox
                                        checked={field.value?.includes(topic)}
                                        onCheckedChange={checked => {
                                          const updatedValue = checked
                                            ? [...(field.value || []), topic]
                                            : field.value?.filter(value => value !== topic) || []
                                          field.onChange(updatedValue)
                                        }}
                                        disabled={isUploading}
                                      />
                                    </FormControl>
                                    <FormLabel className="font-normal cursor-pointer text-sm">
                                      {topic}
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

                  {/* Languages */}
                  <AccordionItem value="languages">
                    <AccordionTrigger>Languages</AccordionTrigger>
                    <AccordionContent>
                      <FormField
                        control={form.control}
                        name="topicsLanguages"
                        render={() => (
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                            {TOPICS_LANGUAGES.map(topic => (
                              <FormField
                                key={topic}
                                control={form.control}
                                name="topicsLanguages"
                                render={({ field }) => (
                                  <FormItem className="flex items-center space-x-2 space-y-0">
                                    <FormControl>
                                      <Checkbox
                                        checked={field.value?.includes(topic)}
                                        onCheckedChange={checked => {
                                          const updatedValue = checked
                                            ? [...(field.value || []), topic]
                                            : field.value?.filter(value => value !== topic) || []
                                          field.onChange(updatedValue)
                                        }}
                                        disabled={isUploading}
                                      />
                                    </FormControl>
                                    <FormLabel className="font-normal cursor-pointer text-sm">
                                      {topic}
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
                </Accordion>
              </CardContent>
            </Card>

            {/* Section 4: Media (Files) */}
            <Card>
              <CardHeader>
                <CardTitle>Media</CardTitle>
                <CardDescription>Upload images and your resource file</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="featuredImage"
                  render={({ field: { value, onChange, ...fieldProps } }) => (
                    <FormItem>
                      <FormLabel>
                        <div className="flex items-center gap-2">
                          <Image className="h-4 w-4" />
                          Featured Image *
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

                <FormField
                  control={form.control}
                  name="resourceFile"
                  render={({ field: { value, onChange, ...fieldProps } }) => (
                    <FormItem>
                      <FormLabel>
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4" />
                          Resource File (PDF) *
                        </div>
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="file"
                          accept="application/pdf"
                          onChange={e => onChange(e.target.files?.[0])}
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

            {/* Section 5: Credits & Legal */}
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

            {/* Submit Button */}
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
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Upload Resource
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

