"use server";

import { auth } from "@clerk/nextjs/server";
import { extractNutritionLabel } from "@/lib/ocr/extractNutritionLabel";
import { extractRetailMenuData } from "@/lib/ocr/extractRetailMenuData";

export async function extractNutritionLabelAction(imageBase64: string) {
  const { userId } = await auth();
  if (!userId) throw new Error("User is not signed in.");
  return extractNutritionLabel(imageBase64);
}

export async function extractRetailMenuAction(
  imageBase64: string,
  chainName: string,
) {
  const { userId } = await auth();
  if (!userId) throw new Error("User is not signed in.");
  return extractRetailMenuData(imageBase64, chainName);
}
