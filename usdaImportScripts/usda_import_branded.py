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
BRANDED_FOODS_PATH = "/path/to/your/branded_foods.json"

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
        # Create usdaBranded table with simple structure
        cur.execute("""
        CREATE TABLE IF NOT EXISTS usdaBranded (
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
        CREATE INDEX IF NOT EXISTS idx_usda_branded_apexionid ON usdaBranded (apexionID);
        CREATE INDEX IF NOT EXISTS idx_usda_branded_fdcid ON usdaBranded (fdcID);
        CREATE INDEX IF NOT EXISTS idx_usda_branded_name ON usdaBranded (name);
        """)
        
        conn.commit()
        print("Tables and indexes created successfully")

def find_nutrient_amount(nutrients, nutrient_ids):
    """Find the first non-null amount for a list of nutrient IDs"""
    for nutrient in nutrients:
        if nutrient.get('id') in nutrient_ids and nutrient.get('amount') is not None:
            return nutrient.get('amount')
    return 0

def import_branded_foods(conn, json_file_path):
    """Import Branded Foods JSON data"""
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
        
        # Extract the BrandedFoods array
        if "BrandedFoods" in data:
            foods = data["BrandedFoods"]
            print(f"Found {len(foods)} items in BrandedFoods")
        else:
            print(f"Error: Expected 'BrandedFoods' key in {json_file_path}")
            return
        
        total_items = len(foods)
        
        # Process in batches
        with conn.cursor() as cur:
            # Prepare the insert statement
            insert_query = """
            INSERT INTO usdaBranded (
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
            
            for i in tqdm(range(0, total_items, BATCH_SIZE), desc="Importing branded foods"):
                batch = foods[i:i+BATCH_SIZE]
                batch_values = []
                
                for item in batch:
                    try:
                        # Extract basic fields
                        fdc_id = int(item.get('fdcId'))
                        description = item.get('description')
                        brand_owner = item.get('brandOwner')
                        ingredients = item.get('ingredients')
                        
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
                        
                        # Get serving info
                        serving_size = item.get('servingSize')
                        serving_size_unit = item.get('servingSizeUnit')
                        
                        serving_info = {
                            'size': serving_size if serving_size is not None else 1,
                            'unit': serving_size_unit if serving_size_unit is not None else None
                        }
                        
                        # Add to batch values
                        batch_values.append((
                            str(uuid.uuid4()),  # Generate unique apexionID
                            fdc_id,
                            description,  # name
                            None,  # variationLabels
                            brand_owner,  # brand
                            json.dumps(food_item_nutrients),
                            json.dumps(serving_info),
                            ingredients,  # ingredients
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
        print(f"Import completed for usdaBranded:")
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
        
        # Import branded foods
        import_branded_foods(conn, BRANDED_FOODS_PATH)
        
        # Close connection
        conn.close()
        print("Import process completed successfully")
        
    except psycopg2.Error as e:
        print(f"Database error: {e}")
    except Exception as e:
        print(f"Unexpected error: {e}")

if __name__ == "__main__":
    main() 