'use client';
import HRTForm from "@/components/HRTForm";
import { useRouter } from "next/navigation";
import { Suspense } from "react";

export default function LogHRTPage(){
    const router = useRouter();
    function handleSuccess() {
        router.push('/');
    }

    return(
        <div className="w-full flex justify-center align-center">
            <Suspense fallback={<div>Loading...</div>}>
            <HRTForm onSuccess={handleSuccess}/>
            </Suspense>
        </div>
    )
}