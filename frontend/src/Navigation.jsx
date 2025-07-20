import React from 'react';


function Navigation({  setPage, page, pages, accessControl, authenticated, setAuthenticated }) {
  // const [page, setPage] = useState('network');

  const handleLogout = async () => {
    try {
      const response = await fetch('/api/logout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        // Clear authentication state and redirect to login
        setAuthenticated(false);
        setPage('Login');
      } else {
        console.error('Logout failed');
      }
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
   <nav className="navbar navbar-expand-lg fixed-top  bg-primary">
        <a className="navbar-brand" href="#">Touch Forge Node Core 4 </a>
        <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNavAltMarkup" aria-controls="navbarNavAltMarkup" aria-expanded="false" aria-label="Toggle navigation">
            <span className="navbar-toggler-icon"></span>
        </button>
        <div className="collapse navbar-collapse " id="navbarNavAltMarkup">
            <div className="navbar-nav">
                {pages.map((pageName) => (
                    pageName === "Login" ? null : (
                        <a 
                            key={pageName}
                            className={`nav-item nav-link ${page === pageName ? 'active' : ''}`} 
                            href="#"
                            onClick={() => setPage(pageName)}
                        >
                            {pageName}
                        </a>
                    )
                ))}
                {accessControl &&  authenticated &&(
                    <>
                       <button className="btn btn-secondary ms-3" type="button" onClick={handleLogout}>
                        <i className="bi bi-box-arrow-right me-2"></i>
                        Logout
                       </button>
                    </>
                )}
            </div>
        </div>
    </nav>
  );
}

export default Navigation;