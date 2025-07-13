import React from 'react';


function Navigation({  setPage, page }) {
  // const [page, setPage] = useState('network');

  return (
   <nav className="navbar navbar-expand-lg fixed-top  bg-primary">
        <a className="navbar-brand" href="#">Touch Forge Node Core 4 </a>
        <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNavAltMarkup" aria-controls="navbarNavAltMarkup" aria-expanded="false" aria-label="Toggle navigation">
            <span className="navbar-toggler-icon"></span>
        </button>
        <div className="collapse navbar-collapse " id="navbarNavAltMarkup">
            <div className="navbar-nav">
            <a className="nav-item nav-link active" href="#">Network Settings <span className="sr-only">(current)</span></a>
            <a className="nav-item nav-link" href="#">Security</a>
            <a className="nav-item nav-link" href="#">Firmware</a>
            <a className="nav-item nav-link disabled" href="#">Disabled</a>
            </div>
        </div>
    </nav>
  );
}

export default Navigation;