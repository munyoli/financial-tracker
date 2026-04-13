/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import OrderList from './components/OrderList';
import GarmentList from './components/GarmentList';
import OverheadView from './components/OverheadView';
import { useStore } from './hooks/useStore';
import { motion, AnimatePresence } from 'motion/react';

export default function App() {
  const [activeTab, setActiveTab] = React.useState('dashboard');
  const { 
    orders, 
    garments, 
    addOrder, 
    updateOrder, 
    deleteOrder, 
    addGarment, 
    updateGarment, 
    deleteGarment 
  } = useStore();

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
          />
        );
      case 'overhead':
        return <OverheadView />;
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

