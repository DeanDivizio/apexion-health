"use client";

import { useEffect, useState } from "react";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui_primitives/tabs";
import { Skeleton } from "@/components/ui_primitives/skeleton";
import { useToast } from "@/hooks/use-toast";
import {
  getMedicationBootstrapAction,
  listMedicationLogSessionsAction,
} from "@/actions/medication";
import { MedicationLogsList } from "./MedicationLogsList";
import { MedPresetsList } from "./MedPresetsList";
import type {
  MedicationLogSessionView,
  MedicationPresetView,
  SubstanceCatalogItemView,
  SubstanceDeliveryMethodView,
} from "@/lib/medication";

export function MedicationCollection() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [substances, setSubstances] = useState<SubstanceCatalogItemView[]>([]);
  const [deliveryMethods, setDeliveryMethods] = useState<
    SubstanceDeliveryMethodView[]
  >([]);
  const [presets, setPresets] = useState<MedicationPresetView[]>([]);
  const [sessions, setSessions] = useState<MedicationLogSessionView[]>([]);

  useEffect(() => {
    const load = async () => {
      try {
        const [bootstrap, list] = await Promise.all([
          getMedicationBootstrapAction(),
          listMedicationLogSessionsAction(),
        ]);
        setSubstances(bootstrap.substances);
        setDeliveryMethods(bootstrap.deliveryMethods);
        setPresets(bootstrap.presets);
        setSessions(list);
      } catch {
        toast({
          title: "Error",
          description: "Failed to load medication data.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [toast]);

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 pt-24 md:pt-6 pb-20 space-y-6">
        <h1 className="text-2xl font-semibold">Meds</h1>
        <div className="flex flex-col gap-3">
          {Array.from({ length: 5 }, (_, index) => (
            <Skeleton key={index} className="w-full h-[80px] rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 pt-24 md:pt-6 pb-20 space-y-6">
      <h1 className="text-2xl font-semibold">Meds</h1>
      <Tabs defaultValue="logs">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="logs">Logs</TabsTrigger>
          <TabsTrigger value="presets">Presets</TabsTrigger>
        </TabsList>
        <TabsContent value="logs" className="mt-4">
          <MedicationLogsList
            initialSessions={sessions}
            substances={substances}
            deliveryMethods={deliveryMethods}
          />
        </TabsContent>
        <TabsContent value="presets" className="mt-4">
          <MedPresetsList
            initialPresets={presets}
            substances={substances}
            onCreateNewSubstance={() => {
              toast({
                title: "Create substances",
                description:
                  "Use the Log Medication page to create new substances.",
              });
            }}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
