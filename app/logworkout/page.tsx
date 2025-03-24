'use client';
import WorkOutForm from "@/components/gym/WorkOutForm";
import { useRouter } from "next/navigation";
import { Suspense } from "react";

export default function LogWorkoutPage(){
    const router = useRouter();
    function handleSuccess() {
        router.push('/');
    }

    return(
        <div className="w-full flex justify-center align-center">
            <Suspense fallback={<div>Loading...</div>}>
                <WorkOutForm onSuccess={handleSuccess}/>
            </Suspense>
        </div>
    )
}