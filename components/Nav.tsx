import { SignInButton, UserButton, SignedIn, SignedOut } from "@clerk/nextjs";
import Menu from "./Menu";

export default function Nav() {

    return (
        <div className="flex w-full flex-wrap justify-between items-center px-8 py-4"> {/*probably want to take out wrap eventually and make a dedicated mobile nav*/}
            <div className="min-w-[25vw]">
               <Menu />
            </div>
            <div className="min-w-[30vw] text-center">
                <h2 className="text-6xl font-medium">Apexion</h2>
            </div>
            <div className="min-w-[25vw] text-right">
                <SignedOut>
                    <SignInButton />
                </SignedOut>
                <SignedIn>
                    <UserButton />
                </SignedIn>
            </div>
        </div>
    )
}