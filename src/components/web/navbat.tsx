import {Button, buttonVariants} from "@/components/ui/button.tsx";
import {ModeToggle} from "@/components/mode-toggle.tsx";
import {Link} from "@tanstack/react-router";
import {authClient} from "@/lib/auth-client.ts";
import {toast} from "sonner";

export function Navbar() {

    const {data: session, isPending} = authClient.useSession();

    const handleLogout = async () => {
        //  登出不需要自己写重定向到登录页的逻辑
        await authClient.signOut({
            fetchOptions: {
                onSuccess: () => {
                    toast.success("Logout successfully")
                },
                onError: ({error}) => {
                    toast.error(error.message)
                }
            }
        })
    }

    return (
        <nav
            className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
            <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
                <div className="flex items-center gap-2">
                    <img
                        src="https://tanstack.com/images/logos/logo-color-banner-600.png"
                        alt="TanStack Start Logo"
                        className="size-10"
                    />
                    <h1 className="text-lg font-semibold">
                        TanStack Start
                    </h1>
                </div>
                <div className="flex items-center gap-3">
                    <ModeToggle/>
                    {
                        isPending ? null :
                            session ? (
                                <>
                                    <Link to={"/"} className={buttonVariants({variant: "secondary"})}>Dashboard</Link>
                                    <Button onClick={handleLogout} >Logout</Button>
                                </>
                            ) : (
                                <>
                                    <Link to={"/login"} className={buttonVariants({variant: "secondary"})}>Login</Link>
                                    <Link to={"/signup"} className={buttonVariants()}>Get Start</Link>
                                </>
                            )
                    }
                </div>
            </div>
        </nav>
    )
}