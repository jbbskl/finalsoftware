export const isAdmin = (role?: string) => role === "admin";
export const isAgency = (role?: string) => role === "agency";
export const isCreator = (role?: string) => role === "creator";

export const hasAccess = (userRole?: string, requiredRole?: string) => {
  if (!userRole || !requiredRole) return false;
  
  // Admin has access to everything
  if (userRole === "admin") return true;
  
  // Agency has access to agency and creator content
  if (userRole === "agency" && (requiredRole === "agency" || requiredRole === "creator")) {
    return true;
  }
  
  // Creator only has access to creator content
  if (userRole === "creator" && requiredRole === "creator") {
    return true;
  }
  
  return false;
};
