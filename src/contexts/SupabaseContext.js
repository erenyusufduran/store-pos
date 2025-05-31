import { createContext, useContext, useEffect, useState } from "react";

const SupabaseContext = createContext();

export const useSupabase = () => {
  return useContext(SupabaseContext);
};

export const SupabaseProvider = ({ children }) => {
  const [isOnline, setIsOnline] = useState(false);

  useEffect(() => {
    const checkOnlineStatus = async () => {
      const isOnline = await window.api.isOnline();
      setIsOnline(isOnline);
    };
    checkOnlineStatus();
  }, []);

  const fetchSupabaseData = async (tableName, columns) => {
    const data = await window.api.fetchSupabaseData({ tableName, columns });
    return data;
  };

  const syncSupabase = async () => {
    const data = await window.api.syncSupabase();
    return data;
  };

  return (
    <SupabaseContext.Provider
      value={{ isOnline, fetchSupabaseData, syncSupabase }}
    >
      {children}
    </SupabaseContext.Provider>
  );
};
