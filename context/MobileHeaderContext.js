"use client"

import { createContext, useState } from "react"

export const MobileHeaderContext = createContext({
    headerComponent: null,
    setHeaderComponent: (component) => {}
})

export const MobileHeaderProvider = ({children}) => {
    const [headerComponent, setHeaderComponent] = useState(null)
    
    return (
        <MobileHeaderContext.Provider value={{
            headerComponent,
            setHeaderComponent
        }}>
            {children}
        </MobileHeaderContext.Provider>
    )
}