function Router() {
  // Force dark mode
  useEffect(() => {
    document.documentElement.classList.add('dark');
    localStorage.setItem('darkMode', 'true');
  }, []);
  
  return (
    <div className="min-h-screen">
      <ActionStyleHeader />  {/* No props needed anymore */}
      <Switch>
        {/* ... all your routes ... */}
      </Switch>
      <MobileBottomNavigation />
      <div className="md:hidden h-16"></div>
    </div>
  );
}
