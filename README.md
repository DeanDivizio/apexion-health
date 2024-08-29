# Apexion
### Elegant, Comprehensive, Self-Hosted Health Tracking

## Summary
The goal of Apexion is to take what I've started to do with GymTrax and Data Deck and combine/expand on them. The end goal is one web app that allows for tracking of clinical records, nutrients, gym data, and body measurements. Customizable reporting will allow for trend analysis between various markers (diet and cholesterol, testosterone and gym performance, sleep quality and body fat percentage, etc), as needed by the user. 

## Dev Milestones

### Phase 1 - Design and Clinic Record Support
Initially the focus will be on UI and clinical records. I feel like it's important to nail the fundementals (forms, charts, layout, initial database logic) first before adding more features.

The plan right now is:
- Charts and UI through shadcn
- DynamoDB for the storing of custom data (clinical records)
- Access control through Clerk
- Hosting on Vercel with Docker as an option

Once I have a working app that's essentially a clinical data visualizer, it's time to move to phase 2.

### Phase 2 - Nutrient Tracking & TRT Tracking
This should be the easiest additional feature to add since it's self-contained.
- New db table
- New ui section
    - meal submit form
    - TRT form with options for category (test, hcg, ai, etc), as well as type (cyp, prop, cream), application site, and injection/application depth (surface, SQ, IM)
    - pre-built charts
- maybe sync with other nutrient tracking apps (MyFitnessPal, etc)

### Phase 3 - Body Measurements
This is where it starts getting tough. Current plan is to find a way to access HealthKit data so any devices that can sync to Apple Health can also sync to Apexion. The problem with that is it's iPhone only. The bigger problem is there's no way to interact with HealthKit through a web app. This might require some sort of native companion app. Technically, this could all be entered manually and stored in a new db table - but I'd really like to automate as much as possible.

### Phase 4 - Gym Data
This is only 4th because it requires a mix of first-party logic and 3-rd party integrations. Things like individual workout stats related to exercises, sets, reps, weight, etc can all be input manually. However, I'd also like to be able to access things like calories burned, respitory rate, blood oxygen levels, etc from fitness trackers and associate that data with gym sessions. This means I need my custom stuff fleshed out, but also need a dependable way of getting tracker data. (and since i wear an apple watch, that means i need health kit access).

### Phase 5 - Optimization
I'm sure that at this point there will be things I can do to improve performance and reliability. This is when I'll do them.

### Phase 6 - Multi User Support (maybe)
This one is a maybe. If I find it useful enough and friends seem interested, I may try to make it into a SaaS product. 

- adding integrations for android healthkit equivalents
- user management
- database restructuring

## Success Criteria
How will I know when I'm finished?

- Fully supports all data types mentioned above
- good feeling and functional UI
- PWA Support
- native health integrations are cross platform if going multi-user
- web interface is fully responsive with feature parity across device types
