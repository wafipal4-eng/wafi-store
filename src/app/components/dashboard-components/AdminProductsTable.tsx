// app/components/dashboard-components/AdminProductsTable.tsx
"use client";

import React, { useState, useEffect } from "react";
import { useTranslations, useLocale } from "next-intl";
import { fetchAllProductsIncludeingOutOfStock, deleteProduct } from "@/app/lib/productService";
import { nis } from "@/app/lib/constants";
import { Product } from "@/app/lib/interfaces";
import { cdn } from "@/lib/cdn";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter } from "@/components/ui/dialog";
import { ViewProductModal } from "@/app/components/dashboard-components/ViewProductModal";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Pagination } from "@/components/ui/pagination";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";


export const AdminTable: React.FC = () => {
  const t = useTranslations("AdminTable");
  const locale = useLocale();
  const isRtl = locale === "ar";
  const [loading, setLoading] = useState(false);
  const [allProducts, setAllProducts] = useState<Product[]>([]); // All products
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [deleteConfirmProduct, setDeleteConfirmProduct] = useState<Product | null>(null);
  const [viewProduct, setViewProduct] = useState<Product | null>(null);
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterDiscount, setFilterDiscount] = useState("all");
  const router = useRouter();

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Fetch all products once
  useEffect(() => {
    const getProducts = async () => {
      setLoading(true);
      try {
        const fetched = await fetchAllProductsIncludeingOutOfStock();
        setAllProducts(fetched || []);
      } catch (err) {
        console.error("Error fetching products:", err);
        toast.error(t("fetchProductsError") || "Failed to load products. Please try refreshing the page.");
      } finally {
        setLoading(false);
      }
    };
    getProducts();
  }, []);

  // Apply filters and search to all products
  useEffect(() => {
    let result = [...allProducts];

    // Apply search filter
    if (searchTerm.trim() !== "") {
      result = result.filter(p =>
        (p.name ?? "").toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply status filter
    if (filterStatus !== "all") {
      result = result.filter(p => p.in_stock === (filterStatus === "inStock"));
    }

    // Apply discount filter
    if (filterDiscount !== "all") {
      result = result.filter(p =>
        filterDiscount === "discount" ? !!p.new_price : !p.new_price
      );
    }

    setFilteredProducts(result);
    setCurrentPage(1); // Reset to first page when filters change
  }, [searchTerm, allProducts, filterStatus, filterDiscount]);

  // Get paginated products from filtered results
  const paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const totalPages = Math.ceil(filteredProducts.length / pageSize);

  const handleDelete = async () => {
    if (!deleteConfirmProduct) return;
    const success = await deleteProduct(deleteConfirmProduct.id);
    if (success) {
      setAllProducts(prev => prev.filter(p => p.id !== deleteConfirmProduct.id));
      toast.success(t("deleteSuccess") || "Product deleted");
    } else {
      toast.error(t("deleteFailed") || "Delete failed");
    }
    setDeleteConfirmProduct(null);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="loading loading-spinner loading-lg text-indigo-500" />
      </div>
    );
  }

  return (
    <div dir={isRtl ? "rtl" : "ltr"} className="space-y-4">

      <div className="flex flex-wrap gap-4 items-center">
        <Input
          placeholder={t("searchPlaceholder") || "Search products..."}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />

        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="border rounded-md px-3 py-2 text-sm"
        >
          <option value="all">{t("allStatuses")}</option>
          <option value="inStock">{t("inStock")}</option>
          <option value="outOfStock">{t("outOfStock")}</option>
        </select>

        <select
          value={filterDiscount}
          onChange={(e) => setFilterDiscount(e.target.value)}
          className="border rounded-md px-3 py-2 text-sm"
        >
          <option value="all">{t("allDiscounts")}</option>
          <option value="discount">{t("onDiscount")}</option>
          <option value="noDiscount">{t("noDiscount")}</option>
        </select>
      </div>

      <Dialog
        open={!!deleteConfirmProduct}
        onOpenChange={() => setDeleteConfirmProduct(null)}
      >
        <DialogContent>
          <p className="text-sm text-gray-700">{t("confirmDeleteProduct")}</p>
          <DialogFooter className="pt-4 flex justify-end gap-2">
            <Button variant="outline" onClick={() => setDeleteConfirmProduct(null)}>
              {t("cancel")}
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              {t("delete")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="overflow-x-auto rounded-xl border border-gray-200 shadow bg-white">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50">
              <TableHead className={`min-w-[180px] ${isRtl ? "text-right" : "text-left"}`}>
                {t("product")}
              </TableHead>

              <TableHead className="min-w-[100px] text-center">{t("price")}</TableHead>
              <TableHead className="min-w-[100px] text-center">{t("status")}</TableHead>
              <TableHead className="min-w-[120px] text-center">{t("updateProduct")}</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {paginatedProducts.map(p => (
              <TableRow key={p.id} className="hover:bg-gray-50 transition-colors duration-200">
                <TableCell className="align-top">
                  <div className="flex items-start gap-3">
                    <div className="h-14 w-14 overflow-hidden rounded-md bg-gray-100 flex items-center justify-center">
                      {p.main_image ? (
                        <img
                          src={cdn(p.main_image)}
                          alt={p.name || "Product image"}
                          className="h-full w-full object-contain"
                        />
                      ) : (
                        <span className="text-xs text-gray-400">No Image</span>
                      )}
                    </div>
                    <div className="space-y-0.5">
                      <p className="font-medium text-gray-900">{p.name}</p>
                      <p className="text-xs text-gray-400 truncate max-w-[180px]">{p.id}</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-sm text-green-600 font-semibold text-right">
                  {p.new_price ? (
                    <div className="flex flex-col items-center space-y-1">
                      <span>
                        {p.new_price} {nis}
                      </span>
                      <span className=" text-red-500 items-center line-through text-xs font-normal">
                        {p.price} {nis}
                      </span>
                    </div>
                  ) : (
                    <>
                      <div className="flex flex-col items-center space-y-1">
                        {p.price} {nis}
                      </div>
                    </>

                  )}
                </TableCell>

                <TableCell className="text-center">
                  <span
                    className={`inline-block px-2 py-1 text-xs rounded-full font-medium ${p.in_stock ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"
                      }`}
                  >
                    {p.in_stock ? t("inStock") : t("outOfStock")}
                  </span>
                </TableCell>
                <TableCell className="text-center space-x-2">
                  <Button
                    variant="outline"
                    className="border border-gray-500 text-gray-500 px-3 py-1 text-xs rounded-full hover:bg-gray-500 hover:text-white transition"
                    onClick={() => setViewProduct(p)}
                  >
                    {t("view")}
                  </Button>
                  <Button
                    variant="outline"
                    className="border border-blue-600 text-blue-600 px-3 py-1 text-xs rounded-full hover:bg-blue-600 hover:text-white transition"
                    onClick={() => router.push(`/dashboard/update-product/${p.id}`)}
                  >
                    {t("updateProduct")}
                  </Button>

                  <Button
                    variant="outline"
                    className="border border-red-500 text-red-500 px-3 py-1 text-xs rounded-full hover:bg-red-500 hover:text-white transition"
                    onClick={() => setDeleteConfirmProduct(p)}
                  >
                    {t("delete")}
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Pagination Controls */}
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
        isRTL={isRtl}
        pageSize={pageSize}
        totalItems={filteredProducts.length}
        onPageSizeChange={(size) => {
          setPageSize(size);
          setCurrentPage(1); // Reset to first page when changing page size
        }}
      />

      <ViewProductModal viewProduct={viewProduct} setViewProduct={setViewProduct} />
    </div>
  );
}