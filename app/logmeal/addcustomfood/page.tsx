import CustomFoodForm from "@/components/nutrition/CustomFoodForm"

export default async function AddCustomFood() {
  return (
    <div className="flex flex-col items-center justify-start pt-20 pb-24">
      <CustomFoodForm />
    </div>
  )
}