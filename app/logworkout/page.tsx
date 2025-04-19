'use client';
import WorkOutForm from "@/components/gym/WorkOutForm";
import { useRouter } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { fetchGymMeta } from "@/actions/InternalLogic";
import { useAuth } from "@clerk/nextjs";

export default function LogWorkoutPage() {
    const { userId, isLoaded } = useAuth();
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

    return (
        <div className="w-full flex justify-center align-center">
            <Suspense fallback={<div>Loading...</div>}>
                <WorkOutForm onSuccess={handleSuccess} gymMeta={gymMeta} />
            </Suspense>
        </div>
    )
}