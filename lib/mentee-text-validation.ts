const MIN_MENTEE_WORD_COUNT = 61;

function countWords(value?: string) {
    if (!value) return 0;

    return value
        .trim()
        .split(/\s+/)
        .filter(Boolean).length;
}

export function hasMinimumMenteeWordCount(value?: string) {
    return countWords(value) >= MIN_MENTEE_WORD_COUNT;
}

export function getMenteeWordCountMessage(label: string) {
    return `${label} must have more than 60 words.`;
}
