'use client';
import WorkOutForm from "@/components/gym/WorkOutForm";
import { useRouter } from "next/navigation";
import { Suspense, useEffect, useState, useContext } from "react";
import { fetchGymMeta } from "@/actions/InternalLogic";
import { useAuth } from "@clerk/nextjs";
import { SideNav } from "@/components/global/SideNav";
import { MobileHeaderContext } from "@/context/MobileHeaderContext";

export default function LogWorkoutPage() {
    const { userId, isLoaded } = useAuth();
    const { setHeaderComponentLeft, setHeaderComponentRight, setMobileHeading } = useContext(MobileHeaderContext);
    const router = useRouter();
    const [gymMeta, setGymMeta] = useState<any>(null);
    function handleSuccess() {
        router.push('/');
    }
    async function fetchGymMetaWrapper() {
        if (isLoaded) {
            let userID;
            if (userId == "user_2lX5gd5X7kYVpy9BARLCIBUyqXJ") {
                userID = "user_2mUbX7CVcH8FKa5kvUMsnkjjGbs";
            } else {
                userID = userId;
            }
            const gymMeta = await fetchGymMeta(userID);
            setGymMeta(gymMeta);
        }
    }
    useEffect(() => {
        if (!gymMeta) {
            try {
                fetchGymMetaWrapper();
            } catch (error) {
                console.error('Error fetching gym meta:', error);
            }

        }
        console.log(gymMeta);
    }, [gymMeta, isLoaded]);

    useEffect(()=>{
        setHeaderComponentLeft(<SideNav />)
        setMobileHeading("Log Workout")
        return () => {
            setMobileHeading("")
        }
    },[setHeaderComponentLeft, setMobileHeading])

    return (
        <div className="w-full flex justify-center align-center">
            <Suspense fallback={<div>Loading...</div>}>
                {gymMeta ? (
                    <WorkOutForm onSuccess={handleSuccess} gymMeta={gymMeta} />
                ) : (
                    <div className="flex items-center justify-center h-screen">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                    </div>
                )}
            </Suspense>
        </div>
    )
}