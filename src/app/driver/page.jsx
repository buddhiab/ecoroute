"use client"
import { useState, useEffect } from "react"
import { supabase } from "../../lib/supabase" // This connects to your database
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function DriverApp() {
  // This state holds the exact time the app opened
  const [loadTime, setLoadTime] = useState(0)

  // This runs automatically as soon as the driver opens the screen
  useEffect(() => {
    setLoadTime(Date.now()) // Records the start time in milliseconds
  }, [])

  // The magic function: It runs when the giant button is clicked
  const handleJobComplete = async () => {
    // 1. Calculate how long the driver took to find and click the button
    const timeToClick = Date.now() - loadTime

    // 2. Secretly send the research data to Supabase
    const { error } = await supabase
      .from('HCILogs')
      .insert([
        {
          task_name: 'Driver Clicked Job Done',
          clicks: 1,
          time_taken: timeToClick
        }
      ])

    // 3. Show a message to the driver
    if (error) {
      console.error("Tracking Error:", error)
      alert("Error saving data. Check your terminal.")
    } else {
      alert("Job Done! (Secret HCI Data was just sent to your database!)")
    }
  }

  return (
    <div className="min-h-screen bg-slate-100 p-4 flex flex-col items-center justify-center">
      <Card className="w-full max-w-sm shadow-xl rounded-2xl border-t-8 border-t-green-500">
        <CardHeader className="text-center pb-2">
          <CardTitle className="text-3xl font-extrabold text-gray-800">Route 101</CardTitle>
          <p className="text-lg text-gray-500 font-medium">Zone: Colombo 05</p>
        </CardHeader>
        
        <CardContent className="flex flex-col gap-6 mt-6">
          
          <Button 
            onClick={handleJobComplete}
            className="w-full h-32 text-4xl font-black bg-green-600 hover:bg-green-700 shadow-md rounded-xl transition-transform active:scale-95"
          >
            ✅ JOB DONE
          </Button>

          <Button variant="destructive" className="w-full h-16 text-xl font-bold rounded-xl">
            ⚠️ Report Issue
          </Button>

        </CardContent>
      </Card>
    </div>
  )
}