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
    const readSettings = () =>
        db.registrationSettings.findUnique({
            where: { singletonKey: "registration" }
        });

    let settings = null as Awaited<ReturnType<typeof readSettings>>;
    let lastError: unknown;

    for (let attempt = 0; attempt < 3; attempt += 1) {
        try {
            settings = await readSettings();
            break;
        } catch (error) {
            lastError = error;
            const message = error instanceof Error ? error.message : String(error);
            const isTransient =
                message.includes("Server selection timeout") ||
                message.includes("ReplicaSetNoPrimary") ||
                message.includes("No such host is known") ||
                message.includes("timed out") ||
                message.includes("Connection pool") ||
                message.includes("Raw query failed");

            if (!isTransient || attempt === 2) {
                console.error("Failed to fetch registration settings, using defaults:", lastError);
                return DEFAULT_MENTEE_BATCHES;
            }

            await new Promise((resolve) => setTimeout(resolve, 250 * (attempt + 1)));
        }
    }

    if (!settings || settings.allowedMenteeBatches.length === 0) {
        return DEFAULT_MENTEE_BATCHES;
    }

    return normalizeBatchList(settings.allowedMenteeBatches);
}
