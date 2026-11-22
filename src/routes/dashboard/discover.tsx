import { createFileRoute } from '@tanstack/react-router'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card.tsx'
import { Loader2, Sparkles } from 'lucide-react'
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from '@/components/ui/field.tsx'
import { Input } from '@/components/ui/input.tsx'
import { Button } from '@/components/ui/button.tsx'
import { Checkbox } from '@/components/ui/checkbox.tsx'
import { useForm } from '@tanstack/react-form'
import { bulkScrapeUrlFn, searchWebFn } from '@/data/items.ts'
import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import type { SearchResultWeb } from 'firecrawl'
import { discoverSearchSchema } from '@/schemas/item.ts'
import { type BulkScrapeProgress, ProgressStatus } from '@/lib/types.ts'
import { Progress } from '@/components/ui/progress.tsx'

export const Route = createFileRoute('/dashboard/discover')({
  component: RouteComponent,
})

function RouteComponent() {
  const [discoveredLinks, setDiscoveredLinks] = useState<
    Array<SearchResultWeb>
  >([])

  const [selectedUrls, setSelectedUrls] = useState<Set<string>>(new Set())

  const [isPending, startTransition] = useTransition()

  const [progress, setProgress] = useState<BulkScrapeProgress | null>(null)

  const handleSelectedOne = (url: string) => {
    const newSelectedUrls = new Set(selectedUrls)
    if (selectedUrls.has(url)) {
      newSelectedUrls.delete(url)
    } else {
      newSelectedUrls.add(url)
    }
    setSelectedUrls(newSelectedUrls)
  }

  const handleSelectedAll = () => {
    if (selectedUrls.size == discoveredLinks.length) {
      setSelectedUrls(new Set())
    } else {
      setSelectedUrls(new Set(discoveredLinks.map((link) => link.url)))
    }
  }

  const searchWebForm = useForm({
    defaultValues: {
      query: '',
    },
    validators: {
      onSubmit: discoverSearchSchema,
    },
    onSubmit: ({ value }) => {
      startTransition(async () => {
        const data = await searchWebFn({ data: value })
        setDiscoveredLinks(data)
      })
    },
  })

  const [isBulkPending, startBulkTransition] = useTransition()

  function handleBulkScrape() {
    startBulkTransition(async () => {
      if (selectedUrls.size === 0) {
        toast.error('Please select at least one URL to import')
        return
      }

      setProgress({
        completed: 0,
        total: selectedUrls.size,
        url: '',
        status: ProgressStatus.SUCCESS,
      })

      let successCount = 0
      let failedCount = 0

      for await (const progress of await bulkScrapeUrlFn({
        data: { urls: Array.from(selectedUrls) },
      })) {
        setProgress(progress)

        if (progress.status == ProgressStatus.SUCCESS) {
          successCount++
        } else {
          failedCount++
        }
      }
      setProgress(null)
      if (failedCount > 0) {
        toast.success(`scraped ${successCount} URLs ${failedCount} failed`)
      } else {
        toast.success(`${selectedUrls.size} URLs scraped successfully!`)
      }
    })
  }

  return (
    <div className={'flex flex-1 items-center justify-center py-8'}>
      <div className={'w-full max-w-2xl space-y-6 px-4'}>
        <div className={'text-center'}>
          <h1 className={'text-3xl font-bold'}>Discover</h1>
          <p className={'text-muted-foreground pt-2'}>
            Search the web for articles on any topic.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>
              <Sparkles className={'size-5'} />
              Topic Search
            </CardTitle>
            <CardDescription>
              Search the web for content and import what you find interesting
            </CardDescription>
          </CardHeader>
          <CardContent className={'space-y-6'}>
            <form
              onSubmit={(e) => {
                e.preventDefault()
                void searchWebForm.handleSubmit()
              }}
            >
              <FieldGroup>
                <searchWebForm.Field
                  name="query"
                  children={(field) => {
                    const isInvalid =
                      field.state.meta.isTouched && !field.state.meta.isValid
                    return (
                      <Field data-invalid={isInvalid}>
                        <FieldLabel htmlFor={field.name}>
                          Search Query
                        </FieldLabel>
                        <Input
                          id={field.name}
                          name={field.name}
                          value={field.state.value}
                          onBlur={field.handleBlur}
                          onChange={(e) => field.handleChange(e.target.value)}
                          aria-invalid={isInvalid}
                          placeholder="e.g., React Server Components tutorial"
                          type={'string'}
                          autoComplete="off"
                        />
                        {isInvalid && (
                          <FieldError errors={field.state.meta.errors} />
                        )}
                      </Field>
                    )
                  }}
                />

                <Field>
                  <Button disabled={isPending} type="submit">
                    {isPending ? (
                      <>
                        <Loader2 className={'size-4 animate-spin'} />
                        "Searching..."
                      </>
                    ) : (
                      'Search Web'
                    )}
                  </Button>
                </Field>
              </FieldGroup>
            </form>
            {discoveredLinks.length > 0 && (
              <div className={'space-y-4'}>
                <div className={'flex items-center justify-between'}>
                  <p className={'text-sm font-medium'}>
                    Found {discoveredLinks.length} URLs
                  </p>

                  <Button
                    onClick={handleSelectedAll}
                    variant={'outline'}
                    size={'sm'}
                  >
                    {selectedUrls.size == discoveredLinks.length
                      ? 'Deselect All'
                      : 'Select All'}
                  </Button>
                </div>

                <div
                  className={
                    'max-h-80 space-y-2 overflow-auto rounded-md border p-4'
                  }
                >
                  {discoveredLinks.map((link) => (
                    <label
                      key={link.url}
                      className={
                        'hover:bg-muted/50 flex cursor-pointer items-center gap-3 rounded-md p-2'
                      }
                    >
                      <Checkbox
                        checked={selectedUrls.has(link.url)}
                        onCheckedChange={() => handleSelectedOne(link.url)}
                        className={'mt-0.5'}
                      />

                      <div className={'min-w-0 flex-1'}>
                        <p className={'truncate text-sm font-medium'}>
                          {link.title ?? 'Title has not been found'}
                        </p>

                        <p className={'text-muted-foreground truncate text-xs'}>
                          {link.description ?? 'Description has not been found'}
                        </p>

                        <p className={'text-muted-foreground truncate text-xs'}>
                          {link.url}
                        </p>
                      </div>
                    </label>
                  ))}
                </div>

                {progress && (
                  <div className={'space-y-2'}>
                    <div
                      className={'flex items-center justify-between text-sm'}
                    >
                      <span className={'text-muted-foreground'}>
                        Scraping: {progress.completed} / {progress.total}
                      </span>
                      <span className={'font-medium'}>
                        {Math.round(progress.completed / progress.total) * 100}
                      </span>
                    </div>
                    <Progress
                      value={(progress.completed / progress.total) * 100}
                    />
                  </div>
                )}

                <Button
                  disabled={isBulkPending}
                  onClick={handleBulkScrape}
                  className={'w-full'}
                  type={'button'}
                >
                  {isBulkPending ? (
                    <>
                      <Loader2 className={'size-4 animate-spin'} />
                      {progress
                        ? `Scraping ${progress.completed} / ${progress.total}...`
                        : 'Scraping...'}
                    </>
                  ) : (
                    `Scrape ${selectedUrls.size} URLs`
                  )}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
