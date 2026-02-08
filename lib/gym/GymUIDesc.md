## Purpose
I just finished the backend rebuild of the gym portion of this project. I was unsatisfied with the UI before, and now the old UI and new data model are incompatible, so the UI needs to be rebuilt anyways. 

I would like to start from scratch. dont reference the old UI unless told to for a specifc purpose. DO reference the new data model.

## Priorities
### mobile UI
the most important thing is logging page. We'll work on visualization, graphing, and all the other more desktop focused features later.

### great UX
On the logging page, the user should be able to easily access all the info and features they need, without being distracted by things they dont need.

### Speed
cache everything possible - aggressively. Look into using Cache Components in next.js. optimize your data fetching so you can cache as much as possible. pay attention to your client/server boundaries. it's imperitive that we get this as close to a native experience as possible.

### Stability 
this is a web app. If the user accidentally navigates from the workout page, they shouldnt lose any data

## UI Description
The overall theme of the app is dark. we use tailwind's blue and green palletes for accent colors. our base style is neutral.

### Page layout and Stats Display
When logging an exercise, the UX should be similar to that of an ecommerce site. 

At the top of the middle section of the page, you select your exercise. once you do, at the bottom of the page, stats for that exercise historically should be displayed, as well as those pertaining to the current session.
- previous session details
-- date
-- each set's reps, weight, and effort
-- inter-set volume
- personal records
-- interset volume
-- intraset volume (and at what weight/rep count)
-- max weight lifted

The detailed ones should just be written out. the volume ones should be displayed as a progress bar with the current session's stats being compared against the records.

This UI should be fixed to the bottom on the users screen, replacing the nav bar. It should be collapsable.

### The Header
The header is built now in a way that allows pages to override the content on the left and right. 

When logging a workout, the left column of the header should be the trigger for the exercise settings menu. the center should be the app name (default behavior). The right collumn should be the trigger for the Session Overview sheet (think, like a cart component - but for details pertaining to this gym session).

### Exercise Settings Menu
Feel free to propose a better name for this.

This menu will house the settings for the active/selected exercise. all the variations currently adopted by the exercise should be displayed and modifiable. the option to adopt a new variation dimmension should be shown. the ability to create a new variation dimmension should be shown in that sub-ui (like at the end of the list of adoptable variations). 

It should then - at the bottom - have two options: save default, and save as custom exercise. these buttons should be in a column with headings above them - "Is this how you do {EXERCISE NAME}?", and "Mix it up but do this often?" respectively. They should have tooltips by the headings that describe the behavior.

The UI should update when the buttons are clicked and the user should recieve a toast when the DB update is successful. If saving a custom exercise, the name in the UI should be updated.

### Session Overview
This component should function like a cart but for the gym session. it should slide in from the right and have a close button in the upper left corner along with the clerk profile component in the upper right corner.

At the top should be the date and time. They should be editable. the time should be displayed like "5:10am - now". the user should be able to click on the time and adjust it, or the word "now" to specify the time (otherwise, default to the time the session is submitted). The date should work the same but have a calendar dropdown day picker component. Use the day picker from shadcn for that (you have a tool that you can use for shadcn CLI access).

Pinned at the bottom should be a little stats component. 

In between should be a scrollable list of cards that represent each exercise done in the session - in order. the cards should actually be accordions that have the exercise name as the label/title, and when expanded, display the details of that exercise's sets to the user. they do not need to be modifiable in this view.

### Main section
The main section of the logging page should be dynamic and change depending on what stage in the workout cycle the user is in.

on initial load, do an auth check to make sure we wont run into any issues pulling user data or submitting the workout later on.

once auth is confirmed, the user should see the "Add Exercise". this is a nice looking UI with 2 dropdowns; one for strength/resistance training, one for cardio. If the session has at least one exercise logged, there should also be a "Save and End Session" button below the dropdowns.

Ignore the cardio options for now. just use an empty dropdown as a placeholder.

for strength exercises, the UI should show the name at the top, followed by cards (use accordions for this too) that contain the form fields for each set.

### The Set Cards
For each set, the form fields should live in a card. The title of the card should be "Current Set" until there's info, then it should be a recap of the set like "X Reps, Ylbs, RPE: Z". X, Y, and Z in this case obviously being stand-ins for the actual values.

We need the following form fields
- Weight
-- text input. Numbers only. 1 decimal place only. "10", "7.5", "30.5" are some examples of allowed values
-- required
-- Tooltip should read "The weight being moved per rep. If lift is unilateral, record the weight per side (i.e. if doing bicep curls, record the weight each arm is lifting). If lift is bilateral, record the total weight (i.e. if doing preacher curls, record the weight loaded/weight of the barbell).

- Reps (unilateral/bilateral)
-- drop down with 0 - 20 and a custom number input at the bottom
-- required
-- to the right of the drop down should be a context menu trigger. inside this menu should be a button labeled "Split L/R Reps". That should allow the user to input left and right separately for unilateral movements where there's a difference in rep count (like if on bicep curls, user can do a set of 10 with the right but fails on 9 with the left). If reps aren't split, the same number should be set to repsLeft and repsRight on the backend.
-- Tooltip: "The number of reps this set (including failure if applicable). For bilateral (uses both sides at the same time) movements, just log reps normally. For unilateral (one side at a time) movements, if both sides are the same, you can log that number here and Apexion will do the math automatically. If unilateral but sides are different (full 10 on right but failed at 9 on left, for instance), click the three dots next to the drop down and select "Split L/R Reps", then input the numbers appropriately."

- Effort
-- dropdown with values 0 - 10 and labels that match, with the following exceptions
--- 0 = "untracked"
--- 2 = "2 (near zero resistence)
--- 5 = "5 (resistence felt. nowhere near failure)
--- 7 = "7 (4-5 reps in reserve)
--- 8 = "8 (2-3 reps in reserve)
--- 9 = "9 (1 from failure)
--- 10 = "10 (Failure)
-- optional
-- tooltip: "Effort is an optional metric that gives Apexion more insight into your performance. It allows for tracking progress even when weight/rep count is fixed, and lets Apexion calculate your optimal pacing/set structure. This is **highly reccomended**."

- Duration (seconds)
-- Text input thats restricted to whole numbers
-- optional
-- tooltip: "The amount of time you took to finish your set. This is an optional metric that allows Apexion to calculate your optimal rep pacing, as well as understand discrepencies in your data (like if you did the same reps and load twice but recorded a lower effort the second time. That's unexpected if duration is the same, but reasonable if you took your time on the second set.)"

Below the last set card in the list, there should be two buttons; "Add set" and "Save Exercise". Add set should to exactly that. Save exercise should commit the exercise to the session and bring the user back to the "Add Exercise" screen described earlier.

