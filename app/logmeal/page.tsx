'use client';
import { useRouter } from "next/navigation";


export default function LogWorkoutPage(){
    const router = useRouter();
    function handleSuccess() {
        router.push('/');
    }

    return(
        <div className="flex justify-center">
            <h1>This is where the ui will go</h1>
        </div>
    )
}