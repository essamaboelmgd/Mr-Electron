import { AnchorHTMLAttributes, ReactNode } from 'react';
import {
  Link as WouterLink,
  Redirect as WouterRedirect,
  Route as WouterRoute,
  Switch as WouterSwitch,
  useLocation as useWouterLocation,
  useParams as useWouterParams,
  useSearchParams as useWouterSearchParams
} from 'wouter';

export const BrowserRouter = ({ children }: { children: ReactNode }) => <>{children}</>;

export const Routes = ({ children }: { children: ReactNode }) => <WouterSwitch>{children}</WouterSwitch>;

export const Route = ({ path, element }: { path?: string; element?: ReactNode }) => (
  <WouterRoute path={path}>{() => element}</WouterRoute>
);

export const Navigate = ({ to, replace = false }: { to: string; replace?: boolean }) => (
  <WouterRedirect to={to} replace={replace} />
);

export const useNavigate = () => {
  const [, setLocation] = useWouterLocation();
  return (to: string | number, options?: { replace?: boolean; state?: unknown }) => {
    if (typeof to === 'number') {
      window.history.go(to);
      return;
    }
    setLocation(to, options);
  };
};

export const useParams = <T extends Record<string, string | undefined> = Record<string, string | undefined>>() => useWouterParams<T>();

export const useLocation = () => {
  const [location] = useWouterLocation();
  const parsed = new URL(location, window.location.origin);
  return { pathname: parsed.pathname, search: parsed.search, hash: parsed.hash };
};

export const useSearchParams = () => useWouterSearchParams();

type LinkProps = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href'> & { to: string };

export const Link = ({ to, ...props }: LinkProps) => <WouterLink href={to} {...props} />;

interface NavLinkProps extends Omit<LinkProps, 'className'> {
  end?: boolean;
  className?: string | ((props: { isActive: boolean }) => string | undefined);
}

export const NavLink = ({ to, end = false, className, ...props }: NavLinkProps) => {
  const [location] = useWouterLocation();
  const pathname = location.split('?')[0];
  const isActive = end ? pathname === to : pathname === to || pathname.startsWith(`${to.replace(/\/$/, '')}/`);
  const resolvedClassName = typeof className === 'function' ? className({ isActive }) : className;
  return <WouterLink href={to} className={resolvedClassName} {...props} />;
};
