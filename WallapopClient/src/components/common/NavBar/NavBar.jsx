import React, { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import "./NavBar.css";
import { useAuth } from "../../auth/AuthProvider";
import { BsPlusCircle } from "react-icons/bs";
import { AiOutlineHeart } from "react-icons/ai";
import { TbMail } from "react-icons/tb";

const NavBar = ({ enableScrollEffect = true }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [showNavbar, setShowNavbar] = useState(true);

  let lastScrollTop = 0;

  const handleScroll = () => {
    const scrollTop = window.scrollY || document.documentElement.scrollTop;

    if (scrollTop > lastScrollTop) {
      // Downscroll
      setShowNavbar(false);
    } else {
      // Upscroll
      setShowNavbar(true);
    }
    lastScrollTop = scrollTop <= 0 ? 0 : scrollTop; // For Mobile or negative scrolling
  };

  useEffect(() => {
    if (enableScrollEffect) {
      window.addEventListener("scroll", handleScroll);
      return () => {
        window.removeEventListener("scroll", handleScroll);
      };
    }
  }, [enableScrollEffect]);

  const handleSell = () => {
    navigate("/products/sell-product");
  };

  const handleProfileClick = () => {
    navigate("/user");
  };

  const handleFavouritesClick = () => {
    if (user) {
      navigate("/user?favourites=true"); // Direct to the user page with the 'favourites' query parameter
    } else {
      navigate("/authentication"); // Navigate to login page if not logged in
    }
  };

  return (
    <nav
      className={`navbar ${showNavbar ? "navbar-visible" : "navbar-hidden"}`}
    >
      <div className="container">
        <div className="logo">
          <Link to="/">
            <img
              src="/wallapop_logo.png"
              alt="Wallapop Logo"
              className="logo-main-img"
            />
            <img
              src="/wallapop_word_logo.jpg"
              alt="Wallapop Logo Text"
              className="logo-main-text-img"
            />
          </Link>
        </div>
        <div className="search-container">
          <input
            type="search"
            placeholder="Buscar..."
            className="search-input"
          />
        </div>
        <div className="right-nav-container">
          {user ? (
            <>
              <div className="navbar-user-buttons">
                <div
                  className="navbar-user-buttons-fav"
                  onClick={handleFavouritesClick}
                >
                  <AiOutlineHeart /> Favourites
                </div>
                <div className="navbar-user-buttons-mail">
                  <TbMail /> Mailbox
                </div>
              </div>
              <div
                className="user-profile-container"
                onClick={handleProfileClick}
              >
                <img
                  src={
                    user.profileImg
                      ? `data:image/jpeg;base64,${user.profileImg}`
                      : "/user-default.png"
                  }
                  alt={`${user.name}'s profile`}
                  style={{ width: 35, height: 35, borderRadius: "50%" }}
                />
                You
              </div>
            </>
          ) : (
            <Link to="/authentication">
              <button className="btn register-btn-navbar">
                Regístrate o inicia sesión
              </button>
            </Link>
          )}
          <button className="btn sell-btn-navbar" onClick={handleSell}>
            <BsPlusCircle /> Vender
          </button>
        </div>
      </div>
    </nav>
  );
};

export default NavBar;
