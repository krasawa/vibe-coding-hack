// Add React type declarations
declare module 'react' {
  export = React;
}

declare namespace React {
  interface FC<P = {}> {
    (props: P): React.ReactElement | null;
  }
  
  type ReactElement = any;
  type ReactNode = ReactElement | string | number | boolean | null | undefined;
  
  interface CSSProperties {
    [key: string]: any;
  }
  
  interface SyntheticEvent {
    preventDefault(): void;
    stopPropagation(): void;
    target: any;
    currentTarget: any;
  }
  
  interface FormEvent<T = Element> extends SyntheticEvent {
    target: T;
  }
  
  interface ChangeEvent<T = Element> extends SyntheticEvent {
    target: T & { value: string; files?: FileList };
  }
  
  interface MouseEvent<T = Element> extends SyntheticEvent {
    target: T;
    currentTarget: T;
  }
  
  type RefObject<T> = {
    current: T | null;
  };
  
  function useState<T>(initialState: T | (() => T)): [T, (newState: T | ((prevState: T) => T)) => void];
  function useEffect(effect: () => void | (() => void), deps?: any[]): void;
  function useRef<T>(initialValue: T | null): RefObject<T>;

  // Add the Fragment component
  const Fragment: FC;
}

// React Router DOM
declare module 'react-router-dom' {
  export const BrowserRouter: React.FC;
  export const Routes: React.FC;
  export const Route: React.FC<RouteProps>;
  export const Navigate: React.FC<NavigateProps>;
  export const Link: React.FC<LinkProps>;
  export const Outlet: React.FC;
  export function useNavigate(): (path: string) => void;
  export function useParams<T extends Record<string, string>>(): T;
  export function useLocation(): { pathname: string };
  
  interface RouteProps {
    path?: string;
    index?: boolean;
    element?: React.ReactNode;
  }
  
  interface NavigateProps {
    to: string;
    replace?: boolean;
  }
  
  interface LinkProps {
    to: string;
    style?: React.CSSProperties;
  }
}

// Add JSX namespace for intrinsic elements
declare namespace JSX {
  interface IntrinsicElements {
    div: any;
    span: any;
    form: any;
    input: any;
    img: any;
    [elemName: string]: any;
  }
}

// React Redux
declare module 'react-redux' {
  export function useSelector<TState, TSelected>(
    selector: (state: TState) => TSelected,
    equalityFn?: (left: TSelected, right: TSelected) => boolean
  ): TSelected;
  
  export function useDispatch<TDispatch = any>(): TDispatch;
  
  export const Provider: React.FC<{ store: any }>;
}

// MUI
declare module '@mui/material' {
  export const Box: React.FC<{ sx?: any; [key: string]: any }>;
  export const Typography: React.FC<{ variant?: string; color?: string; sx?: any; [key: string]: any }>;
  export const Button: React.FC<{ variant?: string; color?: string; sx?: any; [key: string]: any }>;
  export const TextField: React.FC<{ variant?: string; label?: string; [key: string]: any }>;
  export const Container: React.FC<{ component?: string; maxWidth?: string; [key: string]: any }>;
  export const Paper: React.FC<{ elevation?: number; sx?: any; [key: string]: any }>;
  export const Alert: React.FC<{ severity?: string; sx?: any; [key: string]: any }>;
  export const CircularProgress: React.FC<{ size?: number; [key: string]: any }>;
  export const Divider: React.FC<{ variant?: string; component?: string; [key: string]: any }>;
  export const Avatar: React.FC<{ src?: string; sx?: any; [key: string]: any }>;
  export const List: React.FC<{ [key: string]: any }>;
  export const ListItem: React.FC<{ [key: string]: any }>;
  export const ListItemText: React.FC<{ primary?: React.ReactNode; secondary?: React.ReactNode; [key: string]: any }>;
  export const ListItemAvatar: React.FC<{ [key: string]: any }>;
  export const IconButton: React.FC<{ color?: string; edge?: string; [key: string]: any }>;
  export const CssBaseline: React.FC;
  export const AppBar: React.FC<{ position?: string; sx?: any; [key: string]: any }>;
  export const Toolbar: React.FC<{ [key: string]: any }>;
  export const Menu: React.FC<{ id?: string; anchorEl: any; open: boolean; onClose: () => void; [key: string]: any }>;
  export const MenuItem: React.FC<{ disabled?: boolean; [key: string]: any }>;
  export const ListItemIcon: React.FC<{ [key: string]: any }>;
  export const Drawer: React.FC<{ variant?: string; open?: boolean; [key: string]: any }>;
  export const Dialog: React.FC<{ open: boolean; onClose: () => void; [key: string]: any }>;
  export const DialogTitle: React.FC<{ [key: string]: any }>;
  export const DialogContent: React.FC<{ [key: string]: any }>;
  export const DialogContentText: React.FC<{ [key: string]: any }>;
  export const DialogActions: React.FC<{ [key: string]: any }>;
  export const Tabs: React.FC<{ value: number; onChange: (event: any, value: number) => void; [key: string]: any }>;
  export const Tab: React.FC<{ label: React.ReactNode; id?: string; [key: string]: any }>;
  export const Badge: React.FC<{ badgeContent: number; color?: string; [key: string]: any }>;
  export const InputAdornment: React.FC<{ position: string; [key: string]: any }>;
  export const Checkbox: React.FC<{ 
    edge?: string;
    checked?: boolean;
    tabIndex?: number;
    disableRipple?: boolean;
    [key: string]: any;
  }>;
  export const Tooltip: React.FC<{
    title: React.ReactNode;
    arrow?: boolean;
    children: React.ReactNode;
    [key: string]: any;
  }>;
  
  export function createTheme(options: any): any;
  export const ThemeProvider: React.FC<{ theme: any; [key: string]: any }>;
  export const useTheme: () => any;
  export const useMediaQuery: (query: any) => boolean;
}

// MUI Icons
declare module '@mui/icons-material' {
  export const AccountCircle: React.FC<{ [key: string]: any }>;
  export const Menu: React.FC<{ [key: string]: any }>;
  export const Logout: React.FC<{ [key: string]: any }>;
  export const Settings: React.FC<{ [key: string]: any }>;
  export const Search: React.FC<{ [key: string]: any }>;
  export const Add: React.FC<{ [key: string]: any }>;
  export const PersonAdd: React.FC<{ [key: string]: any }>;
  export const Check: React.FC<{ [key: string]: any }>;
  export const Close: React.FC<{ [key: string]: any }>;
  export const Send: React.FC<{ [key: string]: any }>;
  export const AttachFile: React.FC<{ [key: string]: any }>;
  export const Group: React.FC<{ [key: string]: any }>;
  export const EmojiEmotions: React.FC<{ fontSize?: string; [key: string]: any }>;
}

// Date-fns
declare module 'date-fns' {
  export function format(date: Date | number, formatStr: string): string;
}

// Socket.IO Client
declare module 'socket.io-client' {
  export interface SocketOptions {
    auth?: {
      token: string;
    };
    transports?: string[];
  }
  
  export interface Socket {
    on(event: string, callback: (data: any) => void): this;
    emit(event: string, data: any): this;
    disconnect(): this;
    connected: boolean;
    id: string;
    join(room: string): this;
    leave(room: string): this;
    to(room: string): { emit: (event: string, data: any) => void };
  }
  
  export function io(uri: string, options?: SocketOptions): Socket;
}

// Node process global
declare const process: {
  env: {
    [key: string]: string | undefined;
    REACT_APP_WS_URL?: string;
  };
};

// Axios
declare module 'axios' {
  export interface AxiosResponse<T = any> {
    data: T;
    status: number;
    statusText: string;
    headers: any;
    config: any;
  }

  export interface AxiosError<T = any> {
    response?: {
      data?: T;
      status?: number;
      headers?: any;
    };
    request?: any;
    message?: string;
  }

  export interface AxiosRequestConfig {
    url?: string;
    method?: string;
    baseURL?: string;
    headers?: any;
    params?: any;
    data?: any;
    timeout?: number;
    withCredentials?: boolean;
    responseType?: string;
  }

  export function post<T = any>(
    url: string, 
    data?: any, 
    config?: AxiosRequestConfig
  ): Promise<AxiosResponse<T>>;
  
  export function get<T = any>(
    url: string, 
    config?: AxiosRequestConfig
  ): Promise<AxiosResponse<T>>;
  
  export function put<T = any>(
    url: string, 
    data?: any, 
    config?: AxiosRequestConfig
  ): Promise<AxiosResponse<T>>;
  
  export function deleteMethod<T = any>(
    url: string, 
    config?: AxiosRequestConfig
  ): Promise<AxiosResponse<T>>;

  export default axios;
} 