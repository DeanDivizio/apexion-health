import json
import psycopg2
import psycopg2.extras
import time
import os
from tqdm import tqdm

# Database connection parameters - update these with your values
DB_PARAMS = {
    "host": "Your db Host",
    "database": "Your Database Name",
    "user": "Your Username", # Default is postgres
    "password": "Your Password",
    "port": 5432  # Default PostgreSQL port
}

# Path to your JSON file
FOUNDATION_FOODS_PATH = "PATH TO YOUR JSON FILE"

# Batch size for inserts (adjust based on your data size and available memory)
BATCH_SIZE = 1000

def create_tables(conn):
    """Create the necessary tables if they don't exist"""
    with conn.cursor() as cur:
        # Create foundation foods table with simple structure
        cur.execute("""
        CREATE TABLE IF NOT EXISTS foundation_foods (
            id SERIAL PRIMARY KEY,
            fdcId INTEGER UNIQUE NOT NULL,
            description TEXT,
            food_category TEXT,
            data_type TEXT,
            macros JSONB,
            nutrients JSONB,
            nutrient_conversion_factors JSONB,
            food_portions JSONB,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        """)
        
        # Create indexes for the columns
        cur.execute("""
        CREATE INDEX IF NOT EXISTS idx_foundation_fdcid ON foundation_foods (fdcId);
        CREATE INDEX IF NOT EXISTS idx_foundation_description ON foundation_foods (description);
        CREATE INDEX IF NOT EXISTS idx_foundation_foodcategory ON foundation_foods (food_category);
        CREATE INDEX IF NOT EXISTS idx_foundation_datatype ON foundation_foods (data_type);
        CREATE INDEX IF NOT EXISTS idx_foundation_macros ON foundation_foods USING GIN (macros);
        """)
        
        conn.commit()
        print("Tables and indexes created successfully")

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
            INSERT INTO foundation_foods (
                fdcId, description, food_category, data_type,
                macros, nutrients, nutrient_conversion_factors, food_portions
            )
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
            ON CONFLICT (fdcId) DO UPDATE
            SET 
                description = EXCLUDED.description,
                food_category = EXCLUDED.food_category,
                data_type = EXCLUDED.data_type,
                macros = EXCLUDED.macros,
                nutrients = EXCLUDED.nutrients,
                nutrient_conversion_factors = EXCLUDED.nutrient_conversion_factors,
                food_portions = EXCLUDED.food_portions;
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
                        
                        # Extract macros
                        macros = {}
                        for nutrient in item.get('foodNutrients', []):
                            nutrient_data = nutrient.get('nutrient', {})
                            name = nutrient_data.get('name')
                            amount = nutrient.get('amount')
                            unit = nutrient_data.get('unitName')
                            
                            if name == "Carbohydrate, by difference" and amount is not None:
                                macros['carbohydrate_by_difference'] = {
                                    'amount': amount,
                                    'unit': unit
                                }
                            elif name == "Energy" and unit == "kcal" and amount is not None:
                                macros['energy'] = {
                                    'amount': amount,
                                    'unit': unit
                                }
                            elif name == "Protein" and amount is not None:
                                macros['protein'] = {
                                    'amount': amount,
                                    'unit': unit
                                }
                            elif name == "Total lipid (fat)" and amount is not None:
                                macros['total_fat'] = {
                                    'amount': amount,
                                    'unit': unit
                                }
                            elif name == "Carbohydrate, by summation" and amount is not None:
                                macros['carbohydrate_by_summation'] = {
                                    'amount': amount,
                                    'unit': unit
                                }
                        
                        # Filter and transform foodNutrients array
                        nutrients = []
                        for nutrient in item.get('foodNutrients', []):
                            nutrient_data = nutrient.get('nutrient', {})
                            filtered_nutrient = {
                                'id': nutrient_data.get('id'),
                                'name': nutrient_data.get('name'),
                                'unitName': nutrient_data.get('unitName'),
                                'amount': nutrient.get('amount')
                            }
                            # Only add if it has required fields
                            if all(v is not None for v in filtered_nutrient.values()):
                                nutrients.append(filtered_nutrient)
                        
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
                            # Only add if it has required fields
                            if all(v is not None for v in filtered_portion.values()):
                                food_portions.append(filtered_portion)
                        
                        # Debug print for first item
                        if success_count == 0:
                            print("First item sample:")
                            print(f"fdcId: {fdc_id}")
                            print(f"description: {description}")
                            print(f"food_category: {food_category}")
                            print(f"data_type: {data_type}")
                            print(f"macros: {macros}")
                            print(f"nutrients: {nutrients[:1]}")
                            print(f"nutrient_conversion_factors: {nutrient_conversion_factors[:1]}")
                            print(f"food_portions: {food_portions[:1]}")
                        
                        # Add to batch values
                        batch_values.append((
                            fdc_id, description, food_category, data_type,
                            json.dumps(macros),
                            json.dumps(nutrients),
                            json.dumps(nutrient_conversion_factors),
                            json.dumps(food_portions)
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
        print(f"Import completed for foundation_foods:")
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
