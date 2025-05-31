"use client";

import MainLayout from "@/components/layout/MainLayout";
import StatCard from "@/components/cards/StatCard";
import PieChart from "@/components/charts/PieChart";
import BarChart from "@/components/charts/BarChart";
import ActivityCard from "@/components/cards/ActivityCard";
import PropertyStatusCard from "@/components/cards/PropertyStatusCard";
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export default function DashboardDirectPage() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          setUser(session.user);
        } else {
          // If not authenticated, redirect to login
          window.location.href = '/login';
        }
      } catch (error) {
        console.error('Error checking auth:', error);
      } finally {
        setLoading(false);
      }
    };
    
    checkAuth();
  }, []);
  
  // Sample data for the dashboard
  const statCards = [
    {
      title: "Total Income",
      value: "$24,560",
      icon: "ri-money-dollar-circle-line",
      trend: {
        value: "12%",
        positive: true,
      },
    },
    {
      title: "Total Expenses",
      value: "$8,420",
      icon: "ri-shopping-bag-line",
      trend: {
        value: "5%",
        positive: false,
      },
    },
    {
      title: "Occupancy Rate",
      value: "87%",
      icon: "ri-home-line",
      trend: {
        value: "3%",
        positive: true,
      },
    },
    {
      title: "Pending Maintenance",
      value: "12",
      icon: "ri-tools-line",
      trend: {
        value: "2",
        positive: false,
      },
    },
  ];

  const occupancyData = [
    { name: "Occupied", value: 87, itemStyle: { color: "#4CAF50" } },
    { name: "Vacant", value: 13, itemStyle: { color: "#F44336" } },
  ];

  const incomeData = [
    { name: "Rent", value: 75, itemStyle: { color: "#2196F3" } },
    { name: "Deposits", value: 10, itemStyle: { color: "#9C27B0" } },
    { name: "Fees", value: 15, itemStyle: { color: "#FF9800" } },
  ];

  const monthlyIncomeData = {
    xAxisData: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
    series: [
      {
        name: "Income",
        data: [12500, 13200, 14100, 13800, 15200, 16500],
        color: "#4CAF50",
      },
      {
        name: "Expenses",
        data: [4200, 4500, 4800, 4300, 5100, 5500],
        color: "#F44336",
      },
    ],
  };

  const activities = [
    {
      id: "1",
      title: "New Tenant",
      description: "John Smith signed a lease for Apartment 3B",
      time: "2 hours ago",
      icon: "ri-user-add-line",
      iconColor: "green",
    },
    {
      id: "2",
      title: "Maintenance Request",
      description: "Plumbing issue reported in Unit 5A",
      time: "5 hours ago",
      icon: "ri-tools-line",
      iconColor: "yellow",
    },
    {
      id: "3",
      title: "Payment Received",
      description: "Sarah Johnson paid $1,200 for June rent",
      time: "Yesterday",
      icon: "ri-money-dollar-circle-line",
      iconColor: "blue",
    },
    {
      id: "4",
      title: "Lease Ending",
      description: "Michael Brown's lease expires in 15 days",
      time: "2 days ago",
      icon: "ri-calendar-event-line",
      iconColor: "purple",
    },
  ];

  const properties = [
    {
      id: "1",
      name: "Sunset Apartments",
      total: 24,
      occupied: 22,
      vacant: 1,
      maintenance: 1,
    },
    {
      id: "2",
      name: "Riverfront Condos",
      total: 16,
      occupied: 13,
      vacant: 2,
      maintenance: 1,
    },
    {
      id: "3",
      name: "Highland Townhomes",
      total: 12,
      occupied: 10,
      vacant: 1,
      maintenance: 1,
    },
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 mb-4">You need to be logged in to view this page.</p>
          <button 
            onClick={() => window.location.href = '/login'} 
            className="px-4 py-2 bg-blue-500 text-white rounded"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <MainLayout>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((card, index) => (
          <StatCard
            key={index}
            title={card.title}
            value={card.value}
            icon={card.icon}
            trend={card.trend}
          />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        <PieChart title="Occupancy Rate" data={occupancyData} />
        <PieChart title="Income Sources" data={incomeData} />
      </div>

      <div className="mt-6">
        <BarChart
          title="Monthly Income & Expenses"
          xAxisData={monthlyIncomeData.xAxisData}
          series={monthlyIncomeData.series}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        <ActivityCard activities={activities} />
        <PropertyStatusCard properties={properties} />
      </div>

      <div className="card mt-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Customize Your Dashboard</h3>
          <button className="btn-outline">
            <i className="ri-settings-line mr-1" />
            Settings
          </button>
        </div>
        <p className="text-gray-500 dark:text-gray-400">
          You can customize your dashboard to show the information that matters most to you.
          Add or remove widgets, change the layout, and more.
        </p>
      </div>
    </MainLayout>
  );
}
