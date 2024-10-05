'use client';
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup, SelectLabel } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import React, {useState} from "react";

//start unsure
import { z } from "zod";

const setSchema = z.object({
  weight: z.number().min(0, { message: "Weight must be positive" }),
  reps: z.number().min(1, { message: "Reps must be at least 1" }),
});

const strengthExerciseSchema = z.object({
  exerciseType: z.string().nonempty({ message: "Please select an exercise" }),
  sets: z.array(setSchema).min(1, { message: "At least one set is required" }),
});

type StrengthExerciseForm = z.infer<typeof strengthExerciseSchema>;
//end unsure


function SetForm(id:any) {
    return(
        <div>
            <div>
                <FormLabel>Weight:</FormLabel>
                <Input type="number" name={`weight-${id}`} />
            </div>
            <div>
                <FormLabel>Reps:</FormLabel>
                <Input type="number" name={`reps-${id}`} />
            </div>
        </div>
    )
}

export default function StrengthExercise(id:number, form:any) {

    const [sets, setSets] = useState<number[]>([]);

    const addSet = () => {
      setSets((prev) => [...prev, prev.length + 1]);
    };

    return(
        
        <div>
            <div>
                <Select>
                    <SelectTrigger>
                        <SelectValue placeholder="Select Exercise"/>
                    </SelectTrigger>
                    <SelectContent>
                        <SelectGroup>
                            <SelectLabel>Upper Body</SelectLabel>
                            <SelectItem value="arnoldPress">Arnold Press</SelectItem>
                            <SelectItem value="barbellRow">Barbell Row</SelectItem>
                            <SelectItem value="benchPress">Bench Press</SelectItem>
                            <SelectItem value="bicepCurl">Bicep Curl</SelectItem>
                            <SelectItem value="chestFly">Chest Fly</SelectItem>
                            <SelectItem value="chestPress">Chest Press</SelectItem>
                            <SelectItem value="dumbbellPress">Dumbbell Press</SelectItem>
                            <SelectItem value="hammerCurl">Hammer Curl</SelectItem>
                            <SelectItem value="inclinePress">Incline Press</SelectItem>
                            <SelectItem value="latPull">Lateral Pulldown</SelectItem>
                            <SelectItem value="overheadPress">Overhead Press</SelectItem>
                            <SelectItem value="pecFly">Pec Fly</SelectItem>
                            <SelectItem value="pullUp">Pull Up</SelectItem>
                            <SelectItem value="pushUp">Push Up</SelectItem>
                            <SelectItem value="rearDelt">Rear Delt</SelectItem>
                            <SelectItem value="seatedRow">Seated Row</SelectItem>
                            <SelectItem value="shoulderPress">Shoulder Press</SelectItem>
                            <SelectItem value="shrugs">Shrugs</SelectItem>
                            <SelectItem value="tricepExtension">Tricep Extension</SelectItem>
                            <SelectItem value="uprightRow">Upright Row</SelectItem>
                        </SelectGroup>
                        <SelectGroup>
                            <SelectLabel>Lower Body</SelectLabel>
                            <SelectItem value="backSquat">Back Squat</SelectItem>
                            <SelectItem value="boxJump">Box Jump</SelectItem>
                            <SelectItem value="bulgarianSplitSquat">Bulgarian Split Squat</SelectItem>
                            <SelectItem value="calfRaise">Calf Raise</SelectItem>
                            <SelectItem value="deadlift">Deadlift</SelectItem>
                            <SelectItem value="frontSquat">Front Squat</SelectItem>
                            <SelectItem value="gluteBridge">Glute Bridge</SelectItem>
                            <SelectItem value="gobletSquat">Goblet Squat</SelectItem>
                            <SelectItem value="hackSquat">Hack Squat</SelectItem>
                            <SelectItem value="hipThrust">Hip Thrust</SelectItem>
                            <SelectItem value="jumpSquat">Jump Squat</SelectItem>
                            <SelectItem value="kettlebellSwing">Kettlebell Swing</SelectItem>
                            <SelectItem value="lateralLunge">Lateral Lunge</SelectItem>
                            <SelectItem value="legCurl">Leg Curl</SelectItem>
                            <SelectItem value="legExtension">Leg Extension</SelectItem>
                            <SelectItem value="legPress">Leg Press</SelectItem>
                            <SelectItem value="lunge">Lunge</SelectItem>
                            <SelectItem value="romanianDeadlift">Romanian Deadlift</SelectItem>
                            <SelectItem value="stepUp">Step Up</SelectItem>
                            <SelectItem value="sumoDeadlift">Sumo Deadlift</SelectItem>
                        </SelectGroup>
                    </SelectContent>
                </Select>
            </div>
            <SetForm key={id} id={id} />
            <Button type="button" variant={"secondary"} onClick={addSet}>Add Set</Button>
        </div>
    )
}