'use client';
import WorkOutForm from "@/components/gym/WorkOutForm";
import { useRouter } from "next/navigation";
import { StrengthExerciseComponent } from "@/components/strength-exercise";


export default function LogWorkoutPage(){
    const router = useRouter();
    function handleSuccess() {
        router.push('/');
    }

    return(
        <div className="flex justify-center">
            {/* <WorkOutForm onSuccess={handleSuccess}/> */}
            <StrengthExerciseComponent index={1}/>
        </div>
    )
}