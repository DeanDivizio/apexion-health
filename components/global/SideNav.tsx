import {Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger} from "@/components/ui_primitives/sheet";
import {MenuIcon} from "lucide-react";

export function SideNav() {
    return (
        <Sheet >
            <SheetTrigger>
                <MenuIcon />
            </SheetTrigger>
            <SheetContent side="left">
                <SheetHeader>
                    <SheetTitle>Menu</SheetTitle>
                </SheetHeader>
            </SheetContent>
        </Sheet>
    )
}