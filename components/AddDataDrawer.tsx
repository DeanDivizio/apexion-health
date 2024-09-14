import { Drawer, DrawerPortal, DrawerOverlay, DrawerTrigger, DrawerClose, DrawerContent, DrawerTitle, DrawerDescription, DrawerHeader, DrawerFooter, } from "@/components/ui/drawer";
import HRTForm from "@/components/HRTForm";

export default function AddDataDrawer() {
    return(
        <Drawer>
            <DrawerTrigger className="text-2xl font-semibold mb-8 transition hover:text-blue-500">Add Data</DrawerTrigger>
            <DrawerContent className="flex flex-col items-center justify-center max-h-[90vh]">
                <HRTForm />
            </DrawerContent>
        </Drawer>
    )
}