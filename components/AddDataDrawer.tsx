import { Drawer, DrawerPortal, DrawerOverlay, DrawerTrigger, DrawerClose, DrawerContent, DrawerTitle, DrawerDescription, DrawerHeader, DrawerFooter, } from "@/components/ui/drawer";

export default function AddDataDrawer() {
    return(
        <Drawer>
            <DrawerTrigger className="text-2xl font-semibold mb-8 transition hover:text-blue-500">Add Data</DrawerTrigger>
            <DrawerContent className="flex flex-col items-center justify-center max-h-[90vh]">
                {/* <DrawerHeader>
                    <DrawerTitle>Add Data</DrawerTitle>
                    <DrawerDescription>Select a category then fill out the form</DrawerDescription>
                </DrawerHeader> */}
                <form className="flex flex-col justify-center gap-8 w-[30vw] min-w-[350px] pt-12 overflow-y-scroll">
                    <input type="text" placeholder="test" className="bg-neutral-800 p-4 rounded-xl" />
                    <input type="text" placeholder="test" className="bg-neutral-800 p-4 rounded-xl" />
                    <input type="text" placeholder="test" className="bg-neutral-800 p-4 rounded-xl" />
                    <input type="text" placeholder="test" className="bg-neutral-800 p-4 rounded-xl" />
                    <input type="text" placeholder="test" className="bg-neutral-800 p-4 rounded-xl" />
                    <input type="text" placeholder="test" className="bg-neutral-800 p-4 rounded-xl" />
                    <input type="text" placeholder="test" className="bg-neutral-800 p-4 rounded-xl" />
                    <input type="text" placeholder="test" className="bg-neutral-800 p-4 rounded-xl" />
                    <input type="text" placeholder="test" className="bg-neutral-800 p-4 rounded-xl" />
                    <input type="text" placeholder="test" className="bg-neutral-800 p-4 rounded-xl" />
                </form>
                <DrawerFooter>
                    <button>SUBMIT PLACEHOLDER</button>
                </DrawerFooter>
            </DrawerContent>
        </Drawer>
    )
}