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
      <div className="max-w-2xl mx-auto md:max-w-none md:mx-0 px-4 pt-24 md:pt-6 pb-20 md:pb-0 space-y-6 md:h-full md:flex md:flex-col md:overflow-hidden">
        <h1 className="text-2xl font-semibold shrink-0">Meds</h1>
        <div className="flex flex-col gap-3 md:flex-1 md:overflow-y-auto">
          {Array.from({ length: 5 }, (_, index) => (
            <Skeleton key={index} className="w-full h-[80px] rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto md:max-w-none md:mx-0 px-4 pt-24 md:pt-6 pb-20 md:pb-0 space-y-6 md:h-full md:flex md:flex-col md:overflow-hidden">
      <h1 className="text-2xl font-semibold shrink-0">Meds</h1>

      {/* Mobile: tabs */}
      <div className="md:hidden">
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

      {/* Desktop: two scrollable columns */}
      <div className="hidden md:grid md:grid-cols-2 gap-6 flex-1 min-h-0">
        <div className="flex flex-col min-h-0">
          <h2 className="text-sm font-medium text-neutral-400 uppercase tracking-wider mb-3 shrink-0">Logs</h2>
          <div className="flex-1 overflow-y-auto pr-2">
            <MedicationLogsList
              initialSessions={sessions}
              substances={substances}
              deliveryMethods={deliveryMethods}
            />
          </div>
        </div>
        <div className="flex flex-col min-h-0">
          <h2 className="text-sm font-medium text-neutral-400 uppercase tracking-wider mb-3 shrink-0">Presets</h2>
          <div className="flex-1 overflow-y-auto pr-2">
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
          </div>
        </div>
      </div>
    </div>
  );
}
