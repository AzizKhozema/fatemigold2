"use client";
import { useState } from "react";

export default function DateAndTime() {
  const getFormattedDate = () => {
  const now = new Date();
  return `${now.toLocaleDateString('en-US')} | ${now.toLocaleTimeString('en-US', {
    hour: "2-digit",
    minute: "2-digit",
  })}`;
};


  const [dateTime] = useState(getFormattedDate())

  return (
    
       dateTime || "Loading..." 
       
    
  );
}   