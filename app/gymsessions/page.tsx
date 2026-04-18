"use client"

import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui_primitives/tabs"
import { CustomExercisesList } from "./components/CustomExercisesList"
import { SessionsList } from "./components/SessionsList"

export default function GymSessionsPage() {
  return (
    <div className="max-w-2xl mx-auto md:max-w-none md:mx-0 px-4 pt-24 md:pt-6 pb-20 md:pb-0 space-y-6 md:h-full md:flex md:flex-col md:overflow-hidden">
      <h1 className="text-2xl font-semibold shrink-0">Gym</h1>

      {/* Mobile: tabs */}
      <div className="md:hidden">
        <Tabs defaultValue="sessions">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="sessions">Sessions</TabsTrigger>
            <TabsTrigger value="custom">Custom Exercises</TabsTrigger>
          </TabsList>
          <TabsContent value="sessions" className="mt-4">
            <SessionsList />
          </TabsContent>
          <TabsContent value="custom" className="mt-4">
            <CustomExercisesList />
          </TabsContent>
        </Tabs>
      </div>

      {/* Desktop: two scrollable columns */}
      <div className="hidden md:grid md:grid-cols-2 gap-6 flex-1 min-h-0">
        <div className="flex flex-col min-h-0">
          <h2 className="text-sm font-medium text-neutral-400 uppercase tracking-wider mb-3 shrink-0">
            Sessions
          </h2>
          <div className="flex-1 overflow-y-auto pr-2">
            <SessionsList />
          </div>
        </div>
        <div className="flex flex-col min-h-0">
          <h2 className="text-sm font-medium text-neutral-400 uppercase tracking-wider mb-3 shrink-0">
            Custom Exercises
          </h2>
          <div className="flex-1 overflow-y-auto pr-2">
            <CustomExercisesList />
          </div>
        </div>
      </div>
    </div>
  )
}
