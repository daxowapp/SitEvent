import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import LoginForm from "./login-form";

export default async function UniversityLoginPage() {
    const session = await auth();

    // If user is already logged in as University, redirect to dashboard
    if (session && session.user.type === "UNIVERSITY") {
        redirect("/university/dashboard");
    }

    return <LoginForm />;
}
