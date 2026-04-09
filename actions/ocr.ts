"use server";

import { auth } from "@clerk/nextjs/server";
import { extractNutritionLabel } from "@/lib/ocr/extractNutritionLabel";
import { extractRetailMenuData } from "@/lib/ocr/extractRetailMenuData";
import { extractSupplementLabel } from "@/lib/ocr/extractSupplementLabel";
import {
  estimateMealFromPhoto,
  refineMealEstimate,
  type PhotoEstimateResponse,
} from "@/lib/ocr/estimateMealFromPhoto";

export async function extractNutritionLabelAction(imageBase64: string) {
  const { userId } = await auth();
  if (!userId) throw new Error("User is not signed in.");
  return extractNutritionLabel(imageBase64, userId);
}

export async function extractRetailMenuAction(
  imageBase64: string,
  chainName: string,
) {
  const { userId } = await auth();
  if (!userId) throw new Error("User is not signed in.");
  return extractRetailMenuData(imageBase64, chainName, userId);
}

export async function extractSupplementLabelAction(imageBase64: string) {
  const { userId } = await auth();
  if (!userId) throw new Error("User is not signed in.");
  return extractSupplementLabel(imageBase64, userId);
}

export async function estimateMealFromPhotoAction(imageBase64: string) {
  const { userId } = await auth();
  if (!userId) throw new Error("User is not signed in.");
  return estimateMealFromPhoto(imageBase64, userId);
}

export async function refineMealEstimateAction(
  imageBase64: string,
  initialEstimate: PhotoEstimateResponse,
  userContext: string,
) {
  const { userId } = await auth();
  if (!userId) throw new Error("User is not signed in.");
  return refineMealEstimate(imageBase64, initialEstimate, userContext, userId);
}
