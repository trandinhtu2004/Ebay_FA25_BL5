import React, { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  BsHeart,
  BsStarFill,
  BsShieldCheck,
  BsTruck,
  BsPerson,
  BsShop,
  BsEnvelope,
} from "react-icons/bs";
import { toast } from "react-toastify";
import Header from "../components/Header";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";

const API_URL = "http://localhost:5001/api/products"; // Đảm bảo port đúng với backend
const CART_API_URL = "http://localhost:5001/api/cart";
const REVIEW_API_URL = "http://localhost:5001/api/reviews";

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { addToCart } = useCart();

  // State
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [activeImage, setActiveImage] = useState("");

  // State cho sản phẩm tương tự
  const [similarProducts, setSimilarProducts] = useState([]);

  // State cho reviews của sản phẩm
  const [reviews, setReviews] = useState([]);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [reviewsError, setReviewsError] = useState(null);

  // --- 1. Fetch Product & Similar Products ---
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // A. Lấy chi tiết sản phẩm hiện tại
        const response = await fetch(`${API_URL}/${id}`);
        if (!response.ok) throw new Error("Failed to fetch product");
        const data = await response.json();

        setProduct(data);
        if (data.images && data.images.length > 0) {
          setActiveImage(data.images[0]);
        }

        // B. Lấy sản phẩm tương tự (Cùng category, trừ sản phẩm hiện tại)
        if (data.category) {
          fetchSimilarProducts(data.category._id || data.category, data._id);
        }

        // C. Lấy reviews cho sản phẩm
        fetchProductReviews(data._id);
      } catch (error) {
        console.error(error);
        toast.error("Không thể tải thông tin sản phẩm");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    window.scrollTo(0, 0);
  }, [id]);

  const handleBuyItNow = () => {
    if (!isAuthenticated) {
        toast.info("Vui lòng đăng nhập để mua hàng");
        navigate('/login');
        return;
    }

    try {
        const buyNowItem = {
            productId: product._id,
            quantity: quantity,
            isBuyNow: true,
            price: product.price, 
            title: product.title,
            image: product.images?.[0]
        };
        const buyNowCart = {
            products: [buyNowItem] 
        };
        localStorage.setItem('buyNowCart', JSON.stringify(buyNowCart));
        
        toast.info(`Đơn hàng mua ngay cho ${quantity} x ${product.title} đã được tạo.`);
        navigate('/detail/checkout');

    } catch (error) {
        toast.error("Lỗi khi chuẩn bị đơn hàng mua ngay");
        console.error(error);
    }
};
  // Hàm lấy sản phẩm tương tự (Tách ra để gọn code)
  const fetchSimilarProducts = async (categoryId, currentId) => {
    try {
      // Cách 1: Nếu Backend có API filter, hãy dùng API đó (tốt hơn)
      // Cách 2 (Hiện tại): Lấy hết về rồi filter client-side (chỉ ổn khi ít dữ liệu)
      const res = await fetch(API_URL);
      const allData = await res.json();

      // Lọc các sản phẩm cùng category.name hoặc category._id và khác ID hiện tại
      // Lưu ý: Tùy vào backend trả về category là object hay string ID mà điều chỉnh
      const filtered = allData.filter((p) => {
        const prodCatId = p.category?._id || p.category;
        return prodCatId === categoryId && p._id !== currentId;
      });

      setSimilarProducts(filtered.slice(0, 5)); // Lấy 5 sản phẩm
    } catch (error) {
      console.error("Failed to fetch similar products", error);
    }
  };

  const fetchProductReviews = async (productId) => {
    try {
      setLoadingReviews(true);
      setReviewsError(null);
      const res = await fetch(`${REVIEW_API_URL}/${productId}`);
      if (!res.ok) {
        throw new Error("Failed to fetch reviews");
      }
      const data = await res.json();
      setReviews(data || []);
    } catch (error) {
      console.error("Failed to fetch reviews", error);
      setReviewsError("Không thể tải đánh giá.");
    } finally {
      setLoadingReviews(false);
    }
  };

  // --- 2. Add to Cart ---
  const handleAddToCart = async () => {
    if (!isAuthenticated) {
      toast.info("Vui lòng đăng nhập để mua hàng");
      navigate("/login");
      return;
    }

    try {
      await addToCart(product._id, quantity);
      toast.success("Đã thêm vào giỏ hàng!");
    } catch (error) {
      toast.error("Lỗi khi thêm vào giỏ hàng");
      console.error(error);
    }
  };

  if (loading) return <div className="text-center py-20">Loading...</div>;
  if (!product)
    return <div className="text-center py-20">Product not found</div>;

  // Lấy thông tin seller từ product đã populate
  const seller = product.seller || {};

  return (
    <div className="bg-white min-h-screen font-sans text-[#191919]">
      <Header />

      {/* Breadcrumb */}
      <div className="max-w-[1280px] mx-auto px-4 py-2 text-xs text-gray-500">
        <Link to="/" className="hover:underline text-blue-700">
          eBay
        </Link>{" "}
        {">"}
        <Link
          to={`/all-products?category=${encodeURIComponent(
            product.category?.name
          )}`}
          className="hover:underline text-blue-700"
        >
          {product.category?.name || "Category"}
        </Link>{" "}
        {">"}
        <span className="font-bold text-gray-700">{product.title}</span>
      </div>

      <div className="max-w-[1280px] mx-auto px-4 py-6">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* --- LEFT: IMAGE GALLERY --- */}
          <div className="w-full lg:w-[40%]">
            <div className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden border border-gray-200 mb-4">
              <img
                src={
                  activeImage || "https://placehold.co/500x500?text=No+Image"
                }
                alt={product.title}
                className="w-full h-full object-contain"
              />
            </div>
            {/* Thumbnails */}
            {product.images && product.images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-2">
                {product.images.map((img, idx) => (
                  <div
                    key={idx}
                    onClick={() => setActiveImage(img)}
                    className={`w-16 h-16 border rounded-md cursor-pointer flex-shrink-0 hover:opacity-80 ${
                      activeImage === img
                        ? "border-blue-500 border-2"
                        : "border-gray-300"
                    }`}
                  >
                    <img
                      src={img}
                      alt=""
                      className="w-full h-full object-cover rounded-md"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* --- MIDDLE: PRODUCT INFO --- */}
          <div className="w-full lg:w-[40%]">
            <h1 className="text-2xl font-bold mb-2 leading-tight">
              {product.title}
            </h1>

            {/* Rating */}
            <div className="flex items-center gap-1 text-sm mb-4 border-b border-gray-200 pb-4">
              <div className="flex text-yellow-500">
                {Array.from({ length: 5 }, (_, i) => (
                  <BsStarFill
                    key={i}
                    className={i < (product.rating || 0) ? "" : "text-gray-300"}
                  />
                ))}
              </div>
              <span className="text-gray-500">
                ({product.numReviews || 0} reviews)
              </span>
            </div>

            <div className="bg-gray-50 p-4 rounded border border-gray-200 mb-6">
              <div className="flex items-baseline gap-2 mb-2">
                <span className="text-sm text-gray-600">Price:</span>
                <span className="text-3xl font-bold text-black">
                  US ${product.price.toLocaleString()}
                </span>
              </div>

              {/* Quantity */}
              <div className="flex items-center gap-4 mb-6">
                <label className="text-sm font-bold">Quantity:</label>
                <input
                  type="number"
                  min="1"
                  max={product.stock}
                  value={quantity}
                  onChange={(e) => setQuantity(Number(e.target.value))}
                  className="w-16 border border-gray-300 rounded px-2 py-1 text-center"
                />
                <span className="text-xs text-gray-500">
                  {product.stock > 10
                    ? "More than 10 available"
                    : `${product.stock} available`}
                </span>
              </div>

              <div className="flex flex-col gap-3">
                <button
                  onClick={handleBuyItNow} // Sử dụng hàm đã định nghĩa
                  className="w-full bg-[#3665f3] hover:bg-[#2b50c4] text-white font-bold py-3 rounded-full transition"
                >
                  Buy It Now {" "}
                </button>
                <button
                  onClick={handleAddToCart}
                  className="w-full bg-[#d6e3ff] text-[#0654ba] hover:bg-[#c3d5f5] font-bold py-3 rounded-full transition"
                >
                  Add to cart
                </button>
                <button className="w-full border border-[#3665f3] text-[#3665f3] hover:bg-blue-50 font-bold py-2 rounded-full transition flex items-center justify-center gap-2">
                  <BsHeart /> Add to Watchlist
                </button>
              </div>
            </div>

            <div className="space-y-3 text-sm text-gray-700">
              <div className="flex gap-3">
                <BsTruck className="text-xl" />
                <div>
                  <span className="font-bold">Shipping:</span>{" "}
                  <span className="text-xs text-gray-500">
                    Calculate at checkout
                  </span>
                </div>
              </div>
              <div className="flex gap-3">
                <BsShieldCheck className="text-xl" />
                <div>
                  <span className="font-bold">eBay Money Back Guarantee.</span>
                </div>
              </div>
            </div>
          </div>

          {/* --- RIGHT: SELLER INFO (UPDATED) --- */}
          <div className="w-full lg:w-[20%]">
            <div className="border border-gray-200 rounded p-4 shadow-sm bg-white">
              <h3 className="font-bold text-sm mb-3 text-gray-900">
                About this seller
              </h3>

              <div className="flex items-start gap-3 mb-4">
                {/* Avatar: Dùng avatarURL từ DB, nếu rỗng dùng placeholder */}
                <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-100 border border-gray-300 flex-shrink-0">
                  <img
                    src={
                      seller.avatarURL ||
                      "https://ir.ebaystatic.com/cr/v/c01/buyer_dweb_individual.jpg"
                    }
                    alt={seller.username}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.src =
                        "https://ir.ebaystatic.com/cr/v/c01/buyer_dweb_individual.jpg";
                    }} // Fallback nếu link ảnh lỗi
                  />
                </div>

                <div className="overflow-hidden">
                  <Link
                    to="#"
                    className="text-blue-700 font-bold hover:underline block truncate text-base"
                    title={seller.username}
                  >
                    {seller.username || "Unknown"}
                  </Link>
                  <div className="text-xs text-gray-500 mt-0.5">
                    {/* Logic hiển thị rating nếu có, tạm thời fix cứng hoặc lấy từ db user nếu có */}
                    100% Positive feedback
                  </div>
                </div>
              </div>

              <hr className="border-gray-100 my-3" />

              <div className="space-y-2 text-sm">
                <button className="flex items-center gap-2 text-blue-700 hover:underline w-full text-left">
                  <BsHeart className="text-xs" /> Save this seller
                </button>
                <button className="flex items-center gap-2 text-blue-700 hover:underline w-full text-left">
                  <BsEnvelope className="text-xs" /> Contact seller
                </button>
                <button className="flex items-center gap-2 text-blue-700 hover:underline w-full text-left">
                  <BsShop className="text-xs" /> Visit store
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* --- DESCRIPTION & IMAGES --- */}
        <div className="mt-12 border-t border-gray-200 pt-8">
          <h2 className="text-xl font-bold mb-4 bg-gray-100 p-2 inline-block rounded-t border-t border-l border-r border-gray-200">
            Description
          </h2>
          <div className="border border-gray-200 p-6 rounded-b rounded-r min-h-[150px]">
            {/* Văn bản mô tả */}
            <p className="whitespace-pre-line text-gray-800 leading-relaxed mb-8">
              {product.description}
            </p>

            {/* 3 Ảnh trong Description */}
            {product.images && product.images.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                {product.images.slice(0, 3).map((img, index) => (
                  <div
                    key={index}
                    className="border border-gray-200 rounded p-1"
                  >
                    <img
                      src={img}
                      alt={`Description shot ${index + 1}`}
                      className="w-full h-auto object-contain max-h-[400px]"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* --- REVIEWS --- */}
        <div className="mt-12 border-t border-gray-200 pt-8">
          <h2 className="text-xl font-bold mb-4 bg-gray-100 p-2 inline-block rounded-t border-t border-l border-r border-gray-200">
            Reviews
          </h2>
          <div className="border border-gray-200 p-6 rounded-b rounded-r min-h-[100px]">
            {loadingReviews ? (
              <div className="text-sm text-gray-500">Đang tải đánh giá...</div>
            ) : reviewsError ? (
              <div className="text-sm text-red-500">{reviewsError}</div>
            ) : reviews.length === 0 ? (
              <div className="text-sm text-gray-600">
                Chưa có đánh giá nào cho sản phẩm này.
              </div>
            ) : (
              <div className="space-y-4">
                {reviews.map((rev) => (
                  <div
                    key={rev._id}
                    className="border-b border-gray-100 pb-3 last:border-b-0"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="text-sm font-semibold text-gray-900">
                        {rev.reviewer?.username || "Người dùng"}
                      </div>
                      <div className="text-xs text-gray-500">
                        {rev.createdAt
                          ? new Date(rev.createdAt).toLocaleDateString()
                          : ""}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mb-1">
                      <div className="flex text-yellow-500">
                        {Array.from({ length: 5 }, (_, i) => (
                          <BsStarFill
                            key={i}
                            className={
                              i < (rev.rating || 0)
                                ? ""
                                : "text-gray-300"
                            }
                          />
                        ))}
                      </div>
                      <span className="text-xs text-gray-600">
                        {rev.rating}/5
                      </span>
                    </div>
                    {rev.comment && (
                      <p className="text-sm text-gray-700 whitespace-pre-line">
                        {rev.comment}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* --- SIMILAR PRODUCTS --- */}
        {similarProducts.length > 0 && (
          <div className="mt-12">
            <h2 className="text-xl font-bold mb-4">Similar Products</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
              {similarProducts.map((prod) => (
                <Link
                  to={`/product/${prod._id}`}
                  key={prod._id}
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-lg transition cursor-pointer bg-white block no-underline"
                >
                  <div className="relative w-full aspect-square bg-gray-100 rounded-lg overflow-hidden mb-3 border border-gray-200">
                    <img
                      src={
                        prod.images && prod.images.length > 0
                          ? prod.images[0]
                          : "https://placehold.co/200x200?text=No+Image"
                      }
                      alt={prod.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <h3 className="text-sm font-medium text-gray-800 mb-1 line-clamp-2 hover:text-blue-700 hover:underline">
                    {prod.title}
                  </h3>
                  <div className="font-bold text-lg text-gray-900">
                    ${prod.price.toLocaleString()}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="border-t border-gray-200 mt-12 bg-white text-xs text-gray-500 py-10 text-center">
        Copyright © 1995-2025 eBay Inc. All Rights Reserved.
      </footer>
    </div>
  );
};

export default ProductDetail;
