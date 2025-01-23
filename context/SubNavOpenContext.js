"use client"
import React, { createContext, useState, useContext } from 'react';


// Create the context
export const SubNavContext = createContext(false);

// Create the provider component
export const SubNavContextProvider = ({ children }) => {
    const [open, setOpen] = useState(false);

    return (
        <SubNavContext.Provider value={{ open, setOpen }}>
            {children}
        </SubNavContext.Provider>
    );
};

// Custom hook to use the context
export const useSubNavContext = () => useContext(SubNavContext);