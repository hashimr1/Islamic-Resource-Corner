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
  FormDescription,
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
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import {
  GRADES,
  SUBJECTS,
  RESOURCE_TYPES,
  ISLAMIC_TOPICS,
  GENERAL_TOPICS,
} from '@/lib/constants/upload-options'
import { Loader2, Upload, AlertCircle, CheckCircle2, Image, FileText } from 'lucide-react'

// Zod schema for form validation
const uploadFormSchema = z.object({
  // Basic Info
  title: z.string().min(3, 'Title must be at least 3 characters').max(200, 'Title is too long'),
  shortDescription: z
    .string()
    .max(300, 'Short description must be under 300 characters')
    .optional(),
  description: z
    .string()
    .min(20, 'Please provide a detailed description (at least 20 characters)')
    .max(2000, 'Description is too long'),

  // Categorization
  grades: z.array(z.string()).min(1, 'Select at least one grade level'),
  subjects: z.array(z.string()).min(1, 'Select at least one subject'),
  resourceTypes: z.array(z.string()).min(1, 'Select at least one resource type'),
  topicsIslamic: z.array(z.string()).default([]),
  topicsGeneral: z.array(z.string()).default([]),

  // Files
  previewImage: z.instanceof(File).optional(),
  resourceFile: z.instanceof(File, { message: 'Please upload a resource file (PDF)' }),

  // Legal
  credits: z.string().max(200, 'Credits text is too long').optional(),
  copyrightVerified: z.boolean().refine(val => val === true, {
    message: 'You must verify that you have the right to distribute this content',
  }),
})

type UploadFormValues = z.infer<typeof uploadFormSchema>

export default function UploadPage() {
  const router = useRouter()
  const [isUploading, setIsUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [uploadProgress, setUploadProgress] = useState<string>('')

  const form = useForm<UploadFormValues>({
    resolver: zodResolver(uploadFormSchema),
    defaultValues: {
      title: '',
      shortDescription: '',
      description: '',
      grades: [],
      subjects: [],
      resourceTypes: [],
      topicsIslamic: [],
      topicsGeneral: [],
      credits: '',
      copyrightVerified: false,
    },
  })

  async function onSubmit(values: UploadFormValues) {
    setIsUploading(true)
    setUploadError(null)
    setUploadProgress('Preparing upload...')

    try {
      // Step 1: Upload resource file (required)
      setUploadProgress('Uploading resource file...')

      const resourceFormData = new FormData()
      resourceFormData.append('file', values.resourceFile)
      resourceFormData.append('bucket', 'resource-files')

      const resourceFileResponse = await fetch('/api/upload/file', {
        method: 'POST',
        body: resourceFormData,
      })

      const resourceFileResult = await resourceFileResponse.json()

      if (!resourceFileResponse.ok || resourceFileResult.error || !resourceFileResult.url) {
        setUploadError(resourceFileResult.error || 'Failed to upload resource file')
        setIsUploading(false)
        return
      }

      // Step 2: Upload preview image (optional)
      let previewImageUrl: string | undefined
      if (values.previewImage) {
        setUploadProgress('Uploading preview image...')

        const imageFormData = new FormData()
        imageFormData.append('file', values.previewImage)
        imageFormData.append('bucket', 'resource-thumbnails')

        const previewImageResponse = await fetch('/api/upload/file', {
          method: 'POST',
          body: imageFormData,
        })

        const previewImageResult = await previewImageResponse.json()

        if (previewImageResponse.ok && previewImageResult.url) {
          previewImageUrl = previewImageResult.url
        } else {
          console.warn('Preview image upload failed:', previewImageResult.error)
          // Continue anyway - preview image is optional
        }
      }

      // Step 3: Create resource record in database
      setUploadProgress('Creating resource...')

      const createResourceResponse = await fetch('/api/upload/resource', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: values.title,
          shortDescription: values.shortDescription || '',
          description: values.description,
          grades: values.grades,
          subjects: values.subjects,
          resourceTypes: values.resourceTypes,
          topicsIslamic: values.topicsIslamic,
          topicsGeneral: values.topicsGeneral,
          credits: values.credits || '',
          copyrightVerified: values.copyrightVerified,
          fileUrl: resourceFileResult.url,
          previewImageUrl,
          fileSize: values.resourceFile.size,
          fileType: values.resourceFile.type,
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
      router.push(`/resource/${createResourceResult.resource?.slug || createResourceResult.resourceId}`)
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
                <CardDescription>
                  Provide the title and description for your resource
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Resource Title *</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g., Ramadan Worksheet for Year 3"
                          {...field}
                          disabled={isUploading}
                        />
                      </FormControl>
                      <FormDescription>
                        Give your resource a clear, descriptive title
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="shortDescription"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Short Description (Optional)</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="A brief 1-2 sentence summary..."
                          className="resize-none"
                          rows={2}
                          {...field}
                          disabled={isUploading}
                        />
                      </FormControl>
                      <FormDescription>
                        A brief summary that appears in search results (max 300 characters)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Detailed Description *</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Provide a detailed description of your resource, including what it covers, how to use it, and any special instructions..."
                          className="resize-none"
                          rows={6}
                          {...field}
                          disabled={isUploading}
                        />
                      </FormControl>
                      <FormDescription>
                        Help teachers and parents understand how to use this resource effectively
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Section 2: Categorization - Grades */}
            <Card>
              <CardHeader>
                <CardTitle>Target Grades *</CardTitle>
                <CardDescription>Select all grade levels this resource is suitable for</CardDescription>
              </CardHeader>
              <CardContent>
                <FormField
                  control={form.control}
                  name="grades"
                  render={() => (
                    <FormItem>
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                        {GRADES.map(grade => (
                          <FormField
                            key={grade}
                            control={form.control}
                            name="grades"
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
                                <FormLabel className="font-normal cursor-pointer">
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
              </CardContent>
            </Card>

            {/* Section 3: Categorization - Subjects */}
            <Card>
              <CardHeader>
                <CardTitle>Subjects *</CardTitle>
                <CardDescription>
                  Select all subjects this resource covers
                </CardDescription>
              </CardHeader>
              <CardContent>
                <FormField
                  control={form.control}
                  name="subjects"
                  render={() => (
                    <FormItem>
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                        {SUBJECTS.map(subject => (
                          <FormField
                            key={subject}
                            control={form.control}
                            name="subjects"
                            render={({ field }) => (
                              <FormItem className="flex items-center space-x-2 space-y-0">
                                <FormControl>
                                  <Checkbox
                                    checked={field.value?.includes(subject)}
                                    onCheckedChange={checked => {
                                      const updatedValue = checked
                                        ? [...(field.value || []), subject]
                                        : field.value?.filter(value => value !== subject) || []
                                      field.onChange(updatedValue)
                                    }}
                                    disabled={isUploading}
                                  />
                                </FormControl>
                                <FormLabel className="font-normal cursor-pointer">
                                  {subject}
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

            {/* Section 4: Categorization - Resource Types */}
            <Card>
              <CardHeader>
                <CardTitle>Resource Type *</CardTitle>
                <CardDescription>What type of resource is this?</CardDescription>
              </CardHeader>
              <CardContent>
                <FormField
                  control={form.control}
                  name="resourceTypes"
                  render={() => (
                    <FormItem>
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
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
                                <FormLabel className="font-normal cursor-pointer">{type}</FormLabel>
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

            {/* Section 5: Categorization - Islamic Topics (Optional) */}
            <Card>
              <CardHeader>
                <CardTitle>Islamic Topics (Optional)</CardTitle>
                <CardDescription>
                  If your resource covers Islamic topics, select all that apply
                </CardDescription>
              </CardHeader>
              <CardContent>
                <FormField
                  control={form.control}
                  name="topicsIslamic"
                  render={() => (
                    <FormItem>
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                        {ISLAMIC_TOPICS.map(topic => (
                          <FormField
                            key={topic}
                            control={form.control}
                            name="topicsIslamic"
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
                                <FormLabel className="font-normal cursor-pointer">{topic}</FormLabel>
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

            {/* Section 6: Categorization - General Topics (Optional) */}
            <Card>
              <CardHeader>
                <CardTitle>General Topics (Optional)</CardTitle>
                <CardDescription>
                  Select any general educational topics this resource covers
                </CardDescription>
              </CardHeader>
              <CardContent>
                <FormField
                  control={form.control}
                  name="topicsGeneral"
                  render={() => (
                    <FormItem>
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                        {GENERAL_TOPICS.map(topic => (
                          <FormField
                            key={topic}
                            control={form.control}
                            name="topicsGeneral"
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
                                <FormLabel className="font-normal cursor-pointer">{topic}</FormLabel>
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

            {/* Section 7: File Uploads */}
            <Card>
              <CardHeader>
                <CardTitle>Upload Files</CardTitle>
                <CardDescription>
                  Upload your resource file (PDF) and an optional preview image
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="previewImage"
                  render={({ field: { value, onChange, ...fieldProps } }) => (
                    <FormItem>
                      <FormLabel>
                        <div className="flex items-center gap-2">
                          <Image className="h-4 w-4" />
                          Featured Image (Optional)
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
                      <FormDescription>
                        Upload a preview image (JPG, PNG, or WebP, max 5MB)
                      </FormDescription>
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
                      <FormDescription>
                        Upload your resource as a PDF file (max 50MB)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Section 8: Credits & Copyright */}
            <Card>
              <CardHeader>
                <CardTitle>Credits & Copyright</CardTitle>
                <CardDescription>
                  Attribution and copyright verification
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="credits"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Credit To (Optional)</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g., Alkisa Foundation, Sister Raazia"
                          {...field}
                          disabled={isUploading}
                        />
                      </FormControl>
                      <FormDescription>
                        Who should be credited for this resource?
                      </FormDescription>
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
                        <FormDescription>
                          By checking this box, you confirm that you own the copyright to this
                          resource or have permission to share it.
                        </FormDescription>
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

