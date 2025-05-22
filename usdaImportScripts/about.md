This folder contains the files needed to take a JSON copy of the branded and foundational foods databases from the UDSDA FoodData Central, strip away erroneous data, and put all values into a postgres database in the shape that Apexion is expecting. It also contains a commmand line tool for manually entering foods for a given brand (brand as in "Taco Bell" not "Kellog's").

## USDA

Modify the files to point to and authenticate with your database. Make sure you adjust the path to your copy of the FDC data.

In your project directory, make a virtual python enviornment, activate it, install requirements.txt, and run both of the scripts. 

```bash
# Create and activate a virtual environment
python -m venv venv
source venv/bin/activate  # On Windows use: venv\Scripts\activate

# Install required packages
pip install -r requirements.txt

# Run the import scripts
python import_foundation_foods.py
python import_branded_foods.py
```

This results in "usdabranded" and "usdafoundation" tables with matching shapes.

## Manual

Manual entry script requires similar modification to connect with your database. When ran, it will prompt you for a brand name, then prompt you for the different data points needed for each item. The inteded workflow is to pull up the nutrition info for a given brand, input that brand into the first prompt, then go one by one down the nutrition fact sheet to add all the items.