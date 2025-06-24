export function isStrictValidDate(dateStr: string) {
    const isoRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!isoRegex.test(dateStr)) return false;

    const date = new Date(dateStr);
    return !isNaN(date.getTime()) && dateStr === date.toISOString().slice(0, 10);
}