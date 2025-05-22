import json
import psycopg2
import psycopg2.extras
import time
import os
from tqdm import tqdm
import uuid

# Database connection parameters - update these with your values
DB_PARAMS = {
    "host": "yourhost",
    "database": "apexionFoods",
    "user": "postgres", # Default is postgres
    "password": "your_password",
    "port": 5432  # Default PostgreSQL port
}

# Path to your JSON file
FOUNDATION_FOODS_PATH = "/path/to/your/foundation_foods.json"

# Batch size for inserts (adjust based on your data size and available memory)
BATCH_SIZE = 1000

# Nutrient ID mappings
NUTRIENT_IDS = {
    'calories': [1008, 2047, 2048],  # Energy (kcal)
    'protein': [1003],  # Protein
    'carbs': [1050, 1005],  # Carbohydrate, by difference or summation
    'total_fat': [1004],  # Total lipid (fat)
    'saturated_fat': [1258],  # Fatty acids, total saturated
    'trans_fat': [1257],  # Fatty acids, total trans
    'sugars': [1063],  # Sugars, total including NLEA
    'fiber': [1079],  # Fiber, total dietary
    'cholesterol': [1253],  # Cholesterol
    'sodium': [1093],  # Sodium, Na
    'calcium': [1087],  # Calcium, Ca
    'iron': [1089],  # Iron, Fe
    'potassium': [1092],  # Potassium, K
}

def create_tables(conn):
    """Create the necessary tables if they don't exist"""
    with conn.cursor() as cur:
        # Create usdaFoundation table with simple structure
        cur.execute("""
        CREATE TABLE IF NOT EXISTS usdaFoundation (
            id SERIAL PRIMARY KEY,
            apexionID TEXT UNIQUE NOT NULL,
            fdcID INTEGER,
            name TEXT NOT NULL,
            variationLabels TEXT[],
            brand TEXT,
            nutrients JSONB NOT NULL,
            servingInfo JSONB NOT NULL,
            ingredients TEXT,
            numberOfServings INTEGER,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        """)
        
        # Create indexes for the columns
        cur.execute("""
        CREATE INDEX IF NOT EXISTS idx_usda_foundation_apexionid ON usdaFoundation (apexionID);
        CREATE INDEX IF NOT EXISTS idx_usda_foundation_fdcid ON usdaFoundation (fdcID);
        CREATE INDEX IF NOT EXISTS idx_usda_foundation_name ON usdaFoundation (name);
        """)
        
        conn.commit()
        print("Tables and indexes created successfully")

def find_nutrient_amount(nutrients, nutrient_ids):
    """Find the first non-null amount for a list of nutrient IDs"""
    for nutrient in nutrients:
        if nutrient.get('id') in nutrient_ids and nutrient.get('amount') is not None:
            return nutrient.get('amount')
    return 0

def import_foundation_foods(conn, json_file_path):
    """Import Foundation Foods JSON data"""
    start_time = time.time()
    
    # Check if file exists
    if not os.path.exists(json_file_path):
        print(f"Error: File {json_file_path} not found")
        return
    
    # Get file size for progress reporting
    file_size = os.path.getsize(json_file_path) / (1024 * 1024)  # Size in MB
    print(f"Reading {json_file_path} ({file_size:.2f} MB)...")
    
    try:
        # Load JSON data
        with open(json_file_path, 'r', encoding='utf-8') as file:
            data = json.load(file)
        
        # Extract the FoundationFoods array
        if "FoundationFoods" in data:
            foods = data["FoundationFoods"]
            print(f"Found {len(foods)} items in FoundationFoods")
        else:
            print(f"Error: Expected 'FoundationFoods' key in {json_file_path}")
            return
        
        total_items = len(foods)
        
        # Process in batches
        with conn.cursor() as cur:
            # Prepare the insert statement
            insert_query = """
            INSERT INTO usdaFoundation (
                apexionID, fdcID, name, variationLabels, brand,
                nutrients, servingInfo, ingredients, numberOfServings
            )
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
            ON CONFLICT (apexionID) DO UPDATE
            SET 
                fdcID = EXCLUDED.fdcID,
                name = EXCLUDED.name,
                variationLabels = EXCLUDED.variationLabels,
                brand = EXCLUDED.brand,
                nutrients = EXCLUDED.nutrients,
                servingInfo = EXCLUDED.servingInfo,
                ingredients = EXCLUDED.ingredients,
                numberOfServings = EXCLUDED.numberOfServings;
            """
            
            # Process in batches with progress bar
            success_count = 0
            error_count = 0
            
            for i in tqdm(range(0, total_items, BATCH_SIZE), desc="Importing foundation foods"):
                batch = foods[i:i+BATCH_SIZE]
                batch_values = []
                
                for item in batch:
                    try:
                        # Extract basic fields
                        fdc_id = int(item.get('fdcId'))
                        description = item.get('description')
                        food_category = item.get('foodCategory', {}).get('description')
                        data_type = item.get('dataType')
                        
                        # Extract nutrients
                        nutrients = []
                        for nutrient in item.get('foodNutrients', []):
                            nutrient_data = nutrient.get('nutrient', {})
                            filtered_nutrient = {
                                'id': nutrient_data.get('id'),
                                'name': nutrient_data.get('name'),
                                'unitName': nutrient_data.get('unitName'),
                                'amount': nutrient.get('amount')
                            }
                            if all(v is not None for v in filtered_nutrient.values()):
                                nutrients.append(filtered_nutrient)
                        
                        # Extract macros
                        macros = {
                            'calories': find_nutrient_amount(nutrients, NUTRIENT_IDS['calories']),
                            'protein': find_nutrient_amount(nutrients, NUTRIENT_IDS['protein']),
                            'carbs': find_nutrient_amount(nutrients, NUTRIENT_IDS['carbs']),
                            'total_fat': find_nutrient_amount(nutrients, NUTRIENT_IDS['total_fat']),
                            'saturated_fat': find_nutrient_amount(nutrients, NUTRIENT_IDS['saturated_fat']),
                            'trans_fat': find_nutrient_amount(nutrients, NUTRIENT_IDS['trans_fat'])
                        }
                        
                        # Nutrient conversion factors are already in the correct format
                        nutrient_conversion_factors = item.get('nutrientConversionFactors', [])
                        
                        # Filter and transform food portions array
                        food_portions = []
                        for portion in item.get('foodPortions', []):
                            filtered_portion = {
                                'value': portion.get('value'),
                                'measureUnit': {
                                    'name': portion.get('measureUnit', {}).get('name'),
                                    'abbreviation': portion.get('measureUnit', {}).get('abbreviation')
                                },
                                'modifier': portion.get('modifier'),
                                'gramWeight': portion.get('gramWeight'),
                                'sequenceNumber': portion.get('sequenceNumber'),
                                'amount': portion.get('amount')
                            }
                            if all(v is not None for v in filtered_portion.values()):
                                food_portions.append(filtered_portion)
                        
                        # Extract nutrients in the correct format
                        food_item_nutrients = {
                            'calories': find_nutrient_amount(nutrients, NUTRIENT_IDS['calories']),
                            'protein': find_nutrient_amount(nutrients, NUTRIENT_IDS['protein']),
                            'carbs': find_nutrient_amount(nutrients, NUTRIENT_IDS['carbs']),
                            'fats': {
                                'total': find_nutrient_amount(nutrients, NUTRIENT_IDS['total_fat']),
                                'saturated': find_nutrient_amount(nutrients, NUTRIENT_IDS['saturated_fat']),
                                'trans': find_nutrient_amount(nutrients, NUTRIENT_IDS['trans_fat'])
                            },
                            'sugars': find_nutrient_amount(nutrients, NUTRIENT_IDS['sugars']),
                            'fiber': find_nutrient_amount(nutrients, NUTRIENT_IDS['fiber']),
                            'cholesterol': find_nutrient_amount(nutrients, NUTRIENT_IDS['cholesterol']),
                            'sodium': find_nutrient_amount(nutrients, NUTRIENT_IDS['sodium']),
                            'calcium': find_nutrient_amount(nutrients, NUTRIENT_IDS['calcium']),
                            'iron': find_nutrient_amount(nutrients, NUTRIENT_IDS['iron']),
                            'potassium': find_nutrient_amount(nutrients, NUTRIENT_IDS['potassium'])
                        }
                        
                        # Get serving info from the first portion
                        serving_info = {
                            'size': food_portions[0]['amount'] if food_portions else 1,
                            'unit': food_portions[0]['measureUnit']['name'] if food_portions and food_portions[0].get('measureUnit', {}).get('name') else None
                        }
                        
                        # Add to batch values
                        batch_values.append((
                            str(uuid.uuid4()),  # Generate unique apexionID
                            fdc_id,
                            description,  # name
                            None,  # variationLabels
                            None,  # brand
                            json.dumps(food_item_nutrients),
                            json.dumps(serving_info),
                            None,  # ingredients
                            None  # numberOfServings
                        ))
                        
                        success_count += 1
                    except Exception as e:
                        print(f"Error processing item: {e}")
                        error_count += 1
                        continue
                
                if batch_values:
                    try:
                        # Execute batch insert
                        psycopg2.extras.execute_batch(cur, insert_query, batch_values)
                        conn.commit()
                    except Exception as e:
                        conn.rollback()
                        print(f"Error inserting batch: {e}")
                        error_count += len(batch_values)
                        success_count -= len(batch_values)
        
        end_time = time.time()
        duration = end_time - start_time
        print(f"Import completed for usdaFoundation:")
        print(f"  - Successfully imported: {success_count} items")
        print(f"  - Errors: {error_count} items")
        print(f"  - Time taken: {duration:.2f} seconds")
        
    except json.JSONDecodeError as e:
        print(f"Error decoding JSON file {json_file_path}: {e}")
    except Exception as e:
        print(f"Unexpected error: {e}")

def main():
    """Main function to run the import process"""
    print("Starting import process...")
    
    try:
        # Connect to PostgreSQL
        print("Connecting to PostgreSQL database...")
        conn = psycopg2.connect(**DB_PARAMS)
        
        # Create tables if they don't exist
        create_tables(conn)
        
        # Import foundation foods
        import_foundation_foods(conn, FOUNDATION_FOODS_PATH)
        
        # Close connection
        conn.close()
        print("Import process completed successfully")
        
    except psycopg2.Error as e:
        print(f"Database error: {e}")
    except Exception as e:
        print(f"Unexpected error: {e}")

if __name__ == "__main__":
    main()
