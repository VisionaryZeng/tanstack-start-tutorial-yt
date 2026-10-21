import {createServerFn} from "@tanstack/react-start";
import {firecrawl} from "@/lib/firecrawl.ts";
import {singleImportSchema} from "@/schemas/import.ts";


export const scrapeUrlFn = createServerFn({method: "POST"}).validator(singleImportSchema).handler(
    async ({data}) => {
        // Scrape a website
        const scrapeResponse = await firecrawl.scrape(data.url, {
            formats: ['markdown'],
            onlyMainContent: true
        });
        console.log(scrapeResponse);
    }
)