// import {Button} from "#/components/ui/button.tsx";

import {Button} from "@/components/ui/button.tsx";
import {ModeToggle} from "@/components/mode-toggle.tsx";

export function Navbar() {

    return (
        <nav className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
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
                    <Button variant={"secondary"}>Login</Button>
                    <Button>Get Start</Button>
                </div>
            </div>
        </nav>
    )
}