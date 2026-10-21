import {createFileRoute} from '@tanstack/react-router'
import {Tabs, TabsContent, TabsList, TabsTrigger} from "@/components/ui/tabs.tsx";
import {Globe, LinkIcon, Loader2} from "lucide-react";
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card.tsx";
import {Field, FieldError, FieldGroup, FieldLabel} from "@/components/ui/field.tsx";
import {useForm} from "@tanstack/react-form";
import {bulkImportSchema, singleImportSchema} from "@/schemas/import.ts";
import {useTransition} from "react";
import {Input} from "@/components/ui/input.tsx";
import {Button} from "@/components/ui/button.tsx";
import {scrapeUrlFn} from "@/data/items.ts";

export const Route = createFileRoute('/dashboard/import')({
    component: RouteComponent,
})

function RouteComponent() {
    const [isPending, startTransition] = useTransition()


    const singleImportForm = useForm({
        defaultValues: {
            url: "",
        },
        validators: {
            onSubmit: singleImportSchema,
        },
        onSubmit: ({value}) => {
            startTransition(async () => {
                await scrapeUrlFn({data: value})
            })
        }
    })

    const bulkImportForm = useForm({
        defaultValues: {
            url: "",
            search: "",
        },
        validators: {
            onSubmit: bulkImportSchema,
        },
        onSubmit: ({value}) => {
            startTransition(async () => {
                console.log(value.url);
            })
        }
    })


    return (
        <div className="flex flex-1 items-center justify-center py-8">
            <div className="w-full max-w-2xl space-y-6 px-4">
                <div className="text-center">
                    <h1 className="text-3xl font-bold">Import Content</h1>
                    <p className="text-muted-foreground pt-1">
                        Save web pages to your library for later reading
                    </p>
                </div>
                <Tabs defaultValue={"single"}>
                    <TabsList className={"grip w-full grid-cols-2"}>
                        <TabsTrigger value={"single"} className={"gap-2"}>
                            <LinkIcon className="size-4"/>
                            Single URL
                        </TabsTrigger>
                        <TabsTrigger value={"bulk"} className={"gap-2"}>
                            <Globe className="size-4"/>
                            Bulk Import
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value={"single"}>
                        <Card>
                            <CardHeader>
                                <CardTitle>Import Single URL</CardTitle>
                                <CardDescription>
                                    Scrape and save content from any web app! 👀
                                </CardDescription>
                            </CardHeader>

                            <CardContent>
                                <form
                                    onSubmit={(e) => {
                                        e.preventDefault()
                                        singleImportForm.handleSubmit()
                                    }}
                                >
                                    <FieldGroup>
                                        <singleImportForm.Field
                                            name="url"
                                            children={(field) => {
                                                const isInvalid =
                                                    field.state.meta.isTouched && !field.state.meta.isValid
                                                return (
                                                    <Field data-invalid={isInvalid}>
                                                        <FieldLabel htmlFor={field.name}>URL</FieldLabel>
                                                        <Input
                                                            id={field.name}
                                                            name={field.name}
                                                            value={field.state.value}
                                                            onBlur={field.handleBlur}
                                                            onChange={(e) => field.handleChange(e.target.value)}
                                                            aria-invalid={isInvalid}
                                                            placeholder="https://tanstack.com/"
                                                            type={"url"}
                                                            autoComplete="off"
                                                        />
                                                        {isInvalid && (
                                                            <FieldError errors={field.state.meta.errors}/>
                                                        )}
                                                    </Field>
                                                )
                                            }}
                                        />
                                        <Field>
                                            <Button disabled={isPending} type="submit">
                                                {isPending ? (
                                                    <>
                                                        <Loader2 className={"size-4 animate-spin"}/>
                                                        "Processing..."
                                                    </>
                                                ) : (
                                                    'Import Url'
                                                )}
                                            </Button>
                                        </Field>
                                    </FieldGroup>
                                </form>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value={"bulk"}>
                        <Card>
                            <CardHeader>
                                <CardTitle>Bulk Import</CardTitle>
                                <CardDescription>
                                    Discover and import multiple URLs from a website at once 🚀
                                </CardDescription>
                            </CardHeader>

                            <CardContent>
                                <form
                                    onSubmit={(e) => {
                                        e.preventDefault()
                                        bulkImportForm.handleSubmit()
                                    }}
                                >
                                    <FieldGroup>
                                        <bulkImportForm.Field
                                            name="url"
                                            children={(field) => {
                                                const isInvalid =
                                                    field.state.meta.isTouched && !field.state.meta.isValid
                                                return (
                                                    <Field data-invalid={isInvalid}>
                                                        <FieldLabel htmlFor={field.name}>URL</FieldLabel>
                                                        <Input
                                                            id={field.name}
                                                            name={field.name}
                                                            value={field.state.value}
                                                            onBlur={field.handleBlur}
                                                            onChange={(e) => field.handleChange(e.target.value)}
                                                            aria-invalid={isInvalid}
                                                            placeholder="https://tanstack.com/"
                                                            type={"url"}
                                                            autoComplete="off"
                                                        />
                                                        {isInvalid && (
                                                            <FieldError errors={field.state.meta.errors}/>
                                                        )}
                                                    </Field>
                                                )
                                            }}
                                        />

                                        <bulkImportForm.Field
                                            name="search"
                                            children={(field) => {
                                                const isInvalid =
                                                    field.state.meta.isTouched && !field.state.meta.isValid
                                                return (
                                                    <Field data-invalid={isInvalid}>
                                                        <FieldLabel htmlFor={field.name}>Filter (optional)</FieldLabel>
                                                        <Input
                                                            id={field.name}
                                                            name={field.name}
                                                            value={field.state.value}
                                                            onBlur={field.handleBlur}
                                                            onChange={(e) => field.handleChange(e.target.value)}
                                                            aria-invalid={isInvalid}
                                                            placeholder="e.g Blog, docs, tutorial"
                                                            type={"string"}
                                                            autoComplete="off"
                                                        />
                                                        {isInvalid && (
                                                            <FieldError errors={field.state.meta.errors}/>
                                                        )}
                                                    </Field>
                                                )
                                            }}
                                        />

                                        <Field>
                                            <Button disabled={isPending} type="submit">
                                                {isPending ? (
                                                    <>
                                                        <Loader2 className={"size-4 animate-spin"}/>
                                                        "Processing..."
                                                    </>
                                                ) : (
                                                    'Import Urls'
                                                )}
                                            </Button>
                                        </Field>
                                    </FieldGroup>
                                </form>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    )
}
