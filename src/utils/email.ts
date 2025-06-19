export function normalizeEmail(email: string): string {
    const [local, domain] = email.toLowerCase().split('@');
    if (domain === 'gmail.com') {
        return `${local.replace(/\./g, '').split('+')[0]}@gmail.com`;
    }
    return `${local}@${domain}`;
}