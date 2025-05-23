import { useLocation } from "wouter";

export const useAppNavigation = () => {
  const [location, setLocation] = useLocation();

  const isActive = (path: string) => {
    if (path === "/" && location === "/") return true;
    if (path !== "/" && location.startsWith(path)) return true;
    return false;
  };

  const navigate = (path: string) => {
    setLocation(path);
  };

  return {
    location,
    navigate,
    isActive,
  };
};
