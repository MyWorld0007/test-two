"use client"

import { useEffect, useState } from "react"

const MOBILE_QUERY = "(max-width: 768px)";

export function useIsMobile(): boolean {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    // window is only available on the client.
    if (typeof window === "undefined") {
      return;
    }

    const mediaQuery = window.matchMedia(MOBILE_QUERY)

    const handleResize = () => {
      setIsMobile(mediaQuery.matches)
    }

    // Set the initial value
    handleResize()

    // Add event listener for changes
    mediaQuery.addEventListener("change", handleResize)

    // Cleanup the event listener on component unmount
    return () => {
      mediaQuery.removeEventListener("change", handleResize)
    }
  }, [])

  return isMobile
}
