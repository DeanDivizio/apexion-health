#!/usr/bin/env python3

import psycopg2
import psycopg2.extras
import uuid
from datetime import datetime
import json

# Database connection parameters - update these with your values
DB_PARAMS = {
    "host": "yourhost",
    "database": "your_database",
    "user": "postgres",
    "password": "your_password",
    "port": 5432
}

def create_tables(conn):
    """Create the necessary tables if they don't exist"""
    with conn.cursor() as cur:
      
        cur.execute("""
        CREATE TABLE IF NOT EXISTS restaurantBranded (
            id SERIAL PRIMARY KEY,
            apexionID TEXT UNIQUE NOT NULL,
            fdcID INTEGER,
            name TEXT NOT NULL,
            variationLabels JSONB,
            brand TEXT,
            nutrients JSONB,
            servingInfo JSONB,
            ingredients TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
        """)
        conn.commit()

def get_float_input(prompt):
    while True:
        try:
            value = input(prompt)
            if value.lower() == 'q':
                return 'q'
            if value.lower() == 'n':
                return None
            if value.lower() == 'qq':
                return 'qq'
            return float(value)
        except ValueError:
            print("Please enter a valid number, 'n' for null, 'q' to quit current item, or 'qq' to quit program")

def get_string_input(prompt):
    value = input(prompt)
    if value.lower() == 'q':
        return 'q'
    if value.lower() == 'n':
        return None
    if value.lower() == 'qq':
        return 'qq'
    return value

def get_string_array_input(prompt):
    value = input(prompt)
    if value.lower() == 'q':
        return 'q'
    if value.lower() == 'n':
        return None
    if value.lower() == 'qq':
        return 'qq'
    return [v.strip() for v in value.split(',')] if value else None

def insert_food_item(conn, brand, item_data):
    """Insert a single food item into the database"""
    with conn.cursor() as cur:
        try:
            apexion_id = str(uuid.uuid4())
            
            # Insert the food item
            cur.execute("""
                INSERT INTO restaurantBranded (
                    apexionID, fdcID, name, variationLabels, brand,
                    nutrients, servingInfo, ingredients
                ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
            """, (
                apexion_id, 
                item_data['fdcID'] if item_data['fdcID'] is not None else None,
                item_data['name'], 
                json.dumps(item_data['variationLabels']), 
                brand,
                json.dumps(item_data['nutrients']), 
                json.dumps(item_data['servingInfo']),
                item_data['ingredients']
            ))
            conn.commit()
            return True
        except Exception as e:
            print(f"Error inserting item: {e}")
            conn.rollback()
            return False

def main():
    print("Restaurant Nutrition Data Entry Tool")
    print("Enter 'q' at any prompt to quit the current item")
    print("Enter 'n' at any prompt to set value as null")
    print("Enter 'qq' at any prompt to quit the program\n")
    
    # Connect to the database
    try:
        conn = psycopg2.connect(**DB_PARAMS)
        create_tables(conn)
    except Exception as e:
        print(f"Error connecting to database: {e}")
        return
    
    brand = get_string_input("Enter brand name: ")
    if brand == 'qq':
        conn.close()
        return
    if not brand:
        conn.close()
        return

    # Ask about FDC IDs
    use_fdc_ids = get_string_input("Will any items have FDC IDs? (y/n): ")
    if use_fdc_ids == 'qq':
        conn.close()
        return
    if use_fdc_ids == 'q':
        conn.close()
        return

    # Convert use_fdc_ids to boolean
    use_fdc_ids = use_fdc_ids.lower() == 'y' if use_fdc_ids else False

    # Ask about global serving size
    use_global_serving = get_string_input("Would you like to use the same serving size for all items? (y/n): ")
    if use_global_serving == 'qq':
        conn.close()
        return
    if use_global_serving == 'q':
        conn.close()
        return

    # Convert use_global_serving to boolean
    use_global_serving = use_global_serving.lower() == 'y' if use_global_serving else False

    global_serving_size = None
    global_serving_unit = None
    if use_global_serving:
        print("\nEnter global serving information:")
        global_serving_size = get_float_input("Serving size (or 'n' for none): ")
        if global_serving_size == 'qq':
            conn.close()
            return
        if global_serving_size == 'q':
            conn.close()
            return

        global_serving_unit = get_string_input("Serving unit (or 'n' for none): ")
        if global_serving_unit == 'qq':
            conn.close()
            return
        if global_serving_unit == 'q':
            conn.close()
            return

    # Ask about global variation labels
    use_global_variations = get_string_input("Would you like to use the same variation labels for all items? (y/n): ")
    if use_global_variations == 'qq':
        conn.close()
        return
    if use_global_variations == 'q':
        conn.close()
        return

    # Convert use_global_variations to boolean
    use_global_variations = use_global_variations.lower() == 'y' if use_global_variations else False

    global_variation_labels = None
    if use_global_variations:
        global_variation_labels = get_string_array_input("Variation labels (comma-separated, or 'n' for none): ")
        if global_variation_labels == 'qq':
            conn.close()
            return
        if global_variation_labels == 'q':
            conn.close()
            return
    
    while True:
        print("\nEnter new food item (or 'qq' to quit):")
        item_name = get_string_input("Item name: ")
        if item_name == 'qq':
            break
        if item_name == 'q':
            continue
        
        # Handle FDC ID based on initial choice
        fdc_id = None
        if use_fdc_ids:
            fdc_id = get_float_input("FDC ID (or 'n' for none): ")
            if fdc_id == 'qq':
                break
            if fdc_id == 'q':
                continue
            
        # Use global variation labels if set, otherwise prompt
        variation_labels = global_variation_labels
        if not use_global_variations:
            variation_labels = get_string_array_input("Variation labels (comma-separated, or 'n' for none): ")
            if variation_labels == 'qq':
                break
            if variation_labels == 'q':
                continue
        
        # Use global serving info if set, otherwise prompt
        serving_size = global_serving_size
        serving_unit = global_serving_unit
        if not use_global_serving:
            print("\nEnter serving information:")
            serving_size = get_float_input("Serving size (or 'n' for none): ")
            if serving_size == 'qq':
                break
            if serving_size == 'q':
                continue
                
            serving_unit = get_string_input("Serving unit (or 'n' for none): ")
            if serving_unit == 'qq':
                break
            if serving_unit == 'q':
                continue
            
        print("\nEnter nutrient information:")
        calories = get_float_input("Calories (or 'n' for none): ")
        if calories == 'qq':
            break
        if calories == 'q':
            continue
            
        protein = get_float_input("Protein (g) (or 'n' for none): ")
        if protein == 'qq':
            break
        if protein == 'q':
            continue
            
        print("\nEnter fat information:")
        total_fat = get_float_input("Total fat (g) (or 'n' for none): ")
        if total_fat == 'qq':
            break
        if total_fat == 'q':
            continue
            
        saturated_fat = get_float_input("Saturated fat (g) (or 'n' for none): ")
        if saturated_fat == 'qq':
            break
        if saturated_fat == 'q':
            continue
            
        trans_fat = get_float_input("Trans fat (g) (or 'n' for none): ")
        if trans_fat == 'qq':
            break
        if trans_fat == 'q':
            continue
            
        carbs = get_float_input("Carbohydrates (g) (or 'n' for none): ")
        if carbs == 'qq':
            break
        if carbs == 'q':
            continue
            
        fiber = get_float_input("Fiber (g) (or 'n' for none): ")
        if fiber == 'qq':
            break
        if fiber == 'q':
            continue
            
        sugar = get_float_input("Sugar (g) (or 'n' for none): ")
        if sugar == 'qq':
            break
        if sugar == 'q':
            continue
            
        cholesterol = get_float_input("Cholesterol (mg) (or 'n' for none): ")
        if cholesterol == 'qq':
            break
        if cholesterol == 'q':
            continue
            
        sodium = get_float_input("Sodium (mg) (or 'n' for none): ")
        if sodium == 'qq':
            break
        if sodium == 'q':
            continue
            
        calcium = get_float_input("Calcium (mg) (or 'n' for none): ")
        if calcium == 'qq':
            break
        if calcium == 'q':
            continue
            
        iron = get_float_input("Iron (mg) (or 'n' for none): ")
        if iron == 'qq':
            break
        if iron == 'q':
            continue
            
        potassium = get_float_input("Potassium (mg) (or 'n' for none): ")
        if potassium == 'qq':
            break
        if potassium == 'q':
            continue
            
        ingredients = get_string_input("Ingredients (or 'n' for none): ")
        if ingredients == 'qq':
            break
        if ingredients == 'q':
            continue
        
        # Prepare item data
        item_data = {
            'fdcID': fdc_id,
            'name': item_name,
            'variationLabels': variation_labels,
            'servingInfo': {
                'size': serving_size,
                'unit': serving_unit
            },
            'nutrients': {
                'calories': calories,
                'protein': protein,
                'carbs': carbs,
                'fats': {
                    'total': total_fat,
                    'saturated': saturated_fat,
                    'trans': trans_fat
                },
                'sugars': sugar,
                'fiber': fiber,
                'cholesterol': cholesterol,
                'sodium': sodium,
                'calcium': calcium,
                'iron': iron,
                'potassium': potassium
            },
            'ingredients': ingredients
        }
        
        # Insert into database
        if insert_food_item(conn, brand, item_data):
            print(f"\nItem '{item_name}' added successfully to the database!")
        else:
            print(f"\nFailed to add item '{item_name}' to the database.")
        
        print("Enter another item or 'qq' to quit")
    
    conn.close()
    print("\nDatabase connection closed. Goodbye!")

if __name__ == "__main__":
    main() 