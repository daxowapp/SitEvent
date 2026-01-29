/**
 * Zoho CRM Integration
 * Handles OAuth2 authentication and lead creation
 */

interface ZohoTokenResponse {
    access_token: string;
    expires_in: number;
    api_domain: string;
    token_type: string;
}

interface ZohoLeadData {
    fullName: string;
    email: string;
    phone: string;
    country: string;
    city: string;
    leadSource?: string;
    campaignId?: string;
    utmSource?: string;
    utmMedium?: string;
    utmCampaign?: string;
    eventTitle?: string;
}

interface ZohoCreateLeadResponse {
    success: boolean;
    leadId?: string;
    error?: string;
}

// Token cache (in-memory, resets on restart)
let cachedToken: { token: string; expiresAt: number } | null = null;

/**
 * Get an access token using the refresh token
 */
async function getAccessToken(): Promise<string> {
    // Return cached token if still valid (with 5-minute buffer)
    if (cachedToken && cachedToken.expiresAt > Date.now() + 5 * 60 * 1000) {
        return cachedToken.token;
    }

    const clientId = process.env.ZOHO_CLIENT_ID;
    const clientSecret = process.env.ZOHO_CLIENT_SECRET;
    const refreshToken = process.env.ZOHO_REFRESH_TOKEN;
    const accountsDomain = process.env.ZOHO_ACCOUNTS_DOMAIN || "https://accounts.zoho.com";

    if (!clientId || !clientSecret || !refreshToken) {
        throw new Error("Zoho CRM credentials not configured");
    }

    const tokenUrl = `${accountsDomain}/oauth/v2/token`;
    const params = new URLSearchParams({
        refresh_token: refreshToken,
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: "refresh_token",
    });

    const response = await fetch(tokenUrl, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: params.toString(),
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to refresh Zoho token: ${errorText}`);
    }

    const data: ZohoTokenResponse = await response.json();

    // Cache the token
    cachedToken = {
        token: data.access_token,
        expiresAt: Date.now() + data.expires_in * 1000,
    };

    return data.access_token;
}

/**
 * Create a lead in Zoho CRM
 */
export async function createZohoLead(leadData: ZohoLeadData): Promise<ZohoCreateLeadResponse> {
    const apiDomain = process.env.ZOHO_API_DOMAIN || "https://www.zohoapis.com";

    // Check if Zoho is configured
    if (!process.env.ZOHO_CLIENT_ID || !process.env.ZOHO_REFRESH_TOKEN) {
        return { success: false, error: "Zoho CRM not configured" };
    }

    try {
        const accessToken = await getAccessToken();

        // Split full name into first and last name
        const nameParts = leadData.fullName.trim().split(" ");
        const lastName = nameParts.pop() || leadData.fullName;
        const firstName = nameParts.join(" ") || "";

        // Build lead record
        const leadRecord: Record<string, any> = {
            Last_Name: lastName,
            First_Name: firstName || undefined,
            Email: leadData.email,
            Phone: leadData.phone,
            Country: leadData.country,
            City: leadData.city,
            Lead_Source: leadData.leadSource || "Event Registration",
            Description: leadData.eventTitle ? `Registered for: ${leadData.eventTitle}` : undefined,
        };

        // Add UTM fields as custom fields (you may need to create these in Zoho)
        // UTM_Source = Event Name for tracking which event the lead came from
        if (leadData.eventTitle) leadRecord.UTM_Source = leadData.eventTitle;
        if (leadData.utmMedium) leadRecord.UTM_Medium = leadData.utmMedium;
        if (leadData.utmCampaign) leadRecord.UTM_Campaign = leadData.utmCampaign;

        // If campaign ID is provided, link to campaign
        // Note: This requires the Campaign module and proper linking setup in Zoho
        // For now, we'll store it as a custom field
        if (leadData.campaignId) leadRecord.Campaign_ID = leadData.campaignId;

        const response = await fetch(`${apiDomain}/crm/v2/Leads`, {
            method: "POST",
            headers: {
                Authorization: `Zoho-oauthtoken ${accessToken}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                data: [leadRecord],
                trigger: ["workflow"], // Trigger workflows if any
            }),
        });

        const result = await response.json();

        if (result.data && result.data[0]?.status === "success") {
            return {
                success: true,
                leadId: result.data[0].details.id,
            };
        }

        // Handle duplicate detection
        if (result.data && result.data[0]?.code === "DUPLICATE_DATA") {
            return {
                success: true, // Consider duplicate as success (already exists)
                leadId: result.data[0].details?.id,
                error: "Duplicate lead detected",
            };
        }

        console.error("Zoho CRM lead creation failed:", result);
        return {
            success: false,
            error: result.data?.[0]?.message || "Unknown error",
        };
    } catch (error: any) {
        console.error("Zoho CRM integration error:", error);
        return {
            success: false,
            error: error.message || "Failed to create lead",
        };
    }
}
