import { useState } from "react";

const logoSrc = "/images/Screenshot%202026-05-10%20234635.png";

function Logo({ className = "", showText = true }) {
  const [hasError, setHasError] = useState(false);

  return (
    <div className={["site-logo", className].filter(Boolean).join(" ")}>
      {!hasError ? (
        <img
          src={logoSrc}
          alt="Ecommerce logo"
          className="site-logo-image"
          onError={() => setHasError(true)}
        />
      ) : (
        <div className="site-logo-fallback">E</div>
      )}

      {showText ? <span className="site-logo-text">Ecommerce</span> : null}
    </div>
  );
}

export default Logo;
