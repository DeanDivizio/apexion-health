// stuff that i want to implement

// ********************************************************************************************* //

// defaults for medication and supplements.
// user logs medication X
// check to see if user private meta has default for X
// if yes, dosage & details prefill
// if no, they're undefined

// idea for structure
export interface defaults {
    medication?: [{
        name: string,
        brand?: string,
        dose: number,
        method: 'capsule' | 'tablet' | 'injection' | 'cream' | 'nasal spray' | 'inhaler',
        injectionDepth?: 'intra-muscular' | 'sub-cutaneous'
    }
    ],
    supplements?: [{
        name: string,
        brand?: string,
        dose: number,
        method: 'capsule' | 'tablet' | 'injection' | 'cream' | 'nasal spray' | 'inhaler',
        injectionDepth?: 'intra-muscular' | 'sub-cutaneous'
    }]
}

// defaults update every time a new value is input for name.
// existing name with new value prompts 'update default?'
// arrays should be itterated through to populate initial section of the logging menu
// ...to prioritize meds/supplements the user has already logged - better UX

// ********************************************************************************************* //

// on desktop, main sidebar nav should be a "log" button with a submenu and
// a view button with ta sub menu. have a home button on top and the logistics
// (account, help, settings, feedback) at the bottom.

// ********************************************************************************************* //