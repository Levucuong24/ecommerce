function Logo({ className = "", showText = true }) {
  return (
    <div className={["site-logo", className].filter(Boolean).join(" ")}>
      <div className="logo-container">
        <img
          src="/images/logoapp.png"
          alt="Ecommerce Logo"
          className="logo-image"
        />
      </div>
      {showText ? (
        <span className="site-logo-text">
          Ecommerce<span className="dot">.</span>
        </span>
      ) : null}
    </div>
  );
}

export default Logo;
