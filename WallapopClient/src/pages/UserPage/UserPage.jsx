import React, { useState } from "react";
import UserSidebar from "../../components/user/UserSidebar/UserSidebar";
import UserFavourites from "../../components/user/UserFavourites/UserFavourites";
import UserProducts from "../../components/user/UserProducts/UserProducts";
// Import other necessary components

const UserPage = () => {
  const [activeComponent, setActiveComponent] = useState("Profile"); // Default component

  const renderComponent = () => {
    switch (activeComponent) {
      case "Favourites":
        return <UserFavourites />;
      case "Products":
        return <UserProducts />;
      // Add other cases as necessary
      default:
        return <div>Profile Information</div>; // Default or initial view
    }
  };

  return (
    <div style={{ display: "flex", marginTop: "100px" }}>
      <UserSidebar setActiveComponent={setActiveComponent} />
      <div style={{ flexGrow: 1 }}>{renderComponent()}</div>
    </div>
  );
};

export default UserPage;
