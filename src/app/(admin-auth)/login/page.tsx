import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import LoginForm from "./login-form";

export default async function AdminLoginPage() {
    const session = await auth();

    // If user is already logged in as Admin, redirect to dashboard
    if (session && session.user.type === "ADMIN") {
        redirect("/admin");
    }

    return <LoginForm />;
}
