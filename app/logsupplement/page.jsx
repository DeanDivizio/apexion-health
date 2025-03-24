'use client';
import { useRouter } from "next/navigation";
import { Suspense } from "react";
import SupplementForm from "@/components/supplements/SupplementForm";


export default function LogMealPage(){
    const router = useRouter();
    function handleSuccess() {
        router.push('/');
    }

    return(
        <div className="w-full flex justify-center align-center">
            <Suspense fallback={<div>Loading...</div>}>
                <SupplementForm onSuccess={handleSuccess}/>
            </Suspense>
        </div>
    )
}