'use client';
import WorkOutForm from "@/components/gym/WorkOutForm";
import { useRouter } from "next/navigation";


export default function LogWorkoutPage(){
    const router = useRouter();
    function handleSuccess() {
        router.push('/');
    }

    return(
        <div className="flex justify-center">
            <WorkOutForm onSuccess={handleSuccess}/>
        </div>
    )
}