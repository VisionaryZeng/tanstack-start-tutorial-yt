import {z} from "zod";
import {ItemStatus} from "@/generated/prisma/enums.ts";

export const itemsSearchSchema = z.object({
    q: z.string().default(""),
    status: z.union([z.literal('all'), z.enum(ItemStatus)]).default('all')
});