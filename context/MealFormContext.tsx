"use client"
import { FoodItem } from '@/utils/newtypes';
import { addItemToTable, updateFavoriteFoodItems } from '@/actions/AWS';
import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { z } from 'zod';
import { useToast } from '@/hooks/use-toast';

export const MealFormSchema = z.object({
  month: z.string(),
  day: z.string(),
  year: z.string(),
  hour: z.string(),
  minute: z.string(),
  ampm: z.string(),
  mealLabel: z.string().optional().or(z.literal('Breakfast')).or(z.literal('Lunch')).or(z.literal('Dinner')).or(z.literal(`Other`)),
});


interface MealItems extends FoodItem {
  numberOfServings: number;
}

interface MealFormContextType {
  mealItems: MealItems[];
  addMealItem: (item: FoodItem) => void;
  removeMealItem: (name: string) => void;
  sheetOpen: boolean;
  setSheetOpen: (open: boolean) => void;
  mealFormData: z.infer<typeof MealFormSchema>;
  setMealFormData: (data: z.infer<typeof MealFormSchema>) => void;
  submitMeal: () => Promise<void>;
  addToFavorites: (item: FoodItem) => void;
  updateFoodItemServings: (name: string, servings: number) => void;
}

const MealFormContext = createContext<MealFormContextType | undefined>(undefined);

export const useMealForm = () => {
  const context = useContext(MealFormContext);
  if (!context) {
    throw new Error('useMealForm must be used within a MealFormProvider');
  }
  return context;
};

interface MealFormProviderProps {
  children: ReactNode;
}

export const MealFormProvider: React.FC<MealFormProviderProps> = ({ children }) => {
  const { toast } = useToast();
  const [mealItems, setMealItems] = useState<MealItems[]>([]);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [mealFormData, setMealFormData] = useState<z.infer<typeof MealFormSchema>>({
    month: '',
    day: '',
    year: '',
    hour: '',
    minute: '',
    ampm: '',
    mealLabel: undefined,
  });

  useEffect(() => {
    const now = new Date();
    setMealFormData({
      month: (now.getMonth() + 1).toString().padStart(2, '0'),
      day: now.getDate().toString().padStart(2, '0'),
      year: now.getFullYear().toString(),
      hour: (now.getHours() % 12 || 12).toString(),
      minute: now.getMinutes().toString().padStart(2, '0'),
      ampm: now.getHours() >= 12 ? 'PM' : 'AM',
      mealLabel: undefined,
    });
  }, []);

  const addMealItem = (item: FoodItem) => {
    setMealItems((prevItems) => [...prevItems, { ...item, numberOfServings: 1 }]);
    toast({
      title: "Food Added",
      description: `${item.name} has been added to your meal`,
      duration: 2000,
    });
  };

  const removeMealItem = (name: string) => {
    setMealItems((prevItems) => prevItems.filter((item) => item.name !== name));
    toast({
      title: "Food Removed",
      description: `${name} has been removed from your meal`,
      duration: 1000,
    });
  };

  const addToFavorites = async (item: FoodItem) => {
    // Remove numberOfServings before saving to favorites
    const { numberOfServings, ...favoriteItem } = item;
    await updateFavoriteFoodItems(favoriteItem)
    console.log('Saving to favorites:', favoriteItem);
    toast({
      title: "Added to Favorites",
      description: `${item.name} has been saved to your favorites`,
      duration: 1000,
    });
  };

  const submitMeal = async () => {
    try {
      const formattedDate = `${mealFormData.year}${mealFormData.month}${mealFormData.day}`;
      const formattedTime = `${mealFormData.hour}:${mealFormData.minute} ${mealFormData.ampm}`;
      const formattedData = {
        ...mealFormData,
        date: formattedDate,
        time: formattedTime,
        mealItems
      };
      const cleanedData = Object.fromEntries(
        Object.entries(formattedData).filter(([key]) => !['day', 'month', 'year', 'hour', 'minute', 'ampm'].includes(key))
      );
      try {
        await addItemToTable(cleanedData, "Apexion-Nutrition");
        setMealItems([]);
        toast({
          title: "Meal Logged",
          description: "Your meal has been successfully logged",
          duration: 1000,
        });
      } catch (error) {
        console.error('Error submitting meal:', error);
        toast({
          title: "Error",
          description: "There has been an error communicating with the database. Please try again",
          variant: "destructive",
          duration: 1500,
        });
      }
      setSheetOpen(false);
    } catch (error) {
      console.error('Error submitting meal:', error);
      toast({
        title: "Error",
        description: "There has been an error communicating with the server. Please try again.",
        variant: "destructive",
        duration: 1500,
      });
    }
  };

  const updateFoodItemServings = (name: string, servings: number) => {
    setMealItems((prevItems) =>
      prevItems.map((item) =>
        item.name === name ? { ...item, numberOfServings: servings } : item
      )
    );
  };

  return (
    <MealFormContext.Provider value={{ 
      mealItems, 
      addMealItem, 
      removeMealItem, 
      sheetOpen, 
      setSheetOpen,
      mealFormData,
      setMealFormData,
      submitMeal,
      addToFavorites,
      updateFoodItemServings
    }}>
      {children}
    </MealFormContext.Provider>
  );
};
