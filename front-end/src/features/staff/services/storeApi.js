const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export const getMyStore = async (token) => {
  const response = await fetch(`${apiUrl}/stores/my-store`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  if (!response.ok) {
    if (response.status === 404) return null;
    throw new Error("Failed to fetch store");
  }
  return response.json();
};

export const createStore = async (token, storeData) => {
  const response = await fetch(`${apiUrl}/stores`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(storeData),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to create store");
  }
  return response.json();
};

export const updateStore = async (token, storeData) => {
  const response = await fetch(`${apiUrl}/stores/my-store`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(storeData),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to update store");
  }
  return response.json();
};

export const createProduct = async (token, productData) => {
  const response = await fetch(`${apiUrl}/products`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(productData),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to create product");
  }
  return response.json();
};
