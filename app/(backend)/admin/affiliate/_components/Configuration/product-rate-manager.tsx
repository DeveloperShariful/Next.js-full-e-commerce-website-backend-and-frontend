// File: app/(backend)/admin/affiliate/_components/Configuration/product-rate-manager.tsx

"use client";

import { useState, useTransition, useEffect } from "react";
import { useForm } from "react-hook-form";
import { CommissionType, Prisma } from "@prisma/client";
import {
  Plus, Search, X, Loader2, Package,
  User, Users, CheckCircle, Ban, Percent, AlertCircle, Trophy,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useGlobalStore } from "@/app/providers/global-store-provider";
import {
  deleteRateAction,
  upsertRateAction,
  searchProducts,
} from "@/app/actions/backend/affiliate/_services/product-rate-service";
import { searchAffiliatesForDropdown } from "@/app/actions/backend/affiliate/_services/coupon-tag-service";
import { getAllTiers } from "@/app/actions/backend/affiliate/_services/tier-service";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ProductInfo {
  id: string;
  name: string;
  price: Prisma.Decimal | number | string;
  affiliateCommissionRate: Prisma.Decimal | number | string | null;
  affiliateCommissionType: CommissionType | null;
}

interface TierInfo {
  id: string;
  name: string;
  color?: string | null;
}

interface ProductRateWithRelations {
  id: string;
  productId: string;
  rate: Prisma.Decimal | number | string;
  type: CommissionType;
  isDisabled: boolean;
  affiliateId: string | null;
  tierId: string | null;
  product: ProductInfo;
  affiliate?: { id: string; slug: string; user: { name: string | null } } | null;
  tier?: TierInfo | null;
}

interface ProductSearchResult {
  id: string;
  name: string;
  price: Prisma.Decimal | number | string;
  affiliateCommissionRate?: Prisma.Decimal | number | string | null;
}

interface TargetSearchResult {
  id: string;
  name: string;
  sub?: string;
  color?: string | null;
}

interface RateFormData {
  productId: string;
  targetType: "GLOBAL" | "AFFILIATE" | "TIER";
  targetId: string;
  rate: number | string;
  type: CommissionType;
  isDisabled: boolean;
}

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialData: ProductRateWithRelations | null;
  onSuccess: () => void;
}

interface Props {
  initialRates: ProductRateWithRelations[];
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function ProductRateManager({ initialRates }: Props) {
  const [rates, setRates] = useState(initialRates);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRate, setEditingRate] = useState<ProductRateWithRelations | null>(null);
  const [search, setSearch] = useState("");

  const { formatPrice } = useGlobalStore();

  const filteredRates = rates.filter((r) =>
    r.product.name.toLowerCase().includes(search.toLowerCase()) ||
    r.affiliate?.user.name?.toLowerCase().includes(search.toLowerCase()) ||
    r.tier?.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleCreate = () => {
    setEditingRate(null);
    setIsModalOpen(true);
  };

  const handleEdit = (rate: ProductRateWithRelations) => {
    setEditingRate(rate);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Remove this commission override?")) return;
    const res = await deleteRateAction(id);
    if (res.success) {
      setRates((prev) => prev.filter((r) => r.id !== id));
      toast.success(res.message);
    } else {
      toast.error(res.message);
    }
  };

  return (
    <div className="space-y-0">
      {/* ── WP Toolbar ─────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-[#c3c4c7]">
        <p className="text-[13px] text-[#50575e]">
          Product-level overrides take priority over global and tier rates.
          <span className="hidden sm:inline">
            {" "}{rates.length} override{rates.length !== 1 ? "s" : ""} defined.
          </span>
        </p>
        <button
          onClick={handleCreate}
          className="inline-flex items-center gap-1.5 bg-[#2271b1] hover:bg-[#135e96] text-white text-[13px] font-medium px-3 py-[5px] rounded border border-[#135e96] transition-colors whitespace-nowrap shrink-0"
        >
          <Plus className="w-3.5 h-3.5" />
          Add Override
        </button>
      </div>

      {/* ── Search ─────────────────────────────────────────────────────────── */}
      <div className="pt-3 pb-2">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-2.5 top-2 w-3.5 h-3.5 text-[#646970]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search product, affiliate, tier…"
            className="w-full pl-8 pr-3 py-[5px] text-[13px] border border-[#8c8f94] rounded bg-white text-[#1d2327] placeholder-[#646970] focus:outline-none focus:border-[#2271b1] focus:ring-[3px] focus:ring-[#2271b1]/25"
          />
        </div>
      </div>

      {/* ── WP Widefat Table ───────────────────────────────────────────────── */}
      <div className="border border-[#c3c4c7] rounded-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-[13px] text-[#1d2327]">
            <thead>
              <tr className="bg-[#f6f7f7] border-b border-[#c3c4c7]">
                <th className="text-left px-3 py-2 font-semibold text-[#1d2327] whitespace-nowrap">
                  Product
                </th>
                <th className="text-left px-3 py-2 font-semibold text-[#1d2327] whitespace-nowrap hidden md:table-cell">
                  Applies To
                </th>
                <th className="text-left px-3 py-2 font-semibold text-[#1d2327] whitespace-nowrap">
                  Override Rate
                </th>
                <th className="text-left px-3 py-2 font-semibold text-[#1d2327] whitespace-nowrap hidden sm:table-cell">
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredRates.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-3 py-10 text-center text-[#50575e]">
                    <div className="flex flex-col items-center gap-2">
                      <Package className="w-8 h-8 text-[#c3c4c7]" />
                      <span>
                        {search
                          ? "No overrides match your search."
                          : "No product overrides defined yet."}
                      </span>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredRates.map((rate, idx) => (
                  <tr
                    key={rate.id}
                    className={cn(
                      "group border-b border-[#c3c4c7] last:border-0 hover:bg-[#eaecf0] transition-colors",
                      idx % 2 === 0 ? "bg-white" : "bg-[#f9f9f9]"
                    )}
                  >
                    {/* Product */}
                    <td className="px-3 py-2 align-middle">
                      <div className="flex items-start gap-2 min-w-0">
                        <Package className="w-4 h-4 text-[#646970] shrink-0 mt-0.5" />
                        <div className="min-w-0">
                          <span className="font-medium text-[#1d2327] block truncate max-w-[160px] sm:max-w-[240px]">
                            {rate.product.name}
                          </span>
                          <span className="text-[11px] text-[#646970]">
                            Price: {formatPrice(Number(rate.product.price))}
                            {rate.product.affiliateCommissionRate && (
                              <>
                                {" "}· Default:{" "}
                                {Number(rate.product.affiliateCommissionRate)}
                                {rate.product.affiliateCommissionType === "PERCENTAGE" ? "%" : ""}
                              </>
                            )}
                          </span>
                          {/* Row actions */}
                          <div className="flex items-center gap-2 mt-0.5 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => handleEdit(rate)}
                              className="text-[#2271b1] hover:text-[#135e96] hover:underline text-[12px]"
                            >
                              Edit
                            </button>
                            <span className="text-[#c3c4c7]">|</span>
                            <button
                              onClick={() => handleDelete(rate.id)}
                              className="text-[#d63638] hover:text-[#b32d2e] hover:underline text-[12px]"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Applies To */}
                    <td className="px-3 py-2 align-middle hidden md:table-cell">
                      {rate.affiliate ? (
                        <span className="inline-flex items-center gap-1 text-[12px] font-medium text-[#2271b1] bg-[#f0f6fc] border border-[#2271b1]/20 px-2 py-0.5 rounded">
                          <User className="w-3 h-3" />
                          {rate.affiliate.user.name ?? rate.affiliate.slug}
                        </span>
                      ) : rate.tier ? (
                        <span className="inline-flex items-center gap-1 text-[12px] font-medium text-[#7c3aed] bg-[#f5f3ff] border border-[#7c3aed]/20 px-2 py-0.5 rounded">
                          {rate.tier.color ? (
                            <span
                              className="w-2 h-2 rounded-full shrink-0"
                              style={{ backgroundColor: rate.tier.color }}
                            />
                          ) : (
                            <Trophy className="w-3 h-3" />
                          )}
                          {rate.tier.name}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[12px] text-[#50575e] bg-[#f6f7f7] border border-[#c3c4c7] px-2 py-0.5 rounded">
                          <Users className="w-3 h-3" />
                          Global
                        </span>
                      )}
                    </td>

                    {/* Override Rate */}
                    <td className="px-3 py-2 align-middle">
                      {rate.isDisabled ? (
                        <span className="text-[#50575e] line-through text-[12px]">Disabled</span>
                      ) : (
                        <span className="inline-flex items-center gap-0.5 text-[12px] font-bold bg-[#edfaef] text-[#00a32a] border border-[#00a32a]/30 px-1.5 py-0.5 rounded">
                          {rate.type === "FIXED" ? (
                            <>{Number(rate.rate).toFixed(2)}</>
                          ) : (
                            <>{Number(rate.rate)}<Percent className="w-2.5 h-2.5" /></>
                          )}
                        </span>
                      )}
                    </td>

                    {/* Status */}
                    <td className="px-3 py-2 align-middle hidden sm:table-cell">
                      {rate.isDisabled ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#d63638] bg-[#fcf0f1] border border-[#d63638]/30 px-1.5 py-0.5 rounded">
                          <Ban className="w-3 h-3" />
                          Disabled
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#00a32a] bg-[#edfaef] border border-[#00a32a]/30 px-1.5 py-0.5 rounded">
                          <CheckCircle className="w-3 h-3" />
                          Active
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {filteredRates.length > 0 && (
        <p className="text-[12px] text-[#646970] pt-1">
          {filteredRates.length} item{filteredRates.length !== 1 ? "s" : ""}
          {search ? " found" : ""}
        </p>
      )}

      {isModalOpen && (
        <RateModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          initialData={editingRate}
          onSuccess={() => {
            setIsModalOpen(false);
            window.location.reload();
          }}
        />
      )}
    </div>
  );
}

// ─── Modal ────────────────────────────────────────────────────────────────────

function RateModal({ isOpen, onClose, initialData, onSuccess }: ModalProps) {
  const [isPending, startTransition] = useTransition();
  const { symbol } = useGlobalStore();

  const { register, handleSubmit, watch, setValue } = useForm<RateFormData>({
    defaultValues: {
      productId: initialData?.productId ?? "",
      targetType: initialData?.affiliateId
        ? "AFFILIATE"
        : initialData?.tierId
        ? "TIER"
        : "GLOBAL",
      targetId: initialData?.affiliateId ?? initialData?.tierId ?? "",
      rate: initialData?.rate ? Number(initialData.rate) : "",
      type: initialData?.type ?? "FIXED",
      isDisabled: initialData?.isDisabled ?? false,
    },
  });

  const targetType = watch("targetType");
  const commissionType = watch("type");
  const isDisabled = watch("isDisabled");

  // ── Product search ───────────────────────────────────────────────────────
  const [prodSearchTerm, setProdSearchTerm] = useState("");
  const [prodResults, setProdResults] = useState<ProductSearchResult[]>([]);
  const [isSearchingProd, setIsSearchingProd] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<ProductSearchResult | null>(
    initialData?.product
      ? { id: initialData.product.id, name: initialData.product.name, price: initialData.product.price }
      : null
  );

  // ── Target search ────────────────────────────────────────────────────────
  const [targetSearchTerm, setTargetSearchTerm] = useState("");
  const [targetResults, setTargetResults] = useState<TargetSearchResult[]>([]);
  const [isSearchingTarget, setIsSearchingTarget] = useState(false);

  const initialTargetName = initialData?.affiliate
    ? initialData.affiliate.user.name
    : initialData?.tier?.name ?? null;
  const initialTargetId = initialData?.affiliateId ?? initialData?.tierId ?? null;

  const [selectedTarget, setSelectedTarget] = useState<TargetSearchResult | null>(
    initialTargetName && initialTargetId
      ? { id: initialTargetId, name: initialTargetName }
      : null
  );

  // Product search debounce
  useEffect(() => {
    const t = setTimeout(async () => {
      if (prodSearchTerm.length > 1) {
        setIsSearchingProd(true);
        const results = await searchProducts(prodSearchTerm);
        setProdResults(results);
        setIsSearchingProd(false);
      } else {
        setProdResults([]);
      }
    }, 300);
    return () => clearTimeout(t);
  }, [prodSearchTerm]);

  // Reset target when targetType changes
  useEffect(() => {
    if (targetType === "GLOBAL") {
      setSelectedTarget(null);
      setTargetSearchTerm("");
      setValue("targetId", "");
    }
    setTargetResults([]);
  }, [targetType, setValue]);

  // Target search debounce
  useEffect(() => {
    const t = setTimeout(async () => {
      if (!targetSearchTerm) {
        setTargetResults([]);
        return;
      }
      setIsSearchingTarget(true);
      if (targetType === "AFFILIATE") {
        const res = await searchAffiliatesForDropdown(targetSearchTerm);
        setTargetResults(
          res.map((r) => ({
            id: r.id,
            name: r.user.name ?? "Unknown",
            sub: r.user.email,
          }))
        );
      } else if (targetType === "TIER") {
        const tiers = await getAllTiers();
        setTargetResults(
          tiers
            .filter((t) => t.name.toLowerCase().includes(targetSearchTerm.toLowerCase()))
            .map((t) => ({
              id: t.id,
              name: t.name,
              sub: `${t._count?.affiliates ?? 0} members`,
              color: t.color,
            }))
        );
      }
      setIsSearchingTarget(false);
    }, 300);
    return () => clearTimeout(t);
  }, [targetSearchTerm, targetType]);

  const selectProduct = (p: ProductSearchResult) => {
    setValue("productId", p.id);
    setSelectedProduct(p);
    setProdSearchTerm("");
    setProdResults([]);
  };

  const clearProduct = () => {
    setValue("productId", "");
    setSelectedProduct(null);
  };

  const selectTarget = (item: TargetSearchResult) => {
    setValue("targetId", item.id);
    setSelectedTarget(item);
    setTargetSearchTerm("");
    setTargetResults([]);
  };

  const clearTarget = () => {
    setSelectedTarget(null);
    setValue("targetId", "");
  };

  const onSubmit = (data: RateFormData) => {
    const payload = {
      id: initialData?.id,
      productId: data.productId,
      rate: Number(data.rate),
      type: data.type,
      isDisabled: data.isDisabled,
      affiliateId: data.targetType === "AFFILIATE" ? data.targetId : null,
      tierId: data.targetType === "TIER" ? data.targetId : null,
    };

    startTransition(async () => {
      const res = await upsertRateAction(payload);
      if (res.success) {
        toast.success(res.message);
        onSuccess();
      } else {
        toast.error(res.message);
      }
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="bg-white w-full max-w-xl rounded border border-[#c3c4c7] shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-[#f6f7f7] border-b border-[#c3c4c7] shrink-0">
          <div>
            <h3 className="text-[14px] font-semibold text-[#1d2327]">
              {initialData ? "Edit Override" : "Add Product Override"}
            </h3>
            <p className="text-[12px] text-[#50575e]">
              Set a custom commission rate for a specific product.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-[#646970] hover:text-[#1d2327] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="overflow-y-auto">
          <div className="p-4 space-y-4">

            {/* ── 1. Product Search ──────────────────────────────────────────── */}
            <div className="space-y-1.5">
              <label className="block text-[12px] font-semibold text-[#1d2327]">
                Target Product <span className="text-[#d63638]">*</span>
              </label>

              {!selectedProduct ? (
                <div className="relative">
                  <Search className="absolute left-2.5 top-2 w-3.5 h-3.5 text-[#646970]" />
                  <input
                    type="text"
                    value={prodSearchTerm}
                    onChange={(e) => setProdSearchTerm(e.target.value)}
                    placeholder="Type product name…"
                    autoFocus
                    className="w-full pl-8 pr-8 py-[6px] text-[13px] border border-[#8c8f94] rounded bg-white text-[#1d2327] placeholder-[#646970] focus:outline-none focus:border-[#2271b1] focus:ring-[3px] focus:ring-[#2271b1]/25"
                  />
                  {isSearchingProd && (
                    <Loader2 className="absolute right-2.5 top-2 w-3.5 h-3.5 animate-spin text-[#646970]" />
                  )}
                  {prodResults.length > 0 && (
                    <div className="absolute z-10 mt-1 w-full bg-white border border-[#c3c4c7] rounded shadow-lg max-h-52 overflow-y-auto">
                      {prodResults.map((p) => (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => selectProduct(p)}
                          className="w-full text-left px-3 py-2 hover:bg-[#f0f6fc] border-b border-[#f0f0f1] last:border-0 transition-colors"
                        >
                          <span className="text-[13px] font-medium text-[#1d2327] block">{p.name}</span>
                          <span className="text-[11px] text-[#646970]">
                            Price: {symbol}{Number(p.price).toFixed(2)}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center justify-between p-2.5 bg-[#f0f6fc] border border-[#2271b1]/30 rounded">
                  <div className="flex items-center gap-2 min-w-0">
                    <Package className="w-4 h-4 text-[#2271b1] shrink-0" />
                    <div className="min-w-0">
                      <span className="text-[13px] font-semibold text-[#1d2327] block truncate">
                        {selectedProduct.name}
                      </span>
                      <span className="text-[11px] text-[#646970]">
                        Price: {symbol}{Number(selectedProduct.price).toFixed(2)}
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={clearProduct}
                    className="text-[12px] text-[#2271b1] hover:text-[#135e96] hover:underline shrink-0 ml-2"
                  >
                    Change
                  </button>
                </div>
              )}
              <input type="hidden" {...register("productId", { required: true })} />
              {!selectedProduct && (
                <p className="text-[11px] text-[#646970] flex items-center gap-1">
                  <AlertCircle className="w-3 h-3 text-[#9a6700]" />
                  Product selection is required.
                </p>
              )}
            </div>

            <div className="border-t border-[#c3c4c7]" />

            {/* ── 2. Apply To ────────────────────────────────────────────────── */}
            <div className="space-y-1.5">
              <label className="block text-[12px] font-semibold text-[#1d2327]">
                Apply Override To
              </label>
              <select
                {...register("targetType")}
                className="w-full border border-[#8c8f94] rounded bg-white px-3 py-[6px] text-[13px] text-[#1d2327] focus:outline-none focus:border-[#2271b1] focus:ring-[3px] focus:ring-[#2271b1]/25"
              >
                <option value="GLOBAL">Everyone (Global Override)</option>
                <option value="AFFILIATE">Specific Affiliate Only</option>
                <option value="TIER">Specific Tier Only</option>
              </select>
            </div>

            {/* ── 3. Target Search (Affiliate / Tier) ────────────────────────── */}
            {targetType !== "GLOBAL" && (
              <div className="space-y-1.5">
                <label className="block text-[12px] font-semibold text-[#1d2327]">
                  Search {targetType === "AFFILIATE" ? "Affiliate" : "Tier"}{" "}
                  <span className="text-[#d63638]">*</span>
                </label>

                {!selectedTarget ? (
                  <div className="relative">
                    <Search className="absolute left-2.5 top-2 w-3.5 h-3.5 text-[#646970]" />
                    <input
                      type="text"
                      value={targetSearchTerm}
                      onChange={(e) => setTargetSearchTerm(e.target.value)}
                      placeholder={
                        targetType === "AFFILIATE"
                          ? "Type affiliate name or email…"
                          : "Type tier name…"
                      }
                      className="w-full pl-8 pr-8 py-[6px] text-[13px] border border-[#8c8f94] rounded bg-white text-[#1d2327] placeholder-[#646970] focus:outline-none focus:border-[#2271b1] focus:ring-[3px] focus:ring-[#2271b1]/25"
                    />
                    {isSearchingTarget && (
                      <Loader2 className="absolute right-2.5 top-2 w-3.5 h-3.5 animate-spin text-[#646970]" />
                    )}
                    {targetResults.length > 0 && (
                      <div className="absolute z-20 mt-1 w-full bg-white border border-[#c3c4c7] rounded shadow-lg max-h-48 overflow-y-auto">
                        {targetResults.map((item) => (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => selectTarget(item)}
                            className="w-full text-left px-3 py-2 hover:bg-[#f0f6fc] border-b border-[#f0f0f1] last:border-0 transition-colors"
                          >
                            <div className="flex items-center gap-2">
                              {targetType === "TIER" && item.color && (
                                <span
                                  className="w-2.5 h-2.5 rounded-full shrink-0"
                                  style={{ backgroundColor: item.color }}
                                />
                              )}
                              <span className="text-[13px] font-medium text-[#1d2327]">
                                {item.name}
                              </span>
                            </div>
                            {item.sub && (
                              <span className="text-[11px] text-[#646970] ml-0 pl-0">
                                {item.sub}
                              </span>
                            )}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center justify-between p-2.5 bg-[#f6f7f7] border border-[#c3c4c7] rounded">
                    <div className="flex items-center gap-2">
                      {targetType === "AFFILIATE" ? (
                        <User className="w-3.5 h-3.5 text-[#2271b1]" />
                      ) : (
                        <Trophy className="w-3.5 h-3.5 text-[#7c3aed]" />
                      )}
                      <span className="text-[13px] font-medium text-[#1d2327]">
                        {selectedTarget.name}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={clearTarget}
                      className="text-[#646970] hover:text-[#d63638] transition-colors"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
                <input
                  type="hidden"
                  {...register("targetId", { required: true })}
                />
                {!selectedTarget && (
                  <p className="text-[11px] text-[#646970] flex items-center gap-1">
                    <AlertCircle className="w-3 h-3 text-[#9a6700]" />
                    {targetType === "AFFILIATE" ? "Affiliate" : "Tier"} selection is required.
                  </p>
                )}
              </div>
            )}

            <div className="border-t border-[#c3c4c7]" />

            {/* ── 4. Commission Rate ─────────────────────────────────────────── */}
            <div className="space-y-1.5">
              <label className="block text-[12px] font-semibold text-[#1d2327]">
                Commission Rate
              </label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <span className="absolute left-2.5 top-[7px] text-[#50575e] text-[13px] font-medium select-none">
                    {commissionType === "FIXED" ? symbol : "%"}
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    {...register("rate")}
                    disabled={isDisabled}
                    placeholder="10"
                    className="w-full pl-7 pr-3 py-[6px] text-[13px] border border-[#8c8f94] rounded bg-white text-[#1d2327] font-medium disabled:bg-[#f6f7f7] disabled:text-[#8c8f94] focus:outline-none focus:border-[#2271b1] focus:ring-[3px] focus:ring-[#2271b1]/25"
                  />
                </div>
                <select
                  {...register("type")}
                  className="w-28 border border-[#8c8f94] rounded bg-white px-2 py-[6px] text-[13px] text-[#1d2327] focus:outline-none focus:border-[#2271b1] focus:ring-[3px] focus:ring-[#2271b1]/25"
                >
                  <option value="FIXED">Fixed ({symbol})</option>
                  <option value="PERCENTAGE">Percent (%)</option>
                </select>
              </div>
            </div>

            {/* ── 5. Disable Commission ──────────────────────────────────────── */}
            <div className="flex items-start gap-2.5 p-3 bg-[#f6f7f7] border border-[#c3c4c7] rounded">
              <input
                type="checkbox"
                id="isDisabled"
                {...register("isDisabled")}
                className="mt-0.5 w-4 h-4 rounded border-[#8c8f94] text-[#d63638] cursor-pointer"
              />
              <label
                htmlFor="isDisabled"
                className="text-[13px] text-[#1d2327] cursor-pointer select-none flex-1"
              >
                Disable commission on this product
                <span className="block text-[11px] text-[#50575e] mt-0.5">
                  Affiliates earn $0 commission for this product regardless of other rules.
                </span>
              </label>
            </div>

          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-2 px-4 py-3 bg-[#f6f7f7] border-t border-[#c3c4c7] shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-[6px] text-[13px] text-[#50575e] bg-white border border-[#c3c4c7] rounded hover:bg-[#f0f0f1] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="inline-flex items-center gap-1.5 px-4 py-[6px] text-[13px] font-medium text-white bg-[#2271b1] hover:bg-[#135e96] border border-[#135e96] rounded transition-colors disabled:opacity-60"
            >
              {isPending && <Loader2 className="w-3 h-3 animate-spin" />}
              {initialData ? "Update Override" : "Save Override"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
