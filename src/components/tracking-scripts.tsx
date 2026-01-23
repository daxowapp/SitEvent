"use client";

import Script from "next/script";

interface TrackingScriptsProps {
    gaTrackingId?: string | null;
    fbPixelId?: string | null;
    linkedInPartnerId?: string | null;
    tiktokPixelId?: string | null;
    snapPixelId?: string | null;
    customHeadScript?: string | null;
    customBodyScript?: string | null;
}

export function TrackingScripts({
    gaTrackingId,
    fbPixelId,
    linkedInPartnerId,
    tiktokPixelId,
    snapPixelId,
    customHeadScript,
    customBodyScript,
}: TrackingScriptsProps) {
    return (
        <>
            {/* Google Analytics */}
            {gaTrackingId && (
                <>
                    <Script
                        src={`https://www.googletagmanager.com/gtag/js?id=${gaTrackingId}`}
                        strategy="afterInteractive"
                    />
                    <Script id="google-analytics" strategy="afterInteractive">
                        {`
                            window.dataLayer = window.dataLayer || [];
                            function gtag(){dataLayer.push(arguments);}
                            gtag('js', new Date());
                            gtag('config', '${gaTrackingId}');
                        `}
                    </Script>
                </>
            )}

            {/* Facebook Pixel */}
            {fbPixelId && (
                <Script id="facebook-pixel" strategy="afterInteractive">
                    {`
                        !function(f,b,e,v,n,t,s)
                        {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
                        n.callMethod.apply(n,arguments):n.queue.push(arguments)};
                        if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
                        n.queue=[];t=b.createElement(e);t.async=!0;
                        t.src=v;s=b.getElementsByTagName(e)[0];
                        s.parentNode.insertBefore(t,s)}(window, document,'script',
                        'https://connect.facebook.net/en_US/fbevents.js');
                        fbq('init', '${fbPixelId}');
                        fbq('track', 'PageView');
                    `}
                </Script>
            )}

            {/* LinkedIn Insight Tag */}
            {linkedInPartnerId && (
                <Script id="linkedin-insight" strategy="afterInteractive">
                    {`
                        _linkedin_partner_id = "${linkedInPartnerId}";
                        window._linkedin_data_partner_ids = window._linkedin_data_partner_ids || [];
                        window._linkedin_data_partner_ids.push(_linkedin_partner_id);
                        (function(l) {
                            if (!l){window.lintrk = function(a,b){window.lintrk.q.push([a,b])};
                            window.lintrk.q=[]}
                            var s = document.getElementsByTagName("script")[0];
                            var b = document.createElement("script");
                            b.type = "text/javascript";b.async = true;
                            b.src = "https://snap.licdn.com/li.lms-analytics/insight.min.js";
                            s.parentNode.insertBefore(b, s);})(window.lintrk);
                    `}
                </Script>
            )}

            {/* TikTok Pixel */}
            {tiktokPixelId && (
                <Script id="tiktok-pixel" strategy="afterInteractive">
                    {`
                        !function (w, d, t) {
                            w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie"],ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);ttq.instance=function(t){for(var e=ttq._i[t]||[],n=0;n<ttq.methods.length;n++)ttq.setAndDefer(e,ttq.methods[n]);return e},ttq.load=function(e,n){var i="https://analytics.tiktok.com/i18n/pixel/events.js";ttq._i=ttq._i||{},ttq._i[e]=[],ttq._i[e]._u=i,ttq._t=ttq._t||{},ttq._t[e]=+new Date,ttq._o=ttq._o||{},ttq._o[e]=n||{};var o=document.createElement("script");o.type="text/javascript",o.async=!0,o.src=i+"?sdkid="+e+"&lib="+t;var a=document.getElementsByTagName("script")[0];a.parentNode.insertBefore(o,a)};
                            ttq.load('${tiktokPixelId}');
                            ttq.page();
                        }(window, document, 'ttq');
                    `}
                </Script>
            )}

            {/* Snapchat Pixel */}
            {snapPixelId && (
                <Script id="snapchat-pixel" strategy="afterInteractive">
                    {`
                        (function(e,t,n){if(e.snaptr)return;var a=e.snaptr=function()
                        {a.handleRequest?a.handleRequest.apply(a,arguments):a.queue.push(arguments)};
                        a.queue=[];var s='script';r=t.createElement(s);r.async=!0;
                        r.src=n;var u=t.getElementsByTagName(s)[0];
                        u.parentNode.insertBefore(r,u);})(window,document,
                        'https://sc-static.net/scevent.min.js');
                        snaptr('init', '${snapPixelId}', {});
                        snaptr('track', 'PAGE_VIEW');
                    `}
                </Script>
            )}

            {/* Custom Head Script */}
            {customHeadScript && (
                <Script id="custom-head-script" strategy="afterInteractive">
                    {customHeadScript}
                </Script>
            )}

            {/* Custom Body Script */}
            {customBodyScript && (
                <Script id="custom-body-script" strategy="lazyOnload">
                    {customBodyScript}
                </Script>
            )}
        </>
    );
}
