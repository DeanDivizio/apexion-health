"use client"

import { FoodItemSearch } from "@/actions/USDAlocal"
import { getAllDataFromTableByUser } from "@/actions/AWS"
import { useState, useEffect } from "react"
import type { FoodItem } from "@/utils/newtypes"
import { Apple } from "lucide-react"
import MealSheet from "@/components/nutrition/MealSheet"
import { MobileHeaderContext } from "@/context/MobileHeaderContext"
import { useContext } from "react"
import FoodItemCard, { FoodItemCardSkeleton } from "@/components/nutrition/FoodItemCards"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui_primitives/tabs"
import { Input } from "@/components/ui_primitives/input"
import CustomFoodCard from "@/components/nutrition/CustomFoodCard"
import { Button } from "@/components/ui_primitives/button"
import Link from "next/link"
import BackButton from "@/components/global/BackButton"
import { SideNav } from "@/components/global/SideNav"

export default function LogMeal() {
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<FoodItem[]>()
  const { setHeaderComponentRight, setHeaderComponentLeft, setMobileHeading } = useContext(MobileHeaderContext)
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
    setHeaderComponentLeft(<SideNav />)
    setHeaderComponentRight(<MealSheet />)
    setMobileHeading("Log Food")
    return () => {
      setHeaderComponentRight(null)
      setHeaderComponentLeft(null)
      setMobileHeading("generic")
    }
  }, [setHeaderComponentRight, setHeaderComponentLeft, setMobileHeading])

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
    const results: any = await FoodItemSearch(searchQuery, 25)
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
    <main className="min-h-screen flex flex-col items-center justify-start w-full pt-20 pb-28 bg-gradient-to-br from-green-950/40 to-blue-950/30 via-neutral-950">
      <div className="flex flex-col items-center justify-start w-full h-full">
        <Tabs defaultValue="search" className="w-full flex flex-col items-center justify-center">
          <TabsList className="rounded gap-8 mb-8 p-2">
            <TabsTrigger value="search" className="tracking-wider">Search</TabsTrigger>
            <TabsTrigger value="favorites" className="tracking-wider">Favorites</TabsTrigger>
            <TabsTrigger value="custom" className="tracking-wider">Custom</TabsTrigger>
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
              {!isLoading && searchResults && searchResults.map((result: FoodItem, index: number) => (
                <div key={`${result.name}-${index}`}>
                  <FoodItemCard item={result} />
                </div>
              ))}
              {!searchResults && !isLoading && (
                <div className="flex flex-col h-80 items-center justify-center">
                  <Apple className="w-10 h-10 text-neutral-700 mb-4" />
                  <p className="text-neutral-400 text-sm font-thin italic">Make a search to get started</p>
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
                  <CustomFoodCard 
                    key={index} 
                    {...item} 
                    index={index} 
                    onDelete={() => handleDeleteFavorite(index)}
                  />
                ))
              ) : (
                <div className="flex flex-col h-80 items-center justify-center">
                  <Apple className="w-10 h-10 text-neutral-700 mb-4" />
                  <p className="text-neutral-400 text-sm font-thin italic">No favorite foods yet</p>
                </div>
              )}
            </div>
          </TabsContent>
          <TabsContent value="custom" className="w-screen flex flex-col items-center justify-center">
            <Link href="/logmeal/addcustomfood">
              <Button>
                Add Custom Food
              </Button>
            </Link>
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
                    {...item} 
                    index={index} 
                    onDelete={() => handleDeleteCustomFood(index)}
                  />
                ))
              ) : (
                <div className="flex flex-col h-80 items-center justify-center">
                  <Apple className="w-10 h-10 text-neutral-700 mb-4" />
                  <p className="text-neutral-400 text-sm font-thin italic">No custom foods yet</p>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </main>
  )
}
