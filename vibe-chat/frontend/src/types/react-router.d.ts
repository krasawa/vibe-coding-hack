import React from 'react';
import { RouteProps } from 'react-router-dom';

// Fix React Router types
declare module 'react-router-dom' {
  export interface RouteProps {
    children?: React.ReactNode;
  }

  export interface BrowserRouterProps {
    children?: React.ReactNode;
  }

  export interface RoutesProps {
    children?: React.ReactNode;
  }

  export interface OutletProps {
    children?: React.ReactNode;
  }
}

// Fix Redux Provider types
declare module 'react-redux' {
  import { Store } from '@reduxjs/toolkit';
  
  export interface ProviderProps<A extends any = any> {
    children?: React.ReactNode;
    store: Store<A>;
    context?: React.Context<any>;
  }
}

// Fix React StrictMode and other components
declare module 'react' {
  export interface StrictModeProps {
    children?: React.ReactNode;
  }
  
  export interface StrictMode extends React.FC<StrictModeProps> {}
} 