import React, { useState } from 'react';
import BuildLoanManagementUiComponentsComponent from './components/BuildLoanManagementUiComponentsComponent';
import CreateAdministrativeInterfaceComponent from './components/CreateAdministrativeInterfaceComponent';
import CreateBookCatalogUiComponentsComponent from './components/CreateBookCatalogUiComponentsComponent';

export default function App() {
  return (
    <div className="min-h-screen bg-slate-900 text-white p-6 font-sans">
      <header className="max-w-6xl mx-auto border-b border-slate-700 pb-4 mb-6">
        <h1 className="text-3xl font-bold text-indigo-400">Library Management System</h1>
        <p className="text-xs text-slate-400 mt-1">Multi-Agent Integrated Django REST API & React SPA</p>
      </header>
      <main className="max-w-6xl mx-auto space-y-6">
        <BuildLoanManagementUiComponentsComponent />
        <CreateAdministrativeInterfaceComponent />
        <CreateBookCatalogUiComponentsComponent />
      </main>
    </div>
  );
}
