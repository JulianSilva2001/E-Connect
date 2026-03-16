import { db } from "@/lib/db";

export const DEFAULT_MENTEE_BATCHES = ["Batch 22", "Batch 23", "Batch 24"];

export function normalizeBatchList(values: string[]) {
    const seen = new Set<string>();

    return values
        .map((value) => value.trim())
        .filter(Boolean)
        .filter((value) => {
            const key = value.toLowerCase();
            if (seen.has(key)) {
                return false;
            }

            seen.add(key);
            return true;
        });
}

export async function getAllowedMenteeBatches() {
    const settings = await db.registrationSettings.findUnique({
        where: { singletonKey: "registration" }
    });

    if (!settings || settings.allowedMenteeBatches.length === 0) {
        return DEFAULT_MENTEE_BATCHES;
    }

    return normalizeBatchList(settings.allowedMenteeBatches);
}
