'use client';

import { useState } from 'react';
import { 
  Save,
  Store, 
  Bell, 
  Shield, 
  Database,
  RefreshCw
} from 'lucide-react';

// Mock settings data
const mockShopifySettings = {
  shopName: 'My Shopify Store',
  apiKey: '••••••••••••••••',
  apiSecret: '••••••••••••••••••••••••••••',
  storeUrl: 'mystore.myshopify.com',
  accessToken: '••••••••••••••••••••••••••••',
};

const mockUserSettings = {
  emailNotifications: true,
  dailyReports: false,
  weeklyReports: true,
  orderNotifications: true,
};

const mockSyncSettings = {
  autoSync: false,
  syncInterval: '24', // hours
  syncProducts: true,
  syncOrders: true,
  syncCustomers: false,
  lastSync: new Date().toISOString(),
};

export default function SettingsPage() {
  const [shopifySettings, setShopifySettings] = useState(mockShopifySettings);
  const [userSettings, setUserSettings] = useState(mockUserSettings);
  const [syncSettings, setSyncSettings] = useState(mockSyncSettings);
  const [activeTab, setActiveTab] = useState('api');
  
  const handleShopifySettingsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setShopifySettings({
      ...shopifySettings,
      [name]: value,
    });
  };
  
  const handleUserSettingsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setUserSettings({
      ...userSettings,
      [name]: checked,
    });
  };
  
  const handleSyncSettingsChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    const { type, checked } = e.target as HTMLInputElement;
    
    setSyncSettings({
      ...syncSettings,
      [name]: type === 'checkbox' ? checked : value,
    });
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // In a real app, this would save to the server
    alert('Settings saved successfully!');
  };
  
  return (
    <div className="max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Settings</h1>
      
      {/* Tabs */}
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('api')}
              className={`${
                activeTab === 'api'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              <Store className="w-5 h-5 inline mr-2" />
              Shopify Connection
            </button>
            <button
              onClick={() => setActiveTab('notifications')}
              className={`${
                activeTab === 'notifications'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              <Bell className="w-5 h-5 inline mr-2" />
              Notifications
            </button>
            <button
              onClick={() => setActiveTab('sync')}
              className={`${
                activeTab === 'sync'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              <RefreshCw className="w-5 h-5 inline mr-2" />
              Sync Options
            </button>
          </nav>
        </div>
      </div>
      
      {/* Settings Content */}
      <div className="bg-white shadow rounded-lg">
        <form onSubmit={handleSubmit}>
          
          {/* Shopify API Settings */}
          {activeTab === 'api' && (
            <div className="p-6">
              <div className="mb-6">
                <h2 className="text-lg font-medium text-gray-900 mb-2">Shopify Store Connection</h2>
                <p className="text-sm text-gray-500">
                  Configure your Shopify store connection settings
                </p>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label htmlFor="shopName" className="block text-sm font-medium text-gray-700">
                    Shop Name
                  </label>
                  <input
                    type="text"
                    name="shopName"
                    id="shopName"
                    value={shopifySettings.shopName}
                    onChange={handleShopifySettingsChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  />
                </div>
                
                <div>
                  <label htmlFor="storeUrl" className="block text-sm font-medium text-gray-700">
                    Store URL
                  </label>
                  <input
                    type="text"
                    name="storeUrl"
                    id="storeUrl"
                    value={shopifySettings.storeUrl}
                    onChange={handleShopifySettingsChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  />
                </div>
                
                <div>
                  <label htmlFor="apiKey" className="block text-sm font-medium text-gray-700">
                    API Key
                  </label>
                  <input
                    type="password"
                    name="apiKey"
                    id="apiKey"
                    value={shopifySettings.apiKey}
                    onChange={handleShopifySettingsChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  />
                </div>
                
                <div>
                  <label htmlFor="apiSecret" className="block text-sm font-medium text-gray-700">
                    API Secret
                  </label>
                  <input
                    type="password"
                    name="apiSecret"
                    id="apiSecret"
                    value={shopifySettings.apiSecret}
                    onChange={handleShopifySettingsChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  />
                </div>
                
                <div>
                  <label htmlFor="accessToken" className="block text-sm font-medium text-gray-700">
                    Access Token
                  </label>
                  <input
                    type="password"
                    name="accessToken"
                    id="accessToken"
                    value={shopifySettings.accessToken}
                    onChange={handleShopifySettingsChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  />
                </div>
                
                <div className="bg-yellow-50 p-4 rounded-md">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <Shield className="h-5 w-5 text-yellow-400" aria-hidden="true" />
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-yellow-800">Security Note</h3>
                      <div className="mt-2 text-sm text-yellow-700">
                        <p>
                          Keep your API credentials secure. Never share them with anyone or commit them to version control.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* Notification Settings */}
          {activeTab === 'notifications' && (
            <div className="p-6">
              <div className="mb-6">
                <h2 className="text-lg font-medium text-gray-900 mb-2">Notification Preferences</h2>
                <p className="text-sm text-gray-500">
                  Customize when and how you receive notifications
                </p>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-start">
                  <div className="flex items-center h-5">
                    <input
                      id="emailNotifications"
                      name="emailNotifications"
                      type="checkbox"
                      checked={userSettings.emailNotifications}
                      onChange={handleUserSettingsChange}
                      className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </div>
                  <div className="ml-3 text-sm">
                    <label htmlFor="emailNotifications" className="font-medium text-gray-700">
                      Email Notifications
                    </label>
                    <p className="text-gray-500">Receive notifications via email</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="flex items-center h-5">
                    <input
                      id="dailyReports"
                      name="dailyReports"
                      type="checkbox"
                      checked={userSettings.dailyReports}
                      onChange={handleUserSettingsChange}
                      className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </div>
                  <div className="ml-3 text-sm">
                    <label htmlFor="dailyReports" className="font-medium text-gray-700">
                      Daily Reports
                    </label>
                    <p className="text-gray-500">Receive a daily summary of your store activities</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="flex items-center h-5">
                    <input
                      id="weeklyReports"
                      name="weeklyReports"
                      type="checkbox"
                      checked={userSettings.weeklyReports}
                      onChange={handleUserSettingsChange}
                      className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </div>
                  <div className="ml-3 text-sm">
                    <label htmlFor="weeklyReports" className="font-medium text-gray-700">
                      Weekly Reports
                    </label>
                    <p className="text-gray-500">Receive a weekly summary of your store performance</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="flex items-center h-5">
                    <input
                      id="orderNotifications"
                      name="orderNotifications"
                      type="checkbox"
                      checked={userSettings.orderNotifications}
                      onChange={handleUserSettingsChange}
                      className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </div>
                  <div className="ml-3 text-sm">
                    <label htmlFor="orderNotifications" className="font-medium text-gray-700">
                      Order Notifications
                    </label>
                    <p className="text-gray-500">Get notified when new orders are placed</p>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* Sync Settings */}
          {activeTab === 'sync' && (
            <div className="p-6">
              <div className="mb-6">
                <h2 className="text-lg font-medium text-gray-900 mb-2">Data Synchronization</h2>
                <p className="text-sm text-gray-500">
                  Configure how and when your Shopify data is synchronized
                </p>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-start">
                  <div className="flex items-center h-5">
                    <input
                      id="autoSync"
                      name="autoSync"
                      type="checkbox"
                      checked={syncSettings.autoSync}
                      onChange={handleSyncSettingsChange}
                      className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </div>
                  <div className="ml-3 text-sm">
                    <label htmlFor="autoSync" className="font-medium text-gray-700">
                      Automatic Synchronization
                    </label>
                    <p className="text-gray-500">Automatically sync data on a schedule</p>
                  </div>
                </div>
                
                <div>
                  <label htmlFor="syncInterval" className="block text-sm font-medium text-gray-700">
                    Sync Interval (hours)
                  </label>
                  <select
                    id="syncInterval"
                    name="syncInterval"
                    value={syncSettings.syncInterval}
                    onChange={handleSyncSettingsChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    disabled={!syncSettings.autoSync}
                  >
                    <option value="1">1 hour</option>
                    <option value="6">6 hours</option>
                    <option value="12">12 hours</option>
                    <option value="24">24 hours</option>
                    <option value="48">48 hours</option>
                  </select>
                </div>
                
                <div className="pt-2 pb-2">
                  <p className="text-sm font-medium text-gray-700 mb-2">Data to Synchronize</p>
                  
                  <div className="space-y-2">
                    <div className="flex items-start">
                      <div className="flex items-center h-5">
                        <input
                          id="syncProducts"
                          name="syncProducts"
                          type="checkbox"
                          checked={syncSettings.syncProducts}
                          onChange={handleSyncSettingsChange}
                          className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                      </div>
                      <div className="ml-3 text-sm">
                        <label htmlFor="syncProducts" className="font-medium text-gray-700">
                          Products
                        </label>
                      </div>
                    </div>
                    
                    <div className="flex items-start">
                      <div className="flex items-center h-5">
                        <input
                          id="syncOrders"
                          name="syncOrders"
                          type="checkbox"
                          checked={syncSettings.syncOrders}
                          onChange={handleSyncSettingsChange}
                          className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                      </div>
                      <div className="ml-3 text-sm">
                        <label htmlFor="syncOrders" className="font-medium text-gray-700">
                          Orders
                        </label>
                      </div>
                    </div>
                    
                    <div className="flex items-start">
                      <div className="flex items-center h-5">
                        <input
                          id="syncCustomers"
                          name="syncCustomers"
                          type="checkbox"
                          checked={syncSettings.syncCustomers}
                          onChange={handleSyncSettingsChange}
                          className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                      </div>
                      <div className="ml-3 text-sm">
                        <label htmlFor="syncCustomers" className="font-medium text-gray-700">
                          Customers
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-md">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <Database className="h-5 w-5 text-gray-400" aria-hidden="true" />
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-gray-800">Last Synchronized</h3>
                      <div className="mt-2 text-sm text-gray-700">
                        <p>
                          {new Date(syncSettings.lastSync).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* Submit Button - Always shown */}
          <div className="px-4 py-3 bg-gray-50 text-right sm:px-6 rounded-b-lg">
            <button
              type="submit"
              className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <Save className="h-4 w-4 mr-2" />
              Save Settings
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 