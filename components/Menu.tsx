import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
  } from "@/components/ui/sheet"
import AddDataDrawer from "./AddDataDrawer"
  
  
export default function Menu() {
    return(
        <Sheet>
            <SheetTrigger className="text-lg tracking-wide px-4 py-1 border border-neutral-600 rounded transistion hover:border-white">Menu</SheetTrigger>
            <SheetContent side={"left"} className=" flex flex-col justify-between pt-32 pb-6">
                <div className="mb-8">
                    <h3 className="text-3xl font-bold mb-4">View</h3>
                    <hr className="mb-4"></hr>
                    <p className="text-2xl font-semibold ml-2 mb-2 transition hover:text-blue-500">Clinical Records</p>
                    <p className="text-2xl font-semibold ml-2 mb-2 transition hover:text-blue-500">Fitness</p>
                    <p className="text-2xl font-semibold ml-2 mb-2 transition hover:text-blue-500">Nutrition</p>
                    <p className="text-2xl font-semibold ml-2 mb-2 transition hover:text-blue-500">Body Measurements</p>
                </div>
                <div>
                    <AddDataDrawer />
                    <p className="text-2xl font-semibold mb-8 transition hover:text-blue-500">Link External Source</p>
                </div>
                <p className="text-xl tracking-wide font-thin ml-2 mb-8 transition hover:text-blue-500">Settings</p>

            </SheetContent>
        </Sheet>
    )
}