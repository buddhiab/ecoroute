"use client"
import { useEffect, useState } from "react"
import { supabase } from "../../lib/supabase" // This connects to your database file

import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

export default function AdminDashboard() {
  // This state will hold our real data
  const [routes, setRoutes] = useState([])

  // This function fetches the data from Supabase when the page loads
  useEffect(() => {
    async function fetchRoutes() {
      const { data, error } = await supabase
        .from('Routes')
        .select('*')
      
      if (data) {
        setRoutes(data)
      } else {
        console.error("Error fetching data:", error)
      }
    }

    fetchRoutes()
  }, [])

  return (
    <div className="p-10 bg-gray-50 min-h-screen">
      <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>
      
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <h2 className="text-xl font-semibold mb-4">Live Garbage Routes</h2>
        
        <Table>
          <TableCaption>A live list of daily waste collection routes from Supabase.</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[100px]">ID</TableHead>
              <TableHead>Driver Name</TableHead>
              <TableHead>Zone</TableHead>
              <TableHead className="text-right">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {/* We map through the real data here */}
            {routes.map((route) => (
              <TableRow key={route.id}>
                <TableCell className="font-medium">{route.id}</TableCell>
                <TableCell>{route.driver_name}</TableCell>
                <TableCell>{route.zone}</TableCell>
                <TableCell className="text-right font-bold text-blue-600">{route.status}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}