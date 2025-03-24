'use client';
import { useRouter } from "next/navigation";
import { Suspense } from "react";
import FoodForm from "@/components/nutrition/FoodForm";


export default function LogMealPage(){
    const router = useRouter();
    function handleSuccess() {
        router.push('/');
    }

    return(
        <div className="w-full flex justify-center align-center">
            <Suspense fallback={<div>Loading...</div>}>
                <FoodForm onSuccess={handleSuccess}/>
            </Suspense>
        </div>
    )
}