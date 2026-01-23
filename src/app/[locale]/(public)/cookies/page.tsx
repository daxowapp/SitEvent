import { setRequestLocale } from 'next-intl/server';
import React from 'react';

export default async function CookiesPage({
    params
}: {
    params: Promise<{ locale: string }>;
}) {
    const { locale } = await params;
    setRequestLocale(locale);

    return (
        <div className="container mx-auto px-4 py-24 max-w-4xl">
            <h1 className="text-4xl font-bold mb-8">Cookie Policy</h1>
            <div className="prose dark:prose-invert max-w-none">
                <p className="mb-4 text-muted-foreground">Last updated: {new Date().toLocaleDateString()}</p>

                <h2 className="text-2xl font-semibold mt-8 mb-4">1. What Are Cookies</h2>
                <p>As is common practice with almost all professional websites this site uses cookies, which are tiny files that are downloaded to your computer, to improve your experience. This page describes what information they gather, how we use it and why we sometimes need to store these cookies. We will also share how you can prevent these cookies from being stored however this may downgrade or 'break' certain elements of the sites functionality.</p>

                <h2 className="text-2xl font-semibold mt-8 mb-4">2. How We Use Cookies</h2>
                <p>We use cookies for a variety of reasons detailed below. Unfortunately in most cases there are no industry standard options for disabling cookies without completely disabling the functionality and features they add to this site. It is recommended that you leave on all cookies if you are not sure whether you need them or not in case they are used to provide a service that you use.</p>

                <h2 className="text-2xl font-semibold mt-8 mb-4">3. Disabling Cookies</h2>
                <p>You can prevent the setting of cookies by adjusting the settings on your browser (see your browser Help for how to do this). Be aware that disabling cookies will affect the functionality of this and many other websites that you visit. Disabling cookies will usually result in also disabling certain functionality and features of this site.</p>

                <h2 className="text-2xl font-semibold mt-8 mb-4">4. The Cookies We Set</h2>
                <ul className="list-disc pl-6 space-y-2 mb-6">
                    <li><strong>Account related cookies:</strong> If you create an account with us then we will use cookies for the management of the signup process and general administration.</li>
                    <li><strong>Login related cookies:</strong> We use cookies when you are logged in so that we can remember this fact. This prevents you from having to log in every single time you visit a new page.</li>
                    <li><strong>Forms related cookies:</strong> When you submit data to through a form such as those found on contact pages or comment forms cookies may be set to remember your user details for future correspondence.</li>
                </ul>
            </div>
        </div>
    );
}
