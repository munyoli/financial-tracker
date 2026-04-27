/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import OrderList from './components/OrderList';
import GarmentList from './components/GarmentList';
import ExpenseList from './components/ExpenseList';
import OverheadView from './components/OverheadView';
import Login from './components/Login';
import TeamList from './components/TeamList';
import PreQuoteSimulator from './components/PreQuoteSimulator';
import { AuthProvider, useAuth } from './context/AuthContext';
import { useStore } from './hooks/useStore';
import { motion, AnimatePresence } from 'motion/react';

function AppContent() {
  const { user, isLoading: isAuthLoading } = useAuth();
  const [activeTab, setActiveTab] = React.useState('garments');
  const { 
    orders, 
    garments, 
    addOrder, 
    updateOrder, 
    deleteOrder, 
    addGarment, 
    updateGarment, 
    deleteGarment,
    expenses,
    addExpense,
    updateExpense,
    deleteExpense
  } = useStore();
  const [prefilledGarment, setPrefilledGarment] = React.useState<any>(null);

  if (isAuthLoading) {
    return <div className="min-h-screen bg-stone-100 flex items-center justify-center">Loading session...</div>;
  }

  if (!user) {
    return <Login />;
  }

  // Force navigate staff back to garments if they somehow try to view unauthorized tabs
  if (user.role === 'STAFF' && ['dashboard', 'orders', 'expenses', 'overhead', 'team'].includes(activeTab)) {
    setActiveTab('garments');
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard orders={orders} garments={garments} />;
      case 'orders':
        return (
          <OrderList 
            orders={orders} 
            onAdd={addOrder} 
            onUpdate={updateOrder} 
            onDelete={deleteOrder} 
          />
        );
      case 'garments':
        return (
          <GarmentList 
            garments={garments} 
            orders={orders} 
            onAdd={addGarment} 
            onUpdate={updateGarment} 
            onDelete={deleteGarment}
            prefilledData={prefilledGarment}
            onClearPrefilled={() => setPrefilledGarment(null)}
            setActiveTab={setActiveTab}
          />
        );
      case 'expenses':
        return (
          <ExpenseList 
            expenses={expenses} 
            onAdd={addExpense} 
            onUpdate={updateExpense} 
            onDelete={deleteExpense} 
          />
        );
      case 'overhead':
        return <OverheadView />;
      case 'simulator':
        return (
          <PreQuoteSimulator 
            onConfirm={(draft) => {
              setPrefilledGarment({
                clientName: draft.clientName,
                type: draft.type,
                complexity: draft.complexity,
                description: draft.description,
                sellingPrice: draft.finalPrice,
                fabricCost: draft.materials,
                estimatedHours: draft.hours
              });
              setActiveTab('garments');
            }} 
          />
        );
      case 'team':
        return <TeamList />;
      default:
        return <Dashboard orders={orders} garments={garments} />;
    }
  };

  return (
    <Layout activeTab={activeTab} setActiveTab={setActiveTab}>
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
        >
          {renderContent()}
        </motion.div>
      </AnimatePresence>
    </Layout>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
