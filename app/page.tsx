"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Package, 
  ShoppingCart, 
  BarChart, 
  RefreshCw,
  DollarSign,
  Users,
  ShoppingBag,
  Clock,
  ArrowRight
} from 'lucide-react';
import { format } from 'date-fns';

interface SalesSummary {
  totalOrders: number;
  totalSales: {
    amount: string;
    currencyCode: string;
  };
  averageOrderValue: {
    amount: string;
    currencyCode: string;
  };
}

// Mock data for dashboard
const mockSalesSummary: SalesSummary = {
  totalOrders: 32,
  totalSales: {
    amount: '32771.30',
    currencyCode: 'USD',
  },
  averageOrderValue: {
    amount: '1024.10',
    currencyCode: 'USD',
  }
};

const mockProductCount = 19;

export default function Home() {
  const [recentSales, setRecentSales] = useState<SalesSummary | null>(mockSalesSummary);
  const [productCount, setProductCount] = useState<number>(mockProductCount);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Dashboard quick link cards
  const quickLinks = [
    {
      title: 'View Products',
      description: 'Browse and manage your Shopify products',
      icon: Package,
      href: '/products',
      color: 'bg-blue-500',
    },
    {
      title: 'View Orders',
      description: 'See all your store orders and details',
      icon: ShoppingCart,
      href: '/orders',
      color: 'bg-green-500',
    },
    {
      title: 'Sales Analytics',
      description: 'Analyze your sales performance',
      icon: BarChart,
      href: '/analytics',
      color: 'bg-purple-500',
    },
    {
      title: 'Sync Data',
      description: 'Update data from your Shopify store',
      icon: RefreshCw,
      href: '/sync',
      color: 'bg-orange-500',
    },
  ];

  // Stat cards for the dashboard
  const statCards = [
    {
      title: 'Total Sales (30d)',
      value: recentSales ? 
        `${recentSales.totalSales.currencyCode} ${parseFloat(recentSales.totalSales.amount).toLocaleString()}` : 
        '-',
      icon: DollarSign,
      color: 'bg-green-100 text-green-800',
    },
    {
      title: 'Total Orders (30d)',
      value: recentSales ? recentSales.totalOrders.toLocaleString() : '-',
      icon: ShoppingBag,
      color: 'bg-blue-100 text-blue-800',
    },
    {
      title: 'Avg. Order Value',
      value: recentSales ? 
        `${recentSales.averageOrderValue.currencyCode} ${parseFloat(recentSales.averageOrderValue.amount).toLocaleString()}` : 
        '-',
      icon: ShoppingCart,
      color: 'bg-purple-100 text-purple-800',
    },
    {
      title: 'Total Products',
      value: productCount.toLocaleString(),
      icon: Package,
      color: 'bg-yellow-100 text-yellow-800',
    },
  ];

  if (error) {
    return (
      <div className="text-center py-10">
        <h1 className="text-2xl font-bold text-red-600 mb-4">Error Loading Dashboard</h1>
        <p className="text-gray-700">{error}</p>
        <button 
          onClick={() => window.location.reload()} 
          className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Dashboard</h1>
      
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statCards.map((stat, index) => (
          <div 
            key={index} 
            className="bg-white rounded-lg shadow p-6 flex items-center space-x-4"
          >
            <div className={`p-3 rounded-full ${stat.color}`}>
              <stat.icon className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">{stat.title}</p>
              <p className="text-2xl font-semibold text-gray-900">
                {isLoading ? (
                  <span className="h-7 w-24 bg-gray-200 animate-pulse rounded inline-block"></span>
                ) : (
                  stat.value
                )}
              </p>
            </div>
          </div>
        ))}
      </div>
      
      {/* Quick Links Grid */}
      <h2 className="text-xl font-semibold text-gray-800 mb-4">Quick Links</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {quickLinks.map((link, index) => (
          <Link 
            key={index} 
            href={link.href}
            className="bg-white rounded-lg shadow overflow-hidden hover:shadow-md transition-shadow"
          >
            <div className={`h-2 ${link.color}`}></div>
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className={`p-2 rounded ${link.color} bg-opacity-10`}>
                  <link.icon className={`h-6 w-6 ${link.color.replace('bg-', 'text-')}`} />
                </div>
                <ArrowRight className="h-5 w-5 text-gray-400" />
              </div>
              <h3 className="font-medium text-gray-900 mb-1">{link.title}</h3>
              <p className="text-sm text-gray-500">{link.description}</p>
            </div>
          </Link>
        ))}
      </div>
      
      {/* Last Sync Status */}
      <div className="bg-white rounded-lg shadow p-4 flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <Clock className="h-5 w-5 text-gray-500" />
          <span className="text-sm text-gray-500">
            Last data sync: {format(new Date(), 'MMM dd, yyyy HH:mm')}
          </span>
        </div>
        
        <Link 
          href="/sync" 
          className="px-4 py-2 bg-blue-500 text-white text-sm rounded hover:bg-blue-600 transition-colors inline-flex items-center space-x-2"
        >
          <RefreshCw className="h-4 w-4" />
          <span>Sync Now</span>
        </Link>
      </div>
    </div>
  );
}
