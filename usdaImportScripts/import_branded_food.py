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

# Path to branded foods JSON file
BRANDED_FOODS_PATH = "PATH TO YOUR JSON FILE"

# Batch size for inserts (adjust based on your data size and available memory)
BATCH_SIZE = 1000

def create_tables(conn):
    """Create the necessary tables if they don't exist"""
    with conn.cursor() as cur:
        # Create branded foods table
        cur.execute("""
        CREATE TABLE IF NOT EXISTS branded_foods (
            id SERIAL PRIMARY KEY,
            fdcId INTEGER UNIQUE NOT NULL,
            description TEXT,
            brand_owner TEXT,
            gtin_upc TEXT,
            ingredients TEXT,
            serving_size DECIMAL,
            serving_size_unit TEXT,
            household_serving TEXT,
            branded_food_category TEXT,
            data_type TEXT,
            label_nutrients JSONB,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        """)
        
        # Create indexes for the columns
        cur.execute("""
        CREATE INDEX IF NOT EXISTS idx_branded_fdcid ON branded_foods (fdcId);
        CREATE INDEX IF NOT EXISTS idx_branded_description ON branded_foods (description);
        CREATE INDEX IF NOT EXISTS idx_branded_brandowner ON branded_foods (brand_owner);
        CREATE INDEX IF NOT EXISTS idx_branded_category ON branded_foods (branded_food_category);
        CREATE INDEX IF NOT EXISTS idx_branded_label_nutrients ON branded_foods USING GIN (label_nutrients);
        """)
        
        conn.commit()
        print("Tables and indexes created successfully")

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
            INSERT INTO branded_foods (
                fdcId, description, brand_owner, gtin_upc,
                ingredients, serving_size, serving_size_unit,
                household_serving, branded_food_category, data_type,
                label_nutrients
            )
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            ON CONFLICT (fdcId) DO UPDATE
            SET 
                description = EXCLUDED.description,
                brand_owner = EXCLUDED.brand_owner,
                gtin_upc = EXCLUDED.gtin_upc,
                ingredients = EXCLUDED.ingredients,
                serving_size = EXCLUDED.serving_size,
                serving_size_unit = EXCLUDED.serving_size_unit,
                household_serving = EXCLUDED.household_serving,
                branded_food_category = EXCLUDED.branded_food_category,
                data_type = EXCLUDED.data_type,
                label_nutrients = EXCLUDED.label_nutrients;
            """
            
            # Process in batches with progress bar
            success_count = 0
            error_count = 0
            
            for i in tqdm(range(0, total_items, BATCH_SIZE), desc="Importing branded foods"):
                batch = foods[i:i+BATCH_SIZE]
                batch_values = []
                
                for item in batch:
                    try:
                        # Extract basic fields using camelCase field names from the JSON
                        fdc_id = int(item.get('fdcId'))
                        description = item.get('description')
                        brand_owner = item.get('brandOwner')
                        gtin_upc = item.get('gtinUpc')
                        ingredients = item.get('ingredients')
                        serving_size = item.get('servingSize')
                        serving_size_unit = item.get('servingSizeUnit')
                        household_serving = item.get('householdServingFullText')
                        branded_food_category = item.get('brandedFoodCategory')
                        data_type = item.get('dataType')
                        
                        # Get label nutrients directly as they are in the JSON
                        label_nutrients = item.get('labelNutrients', {})
                        
                        # Debug print for first item
                        if success_count == 0:
                            print("First item sample:")
                            print(f"fdcId: {fdc_id}")
                            print(f"description: {description}")
                            print(f"brand_owner: {brand_owner}")
                            print(f"label_nutrients: {label_nutrients}")
                        
                        # Add to batch values
                        batch_values.append((
                            fdc_id, description, brand_owner, gtin_upc,
                            ingredients, serving_size, serving_size_unit,
                            household_serving, branded_food_category, data_type,
                            json.dumps(label_nutrients)
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
        print(f"Import completed for branded_foods:")
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
