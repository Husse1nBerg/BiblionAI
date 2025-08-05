// client/src/context/ThemeContext.js
import { createContext, useState, useEffect } from 'react';

const ThemeContext = createContext(null);

export const ThemeProvider = ({ children }) => {
    // State to track if dark mode is active, initialized from localStorage
    const [isDarkMode, setIsDarkMode] = useState(() => {
        const storedTheme = localStorage.getItem('isDarkMode');
        return storedTheme === 'true'; // localStorage stores strings, so convert "true" to boolean true
    });

    // Effect to apply/remove 'dark-mode' class to the <body> element
    useEffect(() => {
        if (isDarkMode) {
            document.body.classList.add('dark-mode');
        } else {
            document.body.classList.remove('dark-mode');
        }
        // Persist theme preference in localStorage
        localStorage.setItem('isDarkMode', isDarkMode);
    }, [isDarkMode]); // Re-run effect when isDarkMode changes

    // Function to toggle the theme
    const toggleTheme = () => {
        setIsDarkMode(prevMode => !prevMode);
    };

    return (
        <ThemeContext.Provider value={{ isDarkMode, toggleTheme }}>
            {children} {/* Renders the child components wrapped by this provider */}
        </ThemeContext.Provider>
    );
};

export default ThemeContext;