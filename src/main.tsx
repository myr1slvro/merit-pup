import React from 'react';
import ReactDOM from 'react-dom/client';

import App from './App';

import './globals.css';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import AuthProvider from './components/navigation/AuthProvider'

const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
  },
]);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  </React.StrictMode>,
);
