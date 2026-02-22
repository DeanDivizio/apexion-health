# Whoop Integration for Biometrics
As a whoop user, I'd like Apexion to be able to pull my biometric data from whoop. This data should be queried when appropriate but we should also utilize webhooks to capture data as it becomes available. We should store this data internally so when we need it in Apexion, we can ensure access and a consistent data shape.

## Specific goals
- associate workout/activity data like max/avg heart rate, est kJ burned, time spend in various heart rate zones, with workouts logged in Apexion
- track rhr, hrv, skin temp (if available), pulse ox if available, to correlate these metrics to other metrics apexion has access to
- proxy body measurements like weight and height, so the user doesnt have to input separately or manage another connection
- pull all sleep data to correlate with other metrics.
- pull whoop's computed scores. im not really interested in using them since we have the raw data to work with but it would be good to log just to have.

Basically, Apexion should passively capture all the data from whoop that it can in order to enable us to draw insights from correlations between data given to apexion by the user and data sourced passively by whoop.

## UX considerations
- The user should be able decide which bits of info they give us access to. They should get a prompt encouraging them to give us access to all, along with reasoning for each category, before they see the OAuth screen.
- the user should be able to see but not edit the data we pul from whoop. kind of like they can for gym sessions and meds/supplements. 

## Technical considerations
- we should implement OAuth2 properly. no shortcuts. lets do this by the book to save us the headache later
- whoop doesnt go by day; they go by cycle. apexion goes by day. i think initial recovery through sleep should be one day. but how to accomodate this is an open question.  

## Extensibility - **Critical**
This could be a technical consideration but i think it's important enough to warrant it's own heading. Please pay particular attention here.
- Whoop is the first provider we're integrating will but it will not be the only one.
- whatever we decide in terms of a data model NEEDS to be extensible. I DO NOT want to have to re-create the wheel every time we add a provider
- i think capturing the data in a provider specific shape, then building a shape that represents what we want, along with an adapter between the two is a good idea.
- - to clarify this means:
- - whoop (along with future providers) get their own set of tables in our database
- - We, for Apexion, decide the best way to represent biometrics for our users, and build a set of tables for that
- - we build an adapter to take the initial shape and restructure to ours
- - this adapter should run after after the data's been logged initially so we know it's safe, but in the same overall function that logs the data initially

i would like your thoughts on this plan.

## Documentation links
Below are links to Whoop's documentation so you can reference them. you may need more so feel free to do additional research, but these should be a good start.

Overview: https://developer.whoop.com/docs/developing/getting-started
Auth: https://developer.whoop.com/docs/developing/oauth
Cycle data: https://developer.whoop.com/docs/developing/user-data/cycle
Sleep Data: https://developer.whoop.com/docs/developing/user-data/sleep
Recovery data: https://developer.whoop.com/docs/developing/user-data/recovery
Workout data: https://developer.whoop.com/docs/developing/user-data/workout
General User Data: https://developer.whoop.com/docs/developing/user-data/user
Webhooks: https://developer.whoop.com/docs/developing/webhooks/

## Answer to your Questions
1. time series.
2. i think time overlap is good.
3. i think we should flatten in the canonical layer. the provider tables should be very close to the original data shape.
4. still a to-do
5. our db provider is supabase. i think they're secure enough to store this. the structure for this should be extensible.
6. yes.
7. backfill all. please be cognizant of rate limits. workout associations can be triggered manually after.
8. wire everything for capture, adaptation, and display. we dont need to worry about graphing or analysis right now.
9. ask the user if it becomes an issue.
10. both. i think summarizing on the home page would be great but the details for sleep, recovery, overall cycle should be viewable on a biometrics page. workout data only needs to be viewed on the gymsessions page
11. keep and stop syncing. I'll handle deletion from a pr perspective.

## Answer to your follow up questions
1. theres something there. you can put the whoop summary under the macros and above the "recent days"
2. Theres a side nav component on mobile that uses a sheet/sidebar. it can go in that. dont worry about desktop right now.
3. i like the idea of a syncing indicator. maybe we can integrate it in the mobile header under the existing component in the middle.
4. im not sure what that means but let's go with yes (id love an explanation)
5. i think either a notification or some sort of banner in the layout would be good.
