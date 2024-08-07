package com.mcorp.wallapopserver.controllers;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.mcorp.wallapopserver.DTO.BasicProductDTO;
import com.mcorp.wallapopserver.DTO.ProductDTO;
import com.mcorp.wallapopserver.DTO.ProductStatusUpdateDTO;
import com.mcorp.wallapopserver.models.Category;
import com.mcorp.wallapopserver.models.Product;
import com.mcorp.wallapopserver.security.user.WallapopUserDetails;
import com.mcorp.wallapopserver.services.CategoryService;
import com.mcorp.wallapopserver.services.FileStorageService;
import com.mcorp.wallapopserver.services.ProductService;
import com.mcorp.wallapopserver.services.UserService;
import com.mcorp.wallapopserver.utils.UrlUtil;
import java.security.Principal;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.logging.ErrorManager;
import java.util.stream.Collectors;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;


@RestController
@RequestMapping("/api/products")
public class ProductController {

  @Autowired
  private ProductService productService;
  @Autowired
  private CategoryService categoryService;
  @Autowired
  private ObjectMapper objectMapper;
  @Autowired
  private FileStorageService fileStorageService;
  @Autowired
  private UserService userService;

  @GetMapping("/all-products") // TODO convert to basicProductDTO
  public List<ProductDTO> getAllProducts() {
    List<Product> products = productService.getAllProducts();
      return products.stream()
        .map(this::convertToDTO)  // Ensure every product is converted to DTO with proper URLs
        .collect(Collectors.toList());
  }



  @GetMapping("/{id}")
  public ResponseEntity<ProductDTO> getProductById(@PathVariable Long id) {
    return productService.incrementViewCount(id)
        .map(product -> ResponseEntity.ok(
            convertToDTO(product)))
        .orElseGet(() -> ResponseEntity.<ProductDTO>notFound()
            .build());
  }

  @GetMapping("/my-products")
  @PreAuthorize("isAuthenticated()")
  public ResponseEntity<List<ProductDTO>> getUserProducts(Principal principal) {
    try {
      // Assuming you have a way to extract the user ID from the Principal or from the token directly
      Long userId = userService.getUserIdFromPrincipal(principal);
      List<Product> products = productService.getProductsByUserId(userId);
      List<ProductDTO> productDTOs = products.stream()
          .map(this::convertToDTO)
          .collect(Collectors.toList());
      return ResponseEntity.ok(productDTOs);
    } catch (Exception e) {
      e.printStackTrace();
      return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(new ArrayList<>());
    }
  }

  @PostMapping("/create-product")
  @PreAuthorize("hasRole('ROLE_USER')")
  public ResponseEntity<?> createProduct(
      @RequestParam("product") String productJson,
      @RequestParam("images") MultipartFile[] files,
      @AuthenticationPrincipal WallapopUserDetails currentUser) {
    try {
      ProductDTO productDTO = objectMapper.readValue(productJson, ProductDTO.class);
      Product product = productService.createProduct(productDTO, currentUser.getId());

      List<String> storedFileNames = fileStorageService.storeFiles(files, product.getId());
      List<String> imageUrls = storedFileNames.stream()
          .map(filename -> UrlUtil.createImageUrl(filename))
          .collect(Collectors.toList());
      product.setImageUrls(imageUrls);
      productService.saveProduct(product);

      return ResponseEntity.ok(convertToDTO(product));
    } catch (Exception e) {
      e.printStackTrace();
      return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
          .body("Failed to create product with images");
    }
  }

  @PutMapping("/edit-product/{productId}")
  @PreAuthorize("hasRole('ROLE_USER')")
  public ResponseEntity<?> editProduct(
      @PathVariable("productId") Long productId,
      @RequestParam("product") String productJson,
      @RequestParam(value = "images", required = false) MultipartFile[] files,
      @AuthenticationPrincipal WallapopUserDetails currentUser) {
    try {
      ProductDTO productDTO = objectMapper.readValue(productJson, ProductDTO.class);
      Optional<Product> optionalExistingProduct = productService.getProductById(productId);

      if (!optionalExistingProduct.isPresent()) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Product not found");
      }

      Product existingProduct = optionalExistingProduct.get();
      if (!existingProduct.getUser().getId().equals(currentUser.getId())) {
        return ResponseEntity.status(HttpStatus.FORBIDDEN).body("You do not have permission to edit this product");
      }

      Product updatedProduct = productService.updateProduct(productDTO, existingProduct, files);

      return ResponseEntity.ok(convertToDTO(updatedProduct));
    } catch (Exception e) {
      e.printStackTrace();
      return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
          .body("Failed to edit product");
    }
  }


  @PutMapping("/{id}/status")
  public ResponseEntity<?> updateProductStatus(@PathVariable Long id, @RequestBody ProductStatusUpdateDTO statusUpdate) {
    try {
      Product product = productService.getProductById(id)
          .orElseThrow(() -> new RuntimeException("Product not found"));
      product.setProductStatus(statusUpdate.getProductStatus());
      System.out.println("Updating product status to: " + statusUpdate.getProductStatus());

      productService.saveProduct(product);
      ProductStatusUpdateDTO updatedStatusDTO = convertToProductStatusUpdateDTO(product);
      return ResponseEntity.ok(updatedStatusDTO);
    } catch (Exception e) {
      e.printStackTrace(); // It's a good practice to log the stack trace for debugging.
      return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Failed to update product status");
    }
  }

  @DeleteMapping("/{id}")
  public ResponseEntity<Void> deleteProduct(@PathVariable Long id) {
    try {
      Product product = productService.getProductById(id).orElseThrow();
      productService.deleteProduct(product);
      return ResponseEntity.ok().build();
    } catch (Exception e) {
      e.printStackTrace();
      return ResponseEntity.status(500).build();
    }
  }

  // BasicProductDTO controllers
  @GetMapping("/latest-by-category/{categoryId}")
  public ResponseEntity<List<BasicProductDTO>> getLatestProductsByCategory(
      @PathVariable Long categoryId) {
    List<BasicProductDTO> products = productService.getLatestProductsByCategory(categoryId);
    if (products.isEmpty()) {
      return ResponseEntity.noContent().build();
    }
    return ResponseEntity.ok(products);
  }

  @GetMapping("/latest-by-category-wp/{categoryId}")
  public Page<BasicProductDTO> getProductsByCategory(
      @PathVariable Long categoryId,
      @RequestParam(defaultValue = "0") int page,
      @RequestParam(defaultValue = "7") int size) {
    return productService.getLatestProductsByCategory(categoryId, page, size);
  }

  @GetMapping("/latest-products")
  public Page<BasicProductDTO> getLatestProducts(
      @RequestParam(defaultValue = "0") int page,
      @RequestParam(defaultValue = "25") int size) {
    return productService.getLatestProducts(page, size);
  }

  // DTO methods

  private ProductDTO convertToDTO(Product product) {
    ProductDTO dto = new ProductDTO();
    dto.setId(product.getId());
    dto.setTitle(product.getTitle());
    dto.setPrice(product.getPrice());
    dto.setDescription(product.getDescription());
    dto.setShippingAvailable(product.isShippingAvailable());
    dto.setItemCondition(String.valueOf(product.getItemCondition()));
    dto.setAttributes(product.getAttributes());

    if (product.getCategory() != null) {
      dto.setCategoryId(product.getCategory().getId());
      dto.setCategoryName(product.getCategory().getName());
    }

    dto.setImageUrls(product.getImageUrls());
    dto.setCreatedAt(product.getCreatedAt());
    dto.setUpdatedAt(product.getUpdatedAt());
    dto.setViewCount(product.getViewCount());
    dto.setUserId(product.getUser().getId());
    dto.setProductStatus(product.getProductStatus());

    return dto;
  }

  private BasicProductDTO convertToBasicDTO(Product product) {
    BasicProductDTO dto = new BasicProductDTO();
    dto.setId(product.getId());
    dto.setTitle(product.getTitle());
    dto.setPrice(product.getPrice());
    dto.setDescription(product.getDescription());
    dto.setCategoryId(product.getCategory().getId());
    dto.setCategoryName(product.getCategory().getName());
    dto.setImageUrls(product.getImageUrls());
    dto.setCreatedAt(product.getCreatedAt());
    dto.setUpdatedAt(product.getUpdatedAt());
    dto.setProductStatus(product.getProductStatus());

    return dto;
  }

  private ProductStatusUpdateDTO convertToProductStatusUpdateDTO (Product product) {
    ProductStatusUpdateDTO dto = new ProductStatusUpdateDTO();
    dto.setProductStatus(product.getProductStatus());

    return dto;
  }
}
