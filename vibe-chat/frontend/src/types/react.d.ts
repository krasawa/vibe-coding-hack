import * as React from 'react';
import { ComponentType } from 'react';

declare module 'react' {
  interface ExoticComponent<P = {}> {
    (props: P): React.ReactElement | null;
  }
}

declare module 'react-redux' {
  import { ComponentType } from 'react';
  import { Store } from 'redux';
  
  export interface ProviderProps {
    children?: React.ReactNode;
    store: Store;
  }
  
  export const Provider: React.ComponentType<ProviderProps>;
}

declare module 'react-router-dom' {
  import { ComponentType } from 'react';
  
  export interface BrowserRouterProps {
    children?: React.ReactNode;
  }
  
  export interface RouteProps {
    children?: React.ReactNode;
  }
  
  export interface RoutesProps {
    children?: React.ReactNode;
  }
  
  export interface LinkProps {
    children?: React.ReactNode;
    to: string;
    style?: React.CSSProperties;
  }
  
  export const BrowserRouter: React.ComponentType<BrowserRouterProps>;
  export const Routes: React.ComponentType<RoutesProps>;
  export const Link: React.ComponentType<LinkProps>;
} 