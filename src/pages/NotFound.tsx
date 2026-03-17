import { useLocation } from "react-router-dom";
import { useEffect } from "react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted">
      <title>Saldin | NotFound</title>
      <meta name="description" content="Manage your notfound easily with Saldin." />
      <meta property="og:title" content="Saldin - NotFound" />
      <meta property="og:description" content="Manage your notfound easily with Saldin." />
        
      <div className="max-w-[100vw] leading-relaxed text-center">
        <h1 className="leading-relaxed mb-4 text-4xl font-bold">404</h1>
        <p className="leading-relaxed mb-4 text-xl text-muted-foreground">Oops! Page not found</p>
        <a href="/" className="max-w-[100vw] leading-relaxed text-primary underline hover:text-primary/90">
          Return to Home
        </a>
      </div>
    </div>
  );
};

export default NotFound;
