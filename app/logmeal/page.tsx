"use client"

import { USDAPostgresSearch } from "@/actions/USDAlocal"
import { getAllDataFromTableByUser } from "@/actions/AWS"
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui_primitives/select"
import { useState, useEffect } from "react"
import type { USDASearchResults } from "@/utils/types"
import { Apple } from "lucide-react"
import MealSheet from "@/components/nutrition/MealSheet"
import { MobileHeaderContext } from "@/context/MobileHeaderContext"
import { useContext } from "react"
import FoodItemCard, { FoodItemCardSkeleton } from "@/components/nutrition/FoodItemCards"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui_primitives/tabs"
import CustomFoodForm from "@/components/nutrition/CustomFoodForm"
import FavoriteFoodCard from "@/components/nutrition/FavoriteFoodCard"
import { Input } from "@/components/ui_primitives/input"
import CustomFoodCard from "@/components/nutrition/CustomFoodCard"

export default function USDATest() {
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<USDASearchResults>()
  const { setHeaderComponent } = useContext(MobileHeaderContext)
  const [favorites, setFavorites] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingFavorites, setIsLoadingFavorites] = useState(false)
  const [customFoodItems, setCustomFoodItems] = useState<any[]>([])

  const handleDeleteFavorite = (index: number) => {
    setFavorites(prevFavorites => prevFavorites.filter((_, i) => i !== index))
  }

  const handleDeleteCustomFood = (index: number) => {
    setCustomFoodItems(prevCustomFoodItems => prevCustomFoodItems.filter((_, i) => i !== index))
  }

  useEffect(() => {
    setHeaderComponent(<MealSheet />)
    return () => {
      setHeaderComponent(null)
    }
  }, [setHeaderComponent])

  useEffect(() => {
    const fetchUserMeta = async () => {
      setIsLoadingFavorites(true)
      try {
        const data = await getAllDataFromTableByUser("Apexion-Nutrition_UserMeta")
        if (data && data.length > 0 && data[0].favoriteFoodItems) {
          setFavorites(data[0].favoriteFoodItems)
        }
        if (data && data.length > 0 && data[0].customFoodItems) {
          setCustomFoodItems(data[0].customFoodItems)
        }
      } catch (error) {
        console.error('Error fetching favorites:', error)
      } finally {
        setIsLoadingFavorites(false)
      }
    }
    fetchUserMeta()
  }, [])

  const handleSearch = async () => {
    setIsLoading(true)
    const results: any = await USDAPostgresSearch(searchQuery, 20)
    setSearchResults(results)
    console.log(results)
    handleScroll()
    setIsLoading(false)
  }

  const handleScroll = () => {
    document.getElementById("search-results")?.scrollIntoView({
      behavior: "smooth",
      block: "start",
      inline: "nearest",
    })
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-start w-full py-28 bg-gradient-to-br from-green-950/40 to-blue-950/30 via-neutral-950">
      <div className="flex flex-col items-center justify-start w-full h-full">
        <div className="flex flex-row items-center justify-center mb-6">
          <h1 className="text-2xl font-medium">Log Food</h1>
        </div>
        <Tabs defaultValue="search" className="w-full flex flex-col items-center justify-center">
          <TabsList className="rounded gap-4 mb-8">
            <TabsTrigger value="search">Search</TabsTrigger>
            <TabsTrigger value="favorites">Favorites</TabsTrigger>
            <TabsTrigger value="custom">Custom</TabsTrigger>
          </TabsList>
          <TabsContent value="search" className="w-full">
            <div className="grid grid-cols-5 gap-2 md:w-2/3 pb-8 px-4">
              <Input
                className="col-span-4 p-4 h-12 rounded-md text-white text-base bg-gradient-to-br from-neutral-950 via-neutral-900/60 to-neutral-950"
                type="text"
                value={searchQuery}
                placeholder="Search for a food item..."
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyUp={(e) => {
                  if (e.key === 'Enter') {
                    handleSearch();
                  }
                }}
              />
              <button
                className="col-span-1 p-2 rounded-md bg-gradient-to-br from-green-400 to-green-700 text-white"
                onClick={handleSearch}
              >
                Search
              </button>
            </div>
            <div id="search-results" className="px-4 scroll-mt-20">
              {!isLoading && searchResults &&
                searchResults.foundation.map((result) => (
                  <div key={result.id}>
                    <FoodItemCard item={result} type="foundation" />
                  </div>
                ))}
              {!isLoading && searchResults &&
                searchResults.branded.map((result) => (
                  <div key={result.id}>
                    <FoodItemCard item={result} type="branded" />
                  </div>
                ))}
              {!searchResults && !isLoading && (
                <div className="flex flex-col h-80 items-center justify-center">
                  <Apple className="w-10 h-10 text-neutral-700 mb-4" />
                  <p className="text-neutral-400 text-sm font-thin italic">Make a selection to get started</p>
                </div>
              )}
              {isLoading && (
                <div className="w-full">
                  <FoodItemCardSkeleton />
                  <FoodItemCardSkeleton />
                  <FoodItemCardSkeleton />
                  <FoodItemCardSkeleton />
                  <FoodItemCardSkeleton />
                  <FoodItemCardSkeleton />
                  <FoodItemCardSkeleton />
                </div>
              )}
            </div>
          </TabsContent>
          <TabsContent value="favorites" className="w-full">
            <div className="px-4 space-y-4">
              {isLoadingFavorites ? (
                <div className="w-full">
                  <FoodItemCardSkeleton />
                  <FoodItemCardSkeleton />
                  <FoodItemCardSkeleton />
                </div>
              ) : favorites.length > 0 ? (
                favorites.map((item, index) => (
                  <FavoriteFoodCard 
                    key={index} 
                    item={item} 
                    index={index} 
                    onDelete={() => handleDeleteFavorite(index)}
                  />
                ))
              ) : (
                <div className="flex flex-col h-80 items-center justify-center">
                  <Apple className="w-10 h-10 text-neutral-700 mb-4" />
                  <p className="text-neutral-400 text-sm font-thin italic">No favorite items yet</p>
                </div>
              )}
            </div>
          </TabsContent>
          <TabsContent value="custom" className="w-screen flex flex-col items-center justify-center">
            <CustomFoodForm />
            <hr className="w-48 mt-4 mb-8 border-neutral-400" />
            <div className="px-4 space-y-4 w-full">
              {isLoadingFavorites ? (
                <div className="w-full">
                  <FoodItemCardSkeleton />
                  <FoodItemCardSkeleton />
                  <FoodItemCardSkeleton />
                </div>
              ) : customFoodItems.length > 0 ? (
                customFoodItems.map((item, index) => (
                  <CustomFoodCard 
                    key={index} 
                    item={item} 
                    index={index} 
                    onDelete={() => handleDeleteCustomFood(index)}
                  />
                ))
              ) : (
                <div className="flex flex-col h-80 items-center justify-center">
                  <Apple className="w-10 h-10 text-neutral-700 mb-4" />
                  <p className="text-neutral-400 text-sm font-thin italic">No favorite items yet</p>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </main>
  )
}
