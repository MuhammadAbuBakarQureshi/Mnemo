// import { createContext, useContext, useState } from "react";

// const AuthContext = createContext(null);

// export function AuthProvider({ children }) {
//   const [isAuthenticated, setIsAuthenticated] = useState(
//     () => localStorage.getItem("isAuthenticated") === "true"
//   );

//   const login = () => {
//     localStorage.setItem("isAuthenticated", "true");
//     setIsAuthenticated(true);
//   };

//   const logout = () => {
//     localStorage.removeItem("isAuthenticated");
//     setIsAuthenticated(false);
//   };

//   return (
//     <AuthContext.Provider value={{ isAuthenticated, login, logout }}>
//       {children}
//     </AuthContext.Provider>
//   );
// }

// export function useAuth() {
//   const ctx = useContext(AuthContext);
//   if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
//   return ctx;
// }