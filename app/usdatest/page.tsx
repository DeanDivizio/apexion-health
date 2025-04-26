"use client"

import { USDAPostgresSearch } from "@/actions/USDAlocal"
import { Select, SelectTrigger, SelectContent, SelectItem } from "@/components/ui_primitives/select"
import { Suspense, useState } from "react"
import { USDASearchResults} from "@/utils/types"
import { fromAllCaps } from "@/lib/utils"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui_primitives/card"
import { PlusIcon } from "lucide-react"
import { Skeleton } from "@/components/ui_primitives/skeleton"

function formatUnit(unit: string): string {
    const unitMap: { [key: string]: string } = {
        'GRM': 'grams',
        'ML': 'milliliters',
        'OZ': 'ounces',
        'CUP': 'cups',
        'TSP': 'teaspoons',
        'TBS': 'tablespoons',
        'PKG': 'package',
        'PC': 'piece',
        'SL': 'slice',
        'CN': 'can'
    };
    return unitMap[unit] || unit.toLowerCase();
}

function FoodItemCard({name, calories,brand, serving, carbs, protein, fat}:{name:string, calories:number, brand?:string, serving?:string, carbs?:number, protein?:number, fat?:number}) {
    return (
        <Card className="mb-4 bg-gradient-to-br from-blue-950/20 to-neutral-950">
            <CardHeader className="grid grid-cols-8">
                <div className="col-span-7">
                    <CardTitle className="text-base font-medium">{name}</CardTitle>
                    <CardDescription className="text-sm text-gray-400 font-light italic">{brand}</CardDescription>
                </div>
                <PlusIcon className="col-span-1 text-green-400 hover:text-white transition-colors duration-150 relative -top-4 -right-5" />
            </CardHeader>
            <CardContent className="flex items-center justify-between">
                <p>{calories} <span className="text-sm text-gray-400">calories per {serving ? `${fromAllCaps(serving)}` : "serving"}</span></p>
            </CardContent>
        </Card>
    )
}

function ResultsSkeleton() {
    return (
        <div className="w-5/6 md:w-2/3">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            
        </div>
    )
}

export default function USDATest() {
    const [searchQuery, setSearchQuery] = useState("")
    const [searchResults, setSearchResults] = useState<USDASearchResults>()

    const handleSearch = async () => {
        const results: any = await USDAPostgresSearch(searchQuery, 20)
        setSearchResults(results)
        console.log(results)
    }   

    return (
        <main className="flex flex-col items-center w-full py-24">
            <div className="grid grid-cols-4 gap-2 w-5/6 md:w-2/3 pb-8">
                <input className="col-span-3 p-2 rounded-md text-black" type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                <button className="col-span-1 p-2 rounded-md bg-gradient-to-br from-green-400 to-green-500 text-white" onClick={handleSearch}>Search</button>
            </div>
            <Suspense fallback={<ResultsSkeleton />}>
                <div className="w-5/6 md:w-2/3">
                {searchResults && searchResults.foundation.map((result) => (
                    <div key={result.id}>
                        <FoodItemCard name={fromAllCaps(result.description)} calories={result.macros?.energy?.amount || result.nutrients?.find(n => n.name === "Energy (Atwater General Factors)")?.amount || 0} />
                    </div>
                ))}
                {searchResults && searchResults.branded.map((result) => (
                    <div key={result.id}>
                        <FoodItemCard 
                            name={fromAllCaps(result.description)} 
                            brand={result.brand_owner} 
                            calories={result.label_nutrients?.calories?.value || 0} 
                            serving={result.household_serving || `${result.serving_size} ${formatUnit(result.serving_size_unit)}`} 
                        />
                    </div>
                ))}
            </div>
            </Suspense>
        </main>
    )
}