import QRCode from "qrcode";

/**
 * Generate a unique QR token
 */
export function generateQrToken(): string {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let token = "";
    for (let i = 0; i < 24; i++) {
        token += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return token;
}

/**
 * Generate QR code URL for a registration token
 */
export function getQrUrl(token: string): string {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    return `${baseUrl}/r/${token}`;
}

/**
 * Generate QR code as data URL (base64 PNG)
 */
export async function generateQrDataUrl(token: string): Promise<string> {
    const url = getQrUrl(token);
    return QRCode.toDataURL(url, {
        width: 300,
        margin: 2,
        color: {
            dark: "#000000",
            light: "#ffffff",
        },
    });
}

/**
 * Generate QR code as Buffer (for email attachments)
 */
export async function generateQrBuffer(token: string): Promise<Buffer> {
    const url = getQrUrl(token);
    return QRCode.toBuffer(url, {
        width: 300,
        margin: 2,
        type: "png",
    });
}
