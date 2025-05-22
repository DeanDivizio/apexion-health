"use client"

import { createContext, useState } from "react"

export const MobileHeaderContext = createContext({
    headerComponentRight: null,
    setHeaderComponentRight: (component) => {},
    headerComponentLeft: null,
    setHeaderComponentLeft: (component) => {},
    mobileHeading: "generic",
    setMobileHeading: (heading) => {}
})

export const MobileHeaderProvider = ({children}) => {
    const [headerComponentRight, setHeaderComponentRight] = useState(null)
    const [headerComponentLeft, setHeaderComponentLeft] = useState(null)
    const [mobileHeading, setMobileHeading] = useState("generic")

    return (
        <MobileHeaderContext.Provider value={{
            headerComponentRight,
            setHeaderComponentRight,
            headerComponentLeft,
            setHeaderComponentLeft,
            mobileHeading,
            setMobileHeading
        }}>
            {children}
        </MobileHeaderContext.Provider>
    )
}