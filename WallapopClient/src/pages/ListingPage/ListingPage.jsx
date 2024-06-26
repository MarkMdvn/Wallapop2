import React, { useState } from "react";
import CategorySelector from "../../components/ProductListing/CategorySelector/CategorySelector";
import CarForm from "../../components/ProductListing/Forms/MainForms/CarForm/CarForm";
import JobsForm from "../../components/ProductListing/Forms/MainForms/JobsForm/JobsForm";
import PropertyForm from "../../components/ProductListing/Forms/MainForms/PropertyForm/PropertyForm";
import SubcategorySelector from "../../components/ProductListing/Forms/OtherItemsForm/SubcategorySelector/SubcategorySelector";
import ImageSelector from "../../components/ProductListing/Forms/ImageSelector/ImageSelector";
import { sellProduct } from "../../api/productService";

const ListingPage = () => {
  const [submitButtonVisible, setSubmitButtonVisible] = useState();
  const [formData, setFormData] = useState({
    title: "",
    price: "",
    description: "",
    shippingAvailable: false,
    itemCondition: "NEW",
    categoryId: 3,
    categoryName: "",
    attributes: {},
    images: Array(10).fill(null),
  });

  const handleSelectCategory = (category) => {
    const categoryIds = {
      Cars: 2,
      Properties: 3,
      Jobs: 4,
      OtherItems: 1,
    };
    setFormData({
      ...formData,
      categoryName: category,
      categoryId: categoryIds[category],
    });
  };

  const handleInputChange = (name, value, isAttribute = false) => {
    if (isAttribute) {
      setFormData((prev) => ({
        ...prev,
        attributes: { ...prev.attributes, [name]: value },
      }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };
  const handleSubmit = async () => {
    const data = new FormData();

    // Append each image file to the FormData
    formData.images.forEach((file, index) => {
      if (file) data.append("images", file); // Use 'image' as the key expected by the backend
    });

    // Append other form data as a stringified object
    data.append(
      "product",
      JSON.stringify({
        title: formData.title,
        price: formData.price,
        description: formData.description,
        shippingAvailable: formData.shippingAvailable,
        itemCondition: formData.itemCondition,
        categoryId: formData.categoryId,
        categoryName: formData.categoryName,
        attributes: formData.attributes,
      })
    );

    try {
      const response = await sellProduct(data);
      console.log("Product created:", response.data);
    } catch (error) {
      console.error("Failed to post product:", error);
    }
  };

  const renderForm = () => {
    switch (formData.categoryName) {
      case "Cars":
        return (
          <CarForm formData={formData} handleInputChange={handleInputChange} />
        );
      case "Jobs":
        return (
          <JobsForm formData={formData} handleInputChange={handleInputChange} />
        );
      case "Properties":
        return (
          <PropertyForm
            formData={formData}
            handleInputChange={handleInputChange}
          />
        );
      case "OtherItems":
        return (
          <SubcategorySelector
            formData={formData}
            handleInputChange={handleInputChange}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="listing-page-container">
      <h1 className="listing-page-h1">Post your product</h1>
      <CategorySelector
        onSelectCategory={handleSelectCategory}
        selectedCategory={formData.categoryName}
      />
      {formData.categoryName && renderForm()}
      {formData.categoryName && (
        <ImageSelector
          images={formData.images}
          onImageChange={(newImages) =>
            setFormData({ ...formData, images: newImages })
          }
        />
      )}

      <button onClick={handleSubmit} className="submit-product-button">
        Submit Product
      </button>
    </div>
  );
};

export default ListingPage;
