# Rebuilding the entire nutrition stack
Similar to what we've already done with gym and medication, i would like to rebuild the stack for nutrition logging.

## Main goals
### Better UX
Using this feature should not feel like a chore. Things like OCR for scanning nutrition labels, saving both foods and meals, and an overall clear, quick, easy process should be the priorities.

### Database transition
Right now, user records are stored in dynamoDB. I'm migrating this whole project to supabase so the nutrition stack should be migrated with it.

### First principles and keeping extensibility in mind
I'd like too adhere to DRY principles when possible. We need OCR for label scanning. can we build a primitive for this that we can then use to import test results (blood work, labs, etc) down the line? Something to consider when planning the whole stack, not just OCR.

### Better data
I'd like to be able to track both micro and macro nutrient intake. This needs to be done in a way that allows the same compound (say vitamin D) to be tracked cohesively accross both nutrition logging and supplement logging. Meaning, the user should be able to see the totals for any particular substance as well as the breakdown of their origin. The UI for viewing this data does not need to be built right now, but the data model and logging ui needs to set us up for this down the road.

## Technical considerations
### The data shape
I'm thinking a meal consists of food items multiplied by quantities. food items consist of compounds/nutrients and their amounts. What do you think of this?

### UX
I think we should split the logging flow in terms of food sourcing into 3 categories: complex, foundation, retail. Complex being things that are made, packaged, and sold in stores. Examples would be hamburger buns, waffles, cereal, frozen pizza. Foundation are single ingredient foods whose nutritional values are pretty well known. Things like, eggs, bananas, broccoli. Retail consists of menu items from fast food and fast casual dining places. Taco Bell, Chipotle, Panda Express, McDonald's, are examples.

Overall flow should involve adding items to a staging area ("meal", similar to how meds and gym sessions work), then submitting when done.

I believe there should be two sub-flows - one for complex and foundation, one for retail. I'm not sure how to segment them. I would like your thoughts.

#### Complex foods
These would be added to the user's personal database via label scanning and manually entering a name and brand. Every item a user logs should be saved for future use. That database is what should be used to populate the combobox.

#### Foundation Foods
These would be sourced from the USDA's foundation database - which we should store a local copy of. these should not be modifyable.

#### Retail
These will be sourced from databases we build from the nutrition info provided by the different chains. We should have a repository of these. We'll need a flow to go from pdf/screenshot to JSON and then we can hard code a copy of these values into our provenance docs while also having them in a database. The user should be able to search for and select a brand (i.e. "chipotle"), then search for and select items to add to their meal. If they search for something that isn't there, they should be routed to a branch that lets them add to a subset of the retail database that's only available to them. This let's people log things we may have missed - without poluting our global data. I'm imagining this would require a multi-turn interaction with an LLM to do the OCR and proper formatting of multiple food items.

## My goals for right now
I'd like us to build the entire logging stack as well as the page to view/edit the logged data. We should also update the logic for the macros summary on the homepage. dont concern yourself with any other data visualization tasks.

when you're done, we should have:
- an entry point at /logmeal
- a meal sheet that acts as a staging area for items
- - this should be saved to local state to be resistant to navigation related data loss (like meds and gym are now)
- a complete flow for complex and foundation foods
- a complete flow for retail foods
- database accomodations for all food types
- a flow for adding nutrition facts from chains
- - put this ui at a new route
- a page that lets you view and edit your meal data
- an updated macros section on the homepage

Make sure this is a complete, shippable set of features. Use the OpenAI api and gpt-5.2 for LLM related tasks (including OCR).

Aside from the above specifications, the details here are greenfield. Just let me know what your plan is.

## Your next steps
- read this document again
- identify any questions you have
- put together a detailed set of instructions on how to implement this
- - details are important. assume that whatever you write in those instructions (plus this document) is the only context you'll have when you go to build this
- wait for further instruction